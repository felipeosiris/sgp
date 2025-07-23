import { Component, OnInit } from '@angular/core';
import { PersonasService, Persona } from '../../../services/personas.service';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  isGray: boolean;
}

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-equipo.component.html',
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
  `
})
export class MiEquipoComponent implements OnInit {
  // Variables para el mes actual
  currentMonthDisplay: string = 'MARZO 2025';
  
  // Estadísticas generales
  stats = {
    proyectosAsignados: 4,
    tiempoDisponible: '480 h',
    tiempoInvertido: '720 h',
    horasExtra: '240h',
    diasRestantes: '4 días',
    diasPlaya: '2 días'
  };

  // Datos del equipo
  equipo: Persona[] = [];
  
  // Variable para controlar el estado de carga de las imágenes
  imageLoading = true;
  defaultAvatar = 'https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=';

  // Variable para la persona seleccionada
  selectedPerson: string = 'Marguerite Yourcenar';

  // Datos de la barra de progreso
  progressData = {
    proyectos: 50,
    certificado: 20,
    idioma: 15,
    sinAsignacion: 15
  };

  // Calendar properties
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedDay = new Date().getDate();
  calendarWeeks: CalendarDay[][] = [];

  constructor(private personasService: PersonasService) {}

  ngOnInit() {
    this.personasService.getPersonas().subscribe(personas => {
      this.equipo = personas;
    });
    this.generateCalendarWeeks();
  }

  getUserIdFromLocalStorage(): number {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.id) {
          return userObj.id;
        }
      } catch (e) {
        console.error('Error al parsear el usuario desde localStorage:', e);
      }
    }
    return 15; // fallback
  }

  // Método para manejar errores de carga de imágenes
  handleImageError(event: any, nombre: string) {
    event.target.src = this.defaultAvatar + encodeURIComponent(nombre);
  }

  // Método para manejar la carga exitosa de imágenes
  handleImageLoad(event: any) {
    event.target.classList.add('image-loaded');
    this.imageLoading = false;
  }

  // Método para seleccionar una persona
  selectPerson(nombre: string) {
    this.selectedPerson = nombre;
  }

  // Método para obtener el color de cada tipo de actividad
  getActivityColor(type: string): string {
    const colors = {
      proyectos: 'bg-blue-400',
      certificado: 'bg-green-400',
      idioma: 'bg-yellow-400',
      sinAsignacion: 'bg-purple-400',
      sinRegistrar: 'bg-gray-400'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-400';
  }

  // Método para obtener la URL del avatar
  getAvatarUrl(persona: Persona): string {
    return persona.imagen || this.defaultAvatar + encodeURIComponent(persona.nombre);
  }

  getMonthName(): string {
    return new Date(this.currentYear, this.currentMonth).toLocaleString('es-ES', { month: 'long' });
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendarWeeks();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendarWeeks();
  }

  generateCalendarWeeks(): void {
    const days: CalendarDay[] = [];
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let dayOfWeek = firstDayOfMonth.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Días del mes anterior
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth, -i);
      days.push({ date, isGray: true });
    }

    // Días del mes actual
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      days.push({ date, isGray: false });
    }

    // Días del mes siguiente
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(this.currentYear, this.currentMonth + 1, i);
        days.push({ date, isGray: true });
      }
    }

    // Agrupar en semanas
    this.calendarWeeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.calendarWeeks.push(days.slice(i, i + 7));
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  onSelectDay(day: CalendarDay): void {
    this.selectedDay = day.date.getDate();
    if (day.isGray) {
      if (day.date.getMonth() < this.currentMonth || 
          (this.currentMonth === 0 && day.date.getMonth() === 11)) {
        // Día del mes anterior
        this.prevMonth();
      } else {
        // Día del mes siguiente
        this.nextMonth();
      }
    }
  }
} 