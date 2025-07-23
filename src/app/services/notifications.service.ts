import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface Notification {
  id: number;
  targetUserId: number;
  type: 'APROBACION' | 'RECHAZO' | 'ASIGNACION' | 'RECORDATORIO';
  message: string;
  creationDate: string;
  isRead: boolean;
  readDate: string | null;
  senderUserId: number;
}

interface MarkAsReadRequest {
  usuarioId: number;
  notificationIds: number[];
}

interface MarkAsReadResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly API_URL = 'https://express-pg-app-qa.fly.dev/api';
  private notifications = new BehaviorSubject<Notification[]>([]);
  private unreadCount = new BehaviorSubject<number>(0);
  private isLoading = new BehaviorSubject<boolean>(false);
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Inicializar automáticamente si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.initializeNotifications();
    }
  }

  private getHeaders(): HttpHeaders {
    if (!isPlatformBrowser(this.platformId)) {
      return new HttpHeaders();
    }
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.warn('No se encontró el token de acceso en localStorage');
      return new HttpHeaders();
    }
    
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private getUserId(): number | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.warn('No se encontró el usuario en localStorage');
      return null;
    }
    try {
      const user = JSON.parse(userStr);
      if (!user || !user.id) {
        console.warn('El objeto usuario no tiene un ID válido');
        return null;
      }
      return user.id;
    } catch (error) {
      console.error('Error al parsear el usuario:', error);
      return null;
    }
  }

  private getMockNotifications(userId: number): Notification[] {
    const mockData = [
      {
        id: 1,
        targetUserId: userId,
        type: 'APROBACION' as const,
        message: 'Tus horas del proyecto "Proyecto A" han sido aprobadas',
        creationDate: new Date().toISOString(),
        isRead: false,
        readDate: null,
        senderUserId: 5
      },
      {
        id: 2,
        targetUserId: userId,
        type: 'ASIGNACION' as const,
        message: 'Has sido asignado al proyecto "Nuevo Proyecto"',
        creationDate: new Date().toISOString(),
        isRead: false,
        readDate: null,
        senderUserId: 3
      },
      {
        id: 3,
        targetUserId: userId,
        type: 'RECHAZO' as const,
        message: 'Tus horas del proyecto "Proyecto B" han sido rechazadas',
        creationDate: new Date().toISOString(),
        isRead: false,
        readDate: null,
        senderUserId: 4
      },
      {
        id: 4,
        targetUserId: userId,
        type: 'RECORDATORIO' as const,
        message: 'Registra tus horas por favor!',
        creationDate: new Date().toISOString(),
        isRead: false,
        readDate: null,
        senderUserId: 15
      }
    ];
    return mockData;
  }

  private isUserAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  public initializeNotifications(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    // Si ya está inicializado, retornar la promesa existente
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Si ya se inicializó, retornar promesa resuelta
    if (this.isInitialized) {
      return Promise.resolve();
    }

    this.initializationPromise = new Promise<void>((resolve) => {
      this.isInitialized = true;
      this.loadNotifications().then(() => {
        resolve();
      });
    });

    return this.initializationPromise;
  }

  public reloadNotifications(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.loadNotifications();
  }

  private async loadNotifications(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    if (!this.isUserAuthenticated()) {
      console.warn('Usuario no autenticado, no se pueden cargar notificaciones');
      this.notifications.next([]);
      this.updateUnreadCount();
      return;
    }
    
    const userId = this.getUserId();
    if (!userId) {
      console.warn('No se pudo obtener el ID del usuario');
      this.notifications.next([]);
      this.updateUnreadCount();
      return;
    }

    const url = `${this.API_URL}/notifications/get-all/${userId}`;
    const headers = this.getHeaders();
    
    this.isLoading.next(true);

    return new Promise<void>((resolve) => {
      this.http.get<Notification[]>(url, { headers }).pipe(
        map(notifications => {
          if (notifications && Array.isArray(notifications)) {
            console.log('Notificaciones obtenidas de la API:', notifications);
            return notifications;
          }
          console.log('No se encontraron notificaciones en API, usando mock data');
          return this.getMockNotifications(userId);
        }),
        catchError(error => {
          console.error('Error al cargar notificaciones:', error);
          
          // Solo usamos mock data si hay un error de red o servidor
          if (error.status === 0 || error.status >= 500) {
            console.log('Error de servidor, usando mock data');
            return of(this.getMockNotifications(userId));
          }
          // Para otros errores (401, 403, etc.), devolvemos array vacío
          console.log('Error de autorización o cliente, devolviendo array vacío');
          return of([]);
        }),
        tap(() => this.isLoading.next(false))
      ).subscribe({
        next: (notifications) => {
          console.log('Notificaciones finales:', notifications);
          this.notifications.next(notifications);
          this.updateUnreadCount();
          resolve();
        },
        error: (error) => {
          console.error('Error en la suscripción:', error);
          this.notifications.next([]);
          this.updateUnreadCount();
          this.isLoading.next(false);
          resolve();
        }
      });
    });
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount.asObservable();
  }

  getIsLoading(): Observable<boolean> {
    return this.isLoading.asObservable();
  }

  markAsRead(notificationId: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const userId = this.getUserId();
    if (!userId) {
      console.warn('No se pudo obtener el ID del usuario para marcar como leída');
      return;
    }

    // Actualización optimista inmediata del estado local
    const currentNotifications = this.notifications.getValue();
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true, readDate: new Date().toISOString() }
        : notification
    );
    this.notifications.next(updatedNotifications);
    this.updateUnreadCount();

    const requestBody: MarkAsReadRequest = {
      usuarioId: userId,
      notificationIds: [notificationId]
    };

    const url = `${this.API_URL}/notifications/mark-as-read`;
    const headers = this.getHeaders();

    this.http.put<MarkAsReadResponse>(url, requestBody, { headers }).pipe(
      tap(response => {
        console.log('Respuesta de marcar como leída:', response);
        if (!response.success) {
          // Si falla, revertir el cambio
          console.warn('Error en el servidor, revirtiendo cambio local');
          this.notifications.next(currentNotifications);
          this.updateUnreadCount();
        }
      }),
      catchError(error => {
        console.error('Error al marcar notificación como leída:', error);
        // Revertir el cambio en caso de error
        this.notifications.next(currentNotifications);
        this.updateUnreadCount();
        return of(null);
      })
    ).subscribe();
  }

  markAllAsRead(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const userId = this.getUserId();
    if (!userId) {
      console.warn('No se pudo obtener el ID del usuario para marcar todas como leídas');
      return;
    }

    const currentNotifications = this.notifications.getValue();
    const unreadNotificationIds = currentNotifications
      .filter(notification => !notification.isRead)
      .map(notification => notification.id);

    if (unreadNotificationIds.length === 0) {
      console.log('No hay notificaciones sin leer para marcar');
      return;
    }

    // Actualización optimista inmediata del estado local
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      isRead: true,
      readDate: new Date().toISOString()
    }));
    this.notifications.next(updatedNotifications);
    this.updateUnreadCount();

    const requestBody: MarkAsReadRequest = {
      usuarioId: userId,
      notificationIds: unreadNotificationIds
    };

    const url = `${this.API_URL}/notifications/mark-as-read`;
    const headers = this.getHeaders();

    this.http.put<MarkAsReadResponse>(url, requestBody, { headers }).pipe(
      tap(response => {
        console.log('Respuesta de marcar todas como leídas:', response);
        if (!response.success) {
          // Si falla, revertir el cambio
          console.warn('Error en el servidor, revirtiendo cambio local');
          this.notifications.next(currentNotifications);
          this.updateUnreadCount();
        }
      }),
      catchError(error => {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        // Revertir el cambio en caso de error
        this.notifications.next(currentNotifications);
        this.updateUnreadCount();
        return of(null);
      })
    ).subscribe();
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notifications.getValue().filter(n => !n.isRead).length;
    console.log('Actualizando contador de no leídas:', unreadCount);
    this.unreadCount.next(unreadCount);
  }

  public testApiConnection(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const userId = this.getUserId();
    if (!userId) {
      console.warn('No se puede probar la conexión sin userId');
      return;
    }
    
    const url = `${this.API_URL}/notifications/get-all/${userId}`;
    const headers = this.getHeaders();
    
    console.log('=== PRUEBA DE CONEXIÓN API ===');
    console.log('URL:', url);
    console.log('Headers:', headers);
    console.log('UserId:', userId);
    
    this.http.get(url, { headers }).subscribe({
      next: (response) => {
        console.log('✅ Conexión exitosa:', response);
      },
      error: (error) => {
        console.error('❌ Error de conexión:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('URL:', error.url);
      }
    });
  }
} 