import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService, ValidacionColaborador, ValidacionAdmin } from '../../services/project.service';
import { UserService } from '../../../services/user.service';

interface ValidacionTiempo {
  usuario: string;
  rol: string;
  actividad: string;
  id: string;
  horasEstimadas: string;
  periodo: string;
  tiempoDiario: string;
  estado: string;
}

@Component({
  selector: 'app-inbox-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './inbox-view.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export default class InboxViewComponent implements OnInit {
  home: string = '/home';
  isAdminView: boolean = false;
  validacionesColaborador: ValidacionColaborador[] = [];
  validacionesAdmin: ValidacionAdmin[] = [];
  isLeader: boolean = false;
  isCollaborator: boolean = false;
  showRejectModal = false;
  showDetailModal = false;
  selectedValidation: ValidacionAdmin | null = null;

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Obtener el userId correctamente desde localStorage
    let userId = 1; // valor por defecto
    if (this.isBrowser()) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj && userObj.id) {
            userId = userObj.id;
          }
        } catch (e) {
          console.error('Error al parsear el usuario desde localStorage:', e);
        }
      }
    }

    // Cargar validaciones de colaborador
    this.projectService.getValidationsByUserId(userId).subscribe({
      next: (validaciones) => {
        this.validacionesColaborador = validaciones;
        this.isCollaborator = validaciones.length > 0;
        console.log('Validaciones del servicio:', validaciones);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener validaciones:', error);
      }
    });

    // Cargar validaciones de administrador/líder
    this.projectService.getTimeAprovalPendingRecords(userId).subscribe({
      next: (validaciones) => {
        this.validacionesAdmin = validaciones;
        this.isLeader = validaciones.length > 0;
        console.log('Validaciones de administrador:', validaciones);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener validaciones de administrador:', error);
      }
    });
  }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  validaciones: ValidacionTiempo[] = [];

  getValidaciones(): ValidacionTiempo[] {
    return this.validaciones;
  }

  formatDateRange(startDate: string, endDate: string): string {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Formatear fechas en español
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short'
      };

      const startFormatted = start.toLocaleDateString('es-ES', options).toUpperCase();
      const endFormatted = end.toLocaleDateString('es-ES', options).toUpperCase();

      // Calcular días de diferencia
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días

      return `${startFormatted} al ${endFormatted} (${diffDays} días)`;
    } catch (error) {
      console.error('Error al formatear fechas:', error);
      return `${startDate} al ${endDate}`;
    }
  }

  formatHours(hours: number | string): string {
    // Convertir a número si viene como string
    let numericHours: number;
    if (typeof hours === 'string') {
      numericHours = parseFloat(hours);
    } else {
      numericHours = hours;
    }

    if (numericHours === null || numericHours === undefined || isNaN(numericHours)) {
      console.log('Valor inválido para formatHours:', hours, typeof hours);
      return '0.0 horas';
    }

    console.log('Formateando horas:', numericHours, 'a', `${numericHours.toFixed(1)} horas`);
    return `${numericHours.toFixed(1)} horas`;
  }

  formatDailyAverage(validacion: ValidacionColaborador): string {
    console.log('Formateando promedio diario para validación:', validacion);
    console.log('dailyAverage:', validacion.dailyAverage, typeof validacion.dailyAverage);
    return this.formatHours(validacion.dailyAverage);
  }

  formatAdminDailyAverage(validacion: ValidacionAdmin): string {
    return this.formatHours(validacion.dailyAverage);
  }

  getInitialsAvatar(name: string): string {
    if (!name) return 'https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=U';
    
    const names = name.trim().split(' ');
    let initials = '';
    
    if (names.length >= 2) {
      initials = names[0].charAt(0) + names[names.length - 1].charAt(0);
    } else if (names.length === 1) {
      initials = names[0].charAt(0);
    } else {
      initials = 'U';
    }
    
    return `https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=${encodeURIComponent(initials)}`;
  }

  onImageError(event: Event, name: string): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.getInitialsAvatar(name);
    }
  }

  getApprovalStatusClass(approvalStatus: string): string {
    console.log('Estado de aprobación recibido:', approvalStatus, typeof approvalStatus);

    // Normalizar el estado (convertir a minúsculas y quitar espacios)
    const normalizedStatus = approvalStatus?.toLowerCase().trim();
    console.log('Estado normalizado:', normalizedStatus);

    if (normalizedStatus === 'approved' || normalizedStatus === 'aprobado' || normalizedStatus === 'aprobada') {
      return 'bg-green-100 text-green-800';
    } else if (normalizedStatus === 'rejected' || normalizedStatus === 'rechazado' || normalizedStatus === 'rechazada') {
      return 'bg-red-100 text-red-800';
    } else if (normalizedStatus === 'pending' || normalizedStatus === 'pendiente') {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      console.log('Estado no reconocido, usando amarillo por defecto:', normalizedStatus);
      return 'bg-yellow-100 text-yellow-800';
    }
  }

  getApprovalStatusText(approvalStatus: string): string {
    const normalizedStatus = approvalStatus?.toLowerCase().trim();

    if (normalizedStatus === 'approved' || normalizedStatus === 'aprobado' || normalizedStatus === 'aprobada') {
      return 'Aprobado';
    } else if (normalizedStatus === 'rejected' || normalizedStatus === 'rechazado' || normalizedStatus === 'rechazada') {
      return 'Rechazado';
    } else {
      return 'Pendiente';
    }
  }

  openRejectModal(validacion: ValidacionAdmin) {
    this.selectedValidation = validacion;
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedValidation = null;
  }

  openDetailModal(validacion: ValidacionAdmin) {
    this.selectedValidation = validacion;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedValidation = null;
  }

  updateStatus(status: boolean) {
    if (!this.selectedValidation) return;
    // registroHorasIds puede ser string separado por comas, lo convertimos a array de números
    let ids: number[] = [];
    if (typeof this.selectedValidation.registroHorasIds === 'string') {
      ids = this.selectedValidation.registroHorasIds.split(',').map(id => Number(id.trim()));
    }
    const body = {
      leaderId: this.selectedValidation.userId, // userId es el líder
      timeRegistrationIds: ids,
      status: status
    };
    this.projectService.updateTimeApprovalStatus(body).subscribe({
      next: () => {
        this.closeRejectModal();
        this.closeDetailModal();
        this.ngOnInit(); // Refresca los datos
      },
      error: (err) => {
        alert('Error al actualizar el estado');
      }
    });
  }
}
