import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassComponent } from './liquid-glass.component';
import { LiquidGlassDirective } from './liquid-glass.directive';

@Component({
  selector: 'app-liquid-glass-example',
  standalone: true,
  imports: [CommonModule, LiquidGlassComponent, LiquidGlassDirective],
  template: `
    <!-- Dashboard Card -->
    <div class="dashboard-example">
      <h2>Dashboard Cards</h2>
      <div class="cards-grid">
        <div appLiquidGlass="light" class="dashboard-card">
          <div class="card-icon">📊</div>
          <h3>Estadísticas</h3>
          <p class="card-value">1,234</p>
          <p class="card-label">Ventas del mes</p>
        </div>
        
        <div appLiquidGlass="medium" class="dashboard-card">
          <div class="card-icon">👥</div>
          <h3>Usuarios</h3>
          <p class="card-value">567</p>
          <p class="card-label">Usuarios activos</p>
        </div>
        
        <div appLiquidGlass="heavy" class="dashboard-card">
          <div class="card-icon">💰</div>
          <h3>Ingresos</h3>
          <p class="card-value">$45,678</p>
          <p class="card-label">Ingresos totales</p>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="navigation-example">
      <h2>Botones de Navegación</h2>
      <div class="nav-buttons">
        <button appLiquidGlass="light" class="nav-button">
          <span class="button-icon">🏠</span>
          Inicio
        </button>
        
        <button appLiquidGlass="medium" class="nav-button">
          <span class="button-icon">⚙️</span>
          Configuración
        </button>
        
        <button appLiquidGlass="heavy" class="nav-button">
          <span class="button-icon">👤</span>
          Perfil
        </button>
      </div>
    </div>

    <!-- Modal/Overlay -->
    <div class="modal-example">
      <h2>Modal con Efecto Glass</h2>
      <div appLiquidGlass="medium" class="modal-content">
        <h3>Confirmar Acción</h3>
        <p>¿Estás seguro de que quieres realizar esta acción?</p>
        <div class="modal-actions">
          <button class="btn-secondary">Cancelar</button>
          <button appLiquidGlass="light" class="btn-primary">Confirmar</button>
        </div>
      </div>
    </div>

    <!-- Form Inputs -->
    <div class="form-example">
      <h2>Inputs con Efecto Glass</h2>
      <div class="form-group">
        <input 
          appLiquidGlass="light" 
          type="text" 
          placeholder="Nombre de usuario"
          class="glass-input">
      </div>
      <div class="form-group">
        <input 
          appLiquidGlass="medium" 
          type="email" 
          placeholder="Correo electrónico"
          class="glass-input">
      </div>
    </div>
  `,
  styleUrls: ['./example-usage.component.scss']
})
export class LiquidGlassExampleComponent {} 