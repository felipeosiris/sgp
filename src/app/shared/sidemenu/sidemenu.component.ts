import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { routes } from '@app/app.routes';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { NotificationsService } from '../../services/notifications.service';
import { Subject, takeUntil } from 'rxjs';
import { PermissionsService } from '../../services/permissions.service';
import { PermissionManagerService } from '../../services/permission-manager.service';

@Component({
  selector: 'app-sidemenu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  providers: [Router],
  templateUrl: './sidemenu.component.html',
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
    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #EF4444;
      color: white;
      border-radius: 9999px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      min-width: 1.5rem;
      text-align: center;
      border: 2px solid white;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidemenuComponent implements OnInit, OnDestroy {
  home: string = '/home';
  user: User | null = null;
  imageLoading = true;
  defaultAvatar = 'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png';
  unreadNotificationsCount = 0;
  loadingPermissions = true;
  private destroy$ = new Subject<void>();

  public menuItems = routes
    .map((route) => route.children ?? [])
    .flat()
    .filter((route) => route && route.path)
    .filter((route) => !route.path?.includes(':'))
    .filter((route) => !route.path?.includes('home'));

  constructor(
    private router: Router,
    private userService: UserService,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private permissionsService: PermissionsService,
    private permissionManager: PermissionManagerService
  ) { }

  async ngOnInit() {
    // Inicializar el servicio de notificaciones
    await this.notificationsService.initializeNotifications();

    this.userService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user = userData;
        if (userData && userData.id) {
          this.permissionsService.getPermissionsByUserId(userData.id).subscribe({
            next: (permissions) => {
              this.permissionManager.setPermissions(permissions);
              this.loadingPermissions = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error al obtener permisos:', err);
              this.loadingPermissions = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.loadingPermissions = false;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        this.loadingPermissions = false;
        this.cdr.detectChanges();
      }
    });

    this.notificationsService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        console.log('Contador de notificaciones en sidemenu:', count);
        this.unreadNotificationsCount = count;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  goToNotifications() {
    this.router.navigate(['/home/notifications']);
  }

  // Métodos para saber si mostrar cada botón
  canViewProyectos(): boolean {
    return this.permissionManager.hasPermission('VER_PROYECTOS');
  }
  canViewPersonas(): boolean {
    return this.permissionManager.hasPermission('ASIGNAR_PERSONAS');
  }
  canViewTiempos(): boolean {
    return this.permissionManager.hasPermission('REGISTRAR_HORAS');
  }
  canViewMiEquipo(): boolean {
    return this.permissionManager.hasPermission('ASIGNAR_PARTIDAS');
  }
  canViewAdmin(): boolean {
    return this.permissionManager.hasPermission('VER_DASHBOARD');
  }
}
