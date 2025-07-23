import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassComponent } from './liquid-glass.component';
import { LiquidGlassDirective } from './liquid-glass.directive';

@Component({
  selector: 'app-liquid-glass-demo',
  standalone: true,
  imports: [CommonModule, LiquidGlassComponent, LiquidGlassDirective],
  template: `
    <div class="demo-container">
      <h1>Liquid Glass Effect Demo</h1>
      
      <!-- Uso del componente -->
      <section class="demo-section">
        <h2>Usando el Componente</h2>
        <app-liquid-glass 
          containerClass="glass-medium" 
          [containerStyle]="'width: 300px; height: 200px;'">
          <div class="content">
            <h3>Efecto Glass</h3>
            <p>Este es un contenedor con efecto liquid glass</p>
          </div>
        </app-liquid-glass>
      </section>

      <!-- Uso de la directiva -->
      <section class="demo-section">
        <h2>Usando la Directiva</h2>
        <div 
          appLiquidGlass="medium" 
          class="demo-card"
          [animatedBackground]="true">
          <h3>Directiva Glass</h3>
          <p>Aplicado con la directiva</p>
        </div>
      </section>

      <!-- Diferentes intensidades -->
      <section class="demo-section">
        <h2>Diferentes Intensidades</h2>
        <div class="intensity-grid">
          <div appLiquidGlass="light" class="demo-card">
            <h4>Light</h4>
          </div>
          <div appLiquidGlass="medium" class="demo-card">
            <h4>Medium</h4>
          </div>
          <div appLiquidGlass="heavy" class="demo-card">
            <h4>Heavy</h4>
          </div>
        </div>
      </section>

      <!-- Configuración personalizada -->
      <section class="demo-section">
        <h2>Configuración Personalizada</h2>
        <div 
          [appLiquidGlass]="customConfig" 
          class="demo-card custom-config">
          <h3>Configuración Personalizada</h3>
          <p>Con parámetros específicos</p>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['./liquid-glass-demo.component.scss']
})
export class LiquidGlassDemoComponent {
  customConfig = {
    blurIntensity: 8,
    turbulenceIntensity: 0.006,
    displacementScale: 60,
    borderRadius: '40px',
    width: '350px',
    height: '250px'
  };
} 