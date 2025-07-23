import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Gestión de Proyectos';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      const userParam = params.get('user');

      if (token && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', userData.refresh_token || '');

          const user = {
            id: userData.id || 10,
            name: userData.name || 'Usuario',
            role: this.getRoleName(userData.rol_id),
            photo: userData.photo_url || ''
          };

          this.userService.setUser(user);
          history.replaceState(null, '', window.location.pathname);
          this.router.navigate(['/home']);
        } catch (error) {
          this.router.navigate(['/login']);
        }
      }
    }
  }

  private getRoleName(rolId: number): string {
    const roles: { [key: number]: string } = {
      1: 'Administrador',
      2: 'Project Manager',
      3: 'Developer',
      4: 'Designer',
      5: 'QA'
    };
    return roles[rolId] || 'Sin rol';
  }
}
