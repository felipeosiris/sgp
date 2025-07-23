import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-oauth2-callback',
  template: '<p>Procesando login...</p>',
})
export class Oauth2CallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    console.log('Iniciando ngOnInit del callback de OAuth2');
    const fragment = window.location.hash.substring(1);
    console.log('Fragmento obtenido del hash:', fragment);
    const params = new URLSearchParams(fragment);
    const token = params.get('access_token');
    console.log('Token obtenido:', token);
    const userParam = params.get('user');
    console.log('Parámetro user obtenido:', userParam);

    if (token && userParam) {
      try {
        console.log('Intentando decodificar y parsear userParam...');
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('userData parseado:', userData);

        localStorage.setItem('access_token', token);
        console.log('Token guardado en localStorage');

        // Guardar los datos del usuario y el refresh token
        localStorage.setItem('refresh_token', userData.refresh_token || '');
        console.log('Refresh token guardado en localStorage:', userData.refresh_token || '');

        const user = {
          id: userData.id || 10,
          name: userData.name || 'Usuario',
          role: this.getRoleName(userData.rol_id),
          photo: userData.photo_url || ''
        };

        console.log('Objeto usuario construido:', user);
        this.userService.setUser(user);
        console.log('Usuario guardado en UserService');

        this.router.navigate(['/']);
        console.log('Redirigiendo a la página principal');
      } catch (error) {
        console.error('Error al procesar los datos del usuario:', error);
        this.router.navigate(['/login']);
        console.log('Redirigiendo a /login por error en el procesamiento');
      }
    } else {
      console.error('Token o datos de usuario no encontrados en el hash');
      this.router.navigate(['/login']);
      console.log('Redirigiendo a /login por falta de token o datos de usuario');
    }
  }

  private getRoleName(rolId: number): string {
    const roles = {
      1: 'Administrador',
      2: 'Project Manager',
      3: 'Developer',
      4: 'Designer',
      5: 'QA'
    };
    const nombreRol = roles[rolId as keyof typeof roles] || 'Sin rol';
    console.log('Obteniendo nombre de rol para rolId', rolId, ':', nombreRol);
    return nombreRol;
  }
}
