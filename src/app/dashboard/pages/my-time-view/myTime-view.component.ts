import {
  Component,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate,
} from '@angular/animations';
import { UserService, User } from '../../../services/user.service';
import { TimeRecordService, ActivityType, Cause, MonthlyTimeRecords, TimeRecord } from '../../../services/time-record.service';

interface TaskEntry {
  id: string;
  date: Date;
  activity: string;
  projectId?: number;
  hours: string;
  reason?: string;
  extraReason?: string;
  projectDisplayName?: string; // <-- Nuevo campo opcional
  causeId?: number;
  causeType?: string;
  causeDisplayName?: string;
}

interface DayWithEntries {
  date: Date;
  entries: TaskEntry[];
}

interface WeekWithDays {
  weekIndex: number;
  days: DayWithEntries[];
}

interface Project {
  id: number;
  displayName: string;
}

@Component({
  selector: 'app-myTime',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './myTime-view.component.html',
  styles: `
    :host {
      display: block;
    }
    .image-loading {
      opacity: 0;
      transition: opacity 0.3s ease-in;
    }
    .image-loaded {
      opacity: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export default class MyTimeComponent implements OnInit {
  user: User | null = null;
  allEntries: TaskEntry[] = [];
  monthWeeks: WeekWithDays[] = [];
  visibleWeek: WeekWithDays | null = null;

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  currentWeekIndex = 0;

  showModal = false;
  showSuccess = false;
  showMonthView: boolean = false;

  editingEntry: TaskEntry | null = null;
  selectedDay = new Date().getDate();
  selectedActivity = '';
  selectedProject = '';
  selectedReason: Cause | null = null;
  selectedHours = '';
  selectedExtraReason: Cause | null = null;

  showActivityDropdown = false;
  showProjectDropdown = false;
  showReasonDropdown = false;
  showHoursDropdown = false;
  showExtraReasonDropdown = false;

  activityOptions: string[] = [];
  projectOptions = [
    'IZZI PyME – ID IZ04',
    'IZZI Bestel – ID IZ03',
    'Grisi – ID GR01',
    'Interceramic – ID IN02',
    'City Club – ID CC05'
  ];

  selectedProjectId: number | null = null;

  unassignedReasons: Cause[] = [];
  extraHoursReasons: Cause[] = [];

  currentWeek: { day: string; date: number; fullDate: Date }[] = [];
  monthDays: { date: number | null; fullDate: Date | null; isBlank: boolean; isGray?: boolean }[] = [];

  dayNames: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  hourOptions = ['1 hora', '2 horas', '3 horas', '4 horas', '5 horas', '6 horas', '7 horas', '8 horas'];

  defaultAvatar = 'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png';
  imageLoading = true;

  // Nuevas propiedades para los catálogos
  activityTypes: ActivityType[] = [];
  causes: Cause[] = [];
  projects: Project[] = [];
  private _isOvertime = false;
  errorMessage: string = '';
  showErrorModal: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private timeRecordService: TimeRecordService
  ) {}

  ngOnInit() {
    // Cargar el usuario y sus catálogos
    const today = new Date();
    this.loadEntriesFromStorage();
    // Obtener el usuario directamente del localStorage y cambiar la lógica
    if (this.isBrowser()) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          console.log('savedUser', savedUser);
          const userData: User = JSON.parse(savedUser);
          this.user = userData;
          console.log('Usuario cargado:', this.user.id, this.user.name);
          // Cargar catálogos una vez que tengamos el ID del usuario
          this.loadTimeRecordCatalogs(this.user.id);
          // Cargar registros del mes actual
          this.loadMonthlyTimeRecords(this.user.id);
        } catch (error) {
          console.error('Error al parsear el usuario desde localStorage:', error);
        }
      } else {
        console.error('No se encontró usuario en localStorage');
      }
    }
    this.cdr.detectChanges();
  }

  loadTimeRecordCatalogs(userId: number) {
    this.timeRecordService.getTimeRecordCatalogs(userId).subscribe({
      next: (catalogs) => {
        this.activityTypes = catalogs.activityTypes;
        this.causes = catalogs.causes;
        this.projects =  catalogs.projects;
        
        // Actualizar las opciones de actividad
        this.activityOptions = this.activityTypes.map(type => type.displayName);

        // Llamar getCausesByType para inicializar razones de "Sin asignación"
        this.unassignedReasons = this.getCausesByType('SIN_ASIGNACION');

        this.extraHoursReasons = this.getCausesByType('TXP_JORNADA');
        
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        console.error('Error al cargar catálogos:', error);
      }
    });
  }

  loadMonthlyTimeRecords(userId: number) {
    //if (!this.user?.id) return;

    const monthDate = new Date(this.currentYear, this.currentMonth, 1).toISOString().split('T')[0];
    
    this.timeRecordService.getMonthlyTimeRecords(userId, monthDate).subscribe({
      next: (data: MonthlyTimeRecords) => {
        // Convertir los registros del API al formato TaskEntry
        this.allEntries = this.convertTimeRecordsToTaskEntries(data);
        
        // Reconstruir las semanas y actualizar la vista
        this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
        const today = new Date(this.currentYear, this.currentMonth, this.selectedDay);
        this.filterWeekByDate(today);
        
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        console.error('Error al cargar registros mensuales:', error);
        // Si falla la carga del API, usar datos del localStorage como respaldo
        this.loadEntriesFromStorage();
      }
    });
  }

  convertTimeRecordsToTaskEntries(monthlyData: MonthlyTimeRecords): TaskEntry[] {
    const entries: TaskEntry[] = [];
    
    monthlyData.weeks.forEach(week => {
      week.timeRecords.forEach(record => {
        entries.push({
          id: record.id.toString(),
          date: this.adjustDateToCDMX(record.registerDate),
          activity: record.activityDisplayName,
          projectId: record.projectId,
          hours: record.workedHours.toString(),
          projectDisplayName: record.projectDisplayName,
          causeId: record.causeId,
          causeType: record.causeType,
          causeDisplayName: record.causeDisplayName
        });
      });
    });
    
    return entries;
  }

  getSelectedWeekDayIndexes(): number[] {
    const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    const dayOfWeek = selectedDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() + mondayOffset);

    const indexes: number[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      if (d.getMonth() === this.currentMonth) {
        indexes.push(d.getDate());
      }
    }

    return indexes;
  }

  isFutureDate(day: number | Date): boolean {
    const today = new Date();
    const compareDate = typeof day === 'number'
      ? new Date(this.currentYear, this.currentMonth, day)
      : new Date(day);
    return compareDate > today;
  }

  isFutureDay(day?: number): boolean {
    if (day === undefined) return false;
    const today = new Date();
    const date = new Date(this.currentYear, this.currentMonth, day);
    return date > new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  filterWeekByDate(date: Date) {
    const index = this.monthWeeks.findIndex(week =>
      week.days.some(d => this.isSameDay(d.date, date))
    );
    if (index !== -1) {
      this.currentWeekIndex = index;
      this.visibleWeek = this.monthWeeks[index];
    }
  }

  selectActivity(val: string) { 
    this.selectedActivity = val; 
    this.showActivityDropdown = false; 

    // Si la actividad seleccionada es "Sin asignación", cargar razones correspondientes
    if (val === 'Sin asignación') {
      this.unassignedReasons = this.getCausesByType('SIN_ASIGNACION');
    }
  }
  selectProject(val: Project) { this.selectedProject = val.displayName; this.showProjectDropdown = false; this.selectedProjectId = val.id; console.log(this.selectedProjectId);}
  selectReason(val: Cause) { this.selectedReason = val; this.showReasonDropdown = false; console.log(this.selectedReason); }
  selectHours(val: string) { 
    this.selectedHours = val; 
    this.showHoursDropdown = false; 
    this.checkForOvertime();
  }
  selectExtraReason(val: Cause) { this.selectedExtraReason = val; this.showExtraReasonDropdown = false; console.log(this.selectedExtraReason); }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }

    // Cargar datos del nuevo mes
    // TODO: se deja para local
    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    this.currentWeekIndex = 0;
    this.visibleWeek = this.monthWeeks[0];
    this.loadMonthlyTimeRecords(this.user?.id || 0);
    this.generateMonthDays();
    this.cdr.detectChanges();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }

    // Cargar datos del nuevo mes
    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    this.currentWeekIndex = 0;
    this.visibleWeek = this.monthWeeks[0];
    this.loadMonthlyTimeRecords(this.user?.id || 0);
    this.generateMonthDays();
    this.cdr.detectChanges();
  }

  generateMonthDays(): void {
    this.monthDays = [];

    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const totalDaysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    const firstWeekDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;

    // Días del mes anterior para llenar la primera semana
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const prevMonthDate = new Date(this.currentYear, this.currentMonth - 1, 1);

    for (let i = firstWeekDay - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      const fullDate = new Date(this.currentYear, this.currentMonth - 1, date);
      this.monthDays.push({ date, fullDate, isBlank: false, isGray: true });
    }

    // Días del mes actual
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const fullDate = new Date(this.currentYear, this.currentMonth, day);
      this.monthDays.push({ date: day, fullDate, isBlank: false, isGray: false });
    }

    // Días del mes siguiente para completar las filas del calendario
    const totalCells = this.monthDays.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
      const fullDate = new Date(this.currentYear, this.currentMonth + 1, i);
      this.monthDays.push({ date: i, fullDate, isBlank: false, isGray: true });
    }
    this.loadMonthlyTimeRecords(this.user?.id || 0);
  }


  getMonthName(): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[this.currentMonth];
  }

  buildWeeksWithEntries(entries: TaskEntry[], month: number, year: number): WeekWithDays[] {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const start = new Date(firstDayOfMonth);
    const end = new Date(lastDayOfMonth);

    // Ajustar inicio al lunes anterior si no empieza en lunes
    const dayOfWeekStart = start.getDay();
    const offsetToMonday = dayOfWeekStart === 0 ? -6 : 1 - dayOfWeekStart;
    start.setDate(start.getDate() + offsetToMonday);

    // Ajustar fin al domingo siguiente si no termina en domingo
    const dayOfWeekEnd = end.getDay();
    const offsetToSunday = dayOfWeekEnd === 0 ? 0 : 7 - dayOfWeekEnd;
    end.setDate(end.getDate() + offsetToSunday);

    const weeks: WeekWithDays[] = [];
    let current = new Date(start);
    let weekIndex = 0;

    while (current <= end) {
      const days: DayWithEntries[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(current);
        // Ordenar las entradas por ID antes de filtrar por día
        const sortedEntries = [...entries].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        const dayEntries = sortedEntries.filter(e => this.isSameDay(e.date, date));
        days.push({ date, entries: dayEntries });
        current.setDate(current.getDate() + 1);
      }

      weeks.push({ weekIndex, days });
      weekIndex++;
    }

    return weeks;
  }

  addSampleEntry(forDate: Date): void {
    const entry: TaskEntry = {
      id: Math.random().toString(36).substr(2),
      date: forDate,
      activity: 'Proyecto',
      projectId: 1,
      hours: '2',
      reason: ''
    };
    this.addEntry(entry);
  }

  addEntry(entry: TaskEntry) {
    this.allEntries.push(entry);
    this.saveEntriesToStorage();
    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    this.filterWeekByDate(new Date(this.currentYear, this.currentMonth, this.selectedDay));
    this.cdr.detectChanges();
  }

  getDayClasses(date: Date): string {
    const selected = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    return this.isSameDay(date, selected)
      ? 'text-white'
      : 'text-white';
  }

  getDayBackgroundColor(date: Date): string {
    const selected = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    return this.isSameDay(date, selected) ? '#FFBB3B' : '#112658';
  }


  goToPreviousWeek() {
    const previousWeekStart = new Date(this.visibleWeek?.days[0].date || new Date());
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    // Actualiza mes y año si cambia
    this.currentMonth = previousWeekStart.getMonth();
    this.currentYear = previousWeekStart.getFullYear();

    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    const weekIndex = this.monthWeeks.findIndex(week =>
      week.days.some(d => this.isSameDay(d.date, previousWeekStart))
    );

    this.currentWeekIndex = weekIndex !== -1 ? weekIndex : 0;
    this.visibleWeek = this.monthWeeks[this.currentWeekIndex];

    const validDay = this.visibleWeek.days.find(d => d.date.getTime() > 0);
    if (validDay) this.selectedDay = validDay.date.getDate();

    this.generateMonthDays();
    this.cdr.detectChanges();
  }

  goToNextWeek() {
    const nextWeekStart = new Date(this.visibleWeek?.days[0].date || new Date());
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    // Actualiza mes y año si cambia
    this.currentMonth = nextWeekStart.getMonth();
    this.currentYear = nextWeekStart.getFullYear();

    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    const weekIndex = this.monthWeeks.findIndex(week =>
      week.days.some(d => this.isSameDay(d.date, nextWeekStart))
    );

    this.currentWeekIndex = weekIndex !== -1 ? weekIndex : 0;
    this.visibleWeek = this.monthWeeks[this.currentWeekIndex];

    const validDay = this.visibleWeek.days.find(d => d.date.getTime() > 0);
    if (validDay) this.selectedDay = validDay.date.getDate();

    this.generateMonthDays();
    this.cdr.detectChanges();
  }


  onSelectDayFromWeek(day: any) {
    this.selectedDay = day.date;
    this.currentMonth = day.fullDate.getMonth();
    this.currentYear = day.fullDate.getFullYear();
    this.cdr.detectChanges();
  }

  openModal(forDate?: Date | null): void {
    this.resetForm();

    if (forDate) {
      const selected = this.visibleWeek?.days.find(d =>
        d.date.getFullYear() === forDate.getFullYear() &&
        d.date.getMonth() === forDate.getMonth() &&
        d.date.getDate() === forDate.getDate()
      );

      if (selected) {
        this.selectedDay = selected.date.getDate();
        this.currentMonth = selected.date.getMonth();
        this.currentYear = selected.date.getFullYear();
      }
    }

    this.showModal = true;
    this.checkForOvertime();
  }

  cancelEntry() {
    this.showModal = false;
    this.resetForm();
  }

  submitTimeEntry() {
    this.errorMessage = '';
    if (
      !this.selectedActivity ||
      !this.selectedHours ||
      (this.selectedActivity === 'Proyecto' && !this.selectedProject) ||
      (this.selectedActivity === 'Sin asignación' && !this.selectedReason)
    ) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    const selectedDate = this.adjustDateToCDMX(new Date(this.currentYear, this.currentMonth, this.selectedDay));
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const selectedHoursNumber = parseInt(this.selectedHours, 10);

    const totalHoursToday = this.getTotalHoursForDay(selectedDate) + selectedHoursNumber;

    if (totalHoursToday > 8 && !this.selectedExtraReason) {
      this.errorMessage = 'Por favor indica el motivo por el que se exceden las 8 horas';
      return;
    }

    if (this.editingEntry) {
      this.editingEntry.activity = this.selectedActivity;
      this.editingEntry.projectId = this.selectedProjectId || undefined;
      this.editingEntry.hours = this.selectedHours;
      this.editingEntry.date = selectedDate;
      this.editingEntry.reason = this.selectedActivity === 'Sin asignación' ? this.selectedReason?.displayName : undefined;
    } else {
      const existingEntry = this.allEntries.find(entry =>
        entry.date.toISOString().split('T')[0] === formattedDate &&
        entry.activity === this.selectedActivity &&
        entry.projectId === (this.selectedProject || undefined)
      );

      if (existingEntry) {
        const currentHours = parseInt(existingEntry.hours, 10) || 0;
        existingEntry.hours = (currentHours + selectedHoursNumber).toString();
      } else {
        // Aquí se realiza el consumo del servicio como paso intermedio antes de agregar la entrada localmente

        // Primero, construimos el payload que espera el servicio
        const activityType = this.activityTypes.find(type => type.displayName === this.selectedActivity);
        var cause: Cause | null = null;
        if (this.selectedReason != null) {
          cause =  this.selectedReason
        }

        if (this.selectedExtraReason != null) {
          cause = this.selectedExtraReason
        }
        const userId = this.user?.id ?? 1; // Ajusta según tu lógica real
        const workWeekId = 1; // Ajusta según tu lógica real
        const projectId = this.selectedProject ? Number((this.selectedProject.match(/ID (\w+)/) || [])[1]) || null : null;
        const payload = {
          userId: userId,
          activityTypeId: activityType ? activityType.id : 0,
          registerDate: selectedDate.toISOString().split('T')[0],
          hours: parseInt(this.selectedHours, 10),
          description: this.selectedActivity === 'Sin asignación' ? this.selectedReason?.displayName : undefined,
          projectId: this.selectedProjectId ? parseInt(this.selectedProjectId as any, 10) : 0,
          causeId: (this.selectedActivity === 'Sin asignación' || this.isOvertime) && cause ? cause.id : null,
          workWeekId: workWeekId
        };
        console.log('cause:', cause);
        console.log("selectedReason", this.selectedReason)
        console.log("selectedExtraReason", this.selectedExtraReason)
        this.timeRecordService.createTimeRecord(payload).subscribe({
          next: (response) => {
            // Si el servicio responde correctamente, agregar la entrada localmente
            const newEntry: TaskEntry = {
              id: this.generateUniqueId(),
              date: selectedDate,
              activity: this.selectedActivity,
              projectId: this.selectedProjectId || 0,
              hours: this.selectedHours,
              reason: this.selectedActivity === 'Sin asignación' ? this.selectedReason?.displayName : undefined
            };
            this.allEntries.push(newEntry);
            this.loadMonthlyTimeRecords(this.user?.id || 0);
            this.cdr.detectChanges();
            // Aquí podrías manejar alguna lógica adicional si es necesario
          },
          error: (error) => {
            this.showErrorModal = true;
            console.error(error);
          }
        });
      }
    }

    // ✅ Guardar y sincronizar datos en UI
    this.saveEntriesToStorage();
    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    const updatedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    this.filterWeekByDate(updatedDate);

    this.showModal = false;
    this.showSuccess = true;
    this.resetForm();
    this.cdr.detectChanges();
  }


  generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9); // forma rápida
  }

  acknowledgeSuccess() {
    this.showSuccess = false;
  }

  resetForm() {
    this.selectedActivity = '';
    this.selectedProject = '';
    this.selectedProjectId = null;
    this.selectedHours = '';
    this.selectedReason = null;
    this.selectedExtraReason = null;  
    this.editingEntry = null;
    this.showActivityDropdown = false;
    this.showProjectDropdown = false;
    this.showReasonDropdown = false;
    this.showHoursDropdown = false;
    this.showExtraReasonDropdown = false;
    this._isOvertime = false;
  }

  getEntriesForDate(date: Date): TaskEntry[] {
    return this.allEntries.filter(entry => entry.date.toDateString() === date.toDateString());
  }

  getTotalHoursForDay(targetDate: Date): number {
    return this.allEntries
      .filter(entry => this.isSameDay(entry.date, targetDate))
      .reduce((sum, entry) => sum + parseInt(entry.hours, 10), 0);
  }

  getTotalHours(): number {
    return this.allEntries.reduce((acc, entry) => acc + parseFloat(entry.hours), 0);
  }

  getHoursByCategory(): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    this.allEntries.forEach(entry => {
      const baseKey = entry.activity;
      const key = entry.projectId ? `${baseKey} – ID ${entry.projectId}` : baseKey;
      summary[key] = (summary[key] || 0) + parseFloat(entry.hours);
    });
    return summary;
  }

  getProgressPercentage(): number {
    const total = this.getTotalHours();
    return Math.min((total / 480) * 100, 100); // Limita al 100%
  }

  isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  getHeightForHours(hours: string): number {
    const match = hours.match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 1;
    const blockHeight = 40; // altura visual real por 1 hora
    const height = num * blockHeight + (num - 1) * 8;
    return Math.max(height, 74); // 56px como mínimo
  }

  getBarWidth(hours: string): number {
    const num = parseInt(hours) || 1;
    const clamped = Math.min(num, 8);
    return clamped * 12 + 24; // ejemplo: de 36px a 120px
  }

  getColorForActivity(activityName: string): string {
    const activityType = this.activityTypes.find(type => type.displayName === activityName);
    return activityType?.color || '#CCCCCC'; // Color por defecto si no se encuentra
  }

  getColorForKey(key: string): string {
    const activity = key.split(' – ')[0]; // extrae 'Proyecto' o 'Certificado', etc.
    return this.getColorForActivity(activity);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate()
      && date.getMonth() === today.getMonth()
      && date.getFullYear() === today.getFullYear();
  }

  isWeekSelected(week: { date: Date; isGray: boolean }[]): boolean {
    const selected = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    return week.some(cell => !cell.isGray && this.isSameDay(cell.date, selected));
  }

  selectFromCompactCalendar(date: Date, isGray: boolean): void {
    this.selectedDay = date.getDate();

    if (isGray) {
      if (date.getMonth() < this.currentMonth || (this.currentMonth === 0 && date.getMonth() === 11)) {
        // Día del mes anterior
        if (this.currentMonth === 0) {
          this.currentMonth = 11;
          this.currentYear--;
        } else {
          this.currentMonth--;
        }
      } else {
        // Día del mes siguiente
        if (this.currentMonth === 11) {
          this.currentMonth = 0;
          this.currentYear++;
        } else {
          this.currentMonth++;
        }
      }
    }

    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    const dateToSearch = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    this.filterWeekByDate(dateToSearch);
    this.generateMonthDays(); // Actualiza la vista compacta
    this.cdr.detectChanges();
  }

  selectDayFromWeek(date: Date): void {
    this.selectedDay = date.getDate();
    this.currentMonth = date.getMonth();
    this.currentYear = date.getFullYear();
    this.filterWeekByDate(date);
    this.cdr.detectChanges();
  }

  get isOvertime(): boolean {
    if (!this.selectedHours || !this.selectedActivity) return false;

    const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    const currentTotal = this.getTotalHoursForDay(selectedDate);
    const extra = parseInt(this.selectedHours, 10);

    if (isNaN(extra)) return false;

    return currentTotal + extra > 8;
  }

  getCalendarWeeks(): { date: Date; isGray: boolean }[][] {
    const days: { date: Date; isGray: boolean }[] = [];

    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let dayOfWeek = firstDayOfMonth.getDay(); // 0 = domingo
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // ➤ Días del mes anterior para rellenar
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth, -i);
      days.push({ date, isGray: true });
    }

    // ➤ Días del mes actual
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      days.push({ date, isGray: false });
    }

    // ➤ Días del mes siguiente para completar la última fila
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(this.currentYear, this.currentMonth + 1, i);
        days.push({ date, isGray: true });
      }
    }

    // ➤ Agrupar en semanas
    const weeks: { date: Date; isGray: boolean }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  }

  toggleMonthView() {
    this.showMonthView = !this.showMonthView;

    if (this.showMonthView) {
      // Recalcular semanas y vista visible cuando se activa la vista mensual
      this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
      const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
      this.filterWeekByDate(selectedDate);
      this.generateMonthDays();
    }

    this.cdr.detectChanges();
  }


  onDeleteEntry(entry: TaskEntry, event: MouseEvent) {
    event.stopPropagation(); // Evita que se dispare el click del contenedor

    // Convertir el ID a número
    const numericId = parseInt(entry.id);
    
    if (!isNaN(numericId)) {
      // Llamar al servicio para eliminar el registro
      this.timeRecordService.deleteTimeRecord(numericId).subscribe({
        next: () => {
          // Eliminar entrada localmente
          this.allEntries = this.allEntries.filter(e => e.id !== entry.id);
          
          // Guardar en localStorage
          this.saveEntriesToStorage();
          
          // Reconstruir semanas y actualizar vista
          this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
          
          const updatedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
          this.filterWeekByDate(updatedDate);
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al eliminar el registro:', error);
          alert('Hubo un error al eliminar el registro. Por favor, intente nuevamente.');
        }
      });
    } else {
      console.error('ID inválido:', entry.id);
      alert('No se puede eliminar este registro porque tiene un ID inválido.');
    }
  }


  onEditEntry(entry: TaskEntry) {
    this.editingEntry = entry;
    this.selectedActivity = entry.activity;
    this.selectedProjectId = entry.projectId || 0;
    this.selectedProject = entry.projectDisplayName || '';
    const cause = this.causes.find(c => c.id === entry.causeId) || null;

    if (entry.causeType == "SIN_ASIGNACION") {
      this.selectedReason = cause;
    } else {
      this.selectedReason = null;
    }

    if (entry.causeType == "TXP_JORNADA") {
      this.selectedExtraReason = cause;
    } else {
      this.selectedExtraReason = null;
    }

    this.selectedHours = entry.hours;
    this.selectedDay = entry.date.getDate();
    
    // Aquí actualizas el flag de overtime
    this._isOvertime = entry.causeType === 'TXP_JORNADA';
    this.showModal = true;
  }

  onSelectCalendarDay(cell: { date: Date; isGray: boolean }) {
    const selectedDate = cell.date;

    this.selectedDay = selectedDate.getDate();
    this.currentMonth = selectedDate.getMonth();
    this.currentYear = selectedDate.getFullYear();

    // Si cambia el mes, cargar los nuevos datos
    this.loadMonthlyTimeRecords(this.user?.id || 0);
    this.generateMonthDays();
    this.filterWeekByDate(selectedDate);
    this.cdr.detectChanges();
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  saveEntriesToStorage(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem('taskEntries', JSON.stringify(this.allEntries));
  }

  loadEntriesFromStorage(): void {
    if (!this.isBrowser()) return;
    const saved = localStorage.getItem('taskEntries');
    if (saved) {
      this.allEntries = JSON.parse(saved).map((e: any) => ({
        ...e,
        date: this.adjustDateToCDMX(e.date)
      }));
    }

    this.monthWeeks = this.buildWeeksWithEntries(this.allEntries, this.currentMonth, this.currentYear);
    const today = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    this.filterWeekByDate(today);
  }

  clearAllEntries(): void {
    this.allEntries = [];
    this.monthWeeks = [];
    this.visibleWeek = null;
    localStorage.removeItem('taskEntries');
    this.cdr.detectChanges();
  }

  handleImageError(event: any) {
    event.target.src = this.defaultAvatar;
    this.imageLoading = false;
    this.cdr.detectChanges();
  }

  handleImageLoad(event: any) {
    this.imageLoading = false;
    event.target.classList.remove('image-loading');
    event.target.classList.add('image-loaded');
    this.cdr.detectChanges();
  }

  // Método para obtener las razones según el tipo
  getCausesByType(type: string): Cause[] {
    return this.causes.filter(cause => cause.type === type);
  }

  // Nuevo método checkForOvertime
  checkForOvertime(): void {
    // Calcula el total de horas para el día seleccionado
    const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    const horasActuales = this.getTotalHoursForDay(selectedDate);
    const horasNuevas = parseInt(this.selectedHours, 10) || 0;
    const total = horasActuales + (this.editingEntry ? 0 : horasNuevas); // Si estamos editando, no sumamos las horas nuevas

    this._isOvertime = total > 8;
    
    this.cdr.detectChanges();
  }

  // Método para mostrar el combo de motivo de horas extra solo cuando corresponde
  shouldShowOvertimeCombo(): boolean {
    // Si estás editando, solo muestra si el registro es overtime
    if (this.editingEntry) {
      return this.editingEntry.causeType === 'TXP_JORNADA';
    }
    // Si no estás editando, usa el flag normal
    return this.isOvertime;
  }

  // Función de utilidad para ajustar fechas a CDMX
  private adjustDateToCDMX(date: string | Date): Date {
    const d = new Date(date);
    return new Date(d.getTime() + (6 * 60 * 60 * 1000)); // Ajusta 6 horas para CDMX (UTC-6)
  }

}