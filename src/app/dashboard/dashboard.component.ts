import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true, // <-- Esto es clave
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, FormsModule], // importa lo necesario aquí
})
export default class DashboardComponent {
  constructor(private readonly router: Router) {}

  signInWithGoogle() {
   /*  window.location.href =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: '680085127374-l0icpkn124bctp86hidiekqc6np12nfo.apps.googleusercontent.com',
        redirect_uri: 'http://localhost:4200/oauth2/callback',
        response_type: 'token',
        scope: 'profile email',
        include_granted_scopes: 'true',
        state: 'state_parameter_passthrough_value',
        prompt: 'select_account',
      }).toString(); */

      const apiUrl = 'https://express-pg-app-qa.fly.dev/auth/google';
      window.location.href = apiUrl;
  }

  toggleDevMode() {
    console.log('Activando/Desactivando el modo desarrollador...');
    this.router.navigate(['/main']);
  }
}
