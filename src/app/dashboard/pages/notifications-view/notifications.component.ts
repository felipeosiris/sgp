import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService, Notification } from '@app/services/notifications.service';
import { Subject, takeUntil } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationsService: NotificationsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Esperar a que el servicio se inicialice
    await this.notificationsService.initializeNotifications();
    
    // Suscribirse a las notificaciones
    this.notificationsService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        console.log('Notificaciones recibidas en componente:', notifications);
        this.notifications = notifications;
      });

    // Suscribirse al contador de no leídas
    this.notificationsService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        console.log('Contador de no leídas recibido en componente:', count);
        this.unreadCount = count;
      });

    // Suscribirse al estado de carga
    this.notificationsService.getIsLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  markAsRead(id: number) {
    this.notificationsService.markAsRead(id);
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead();
  }

  reloadNotifications() {
    this.notificationsService.reloadNotifications();
  }

  onNotificationClick(notification: Notification) {
    // Marcar como leída si no lo está
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }
    
    // Navegar según el tipo de notificación
    if (notification.type === 'RECORDATORIO') {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/home/inbox-view']);
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `hace ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} horas`;
    } else if (diffDays === 1) {
      return 'ayer';
    } else if (diffDays < 7) {
      return `hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }
} 