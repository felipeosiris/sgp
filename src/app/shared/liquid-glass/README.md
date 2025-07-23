# Liquid Glass Effect Library

Una librería interna para aplicar efectos de "liquid glass" (vidrio líquido) a componentes Angular.

## Características

- ✅ Efecto de vidrio líquido con filtros SVG
- ✅ Componente reutilizable
- ✅ Directiva para aplicar a cualquier elemento
- ✅ Configuración personalizable
- ✅ Diferentes intensidades predefinidas
- ✅ Animaciones de fondo opcionales
- ✅ Responsive design
- ✅ TypeScript support

## Instalación

La librería ya está incluida en el proyecto. Solo necesitas importar los componentes que necesites.

## Uso

### 1. Usando el Componente

```typescript
import { LiquidGlassComponent } from './shared/liquid-glass';

@Component({
  imports: [LiquidGlassComponent],
  template: `
    <app-liquid-glass 
      containerClass="glass-medium" 
      [containerStyle]="'width: 300px; height: 200px;'">
      <div class="content">
        <h3>Mi Contenido</h3>
        <p>Con efecto liquid glass</p>
      </div>
    </app-liquid-glass>
  `
})
```

### 2. Usando la Directiva

```typescript
import { LiquidGlassDirective } from './shared/liquid-glass';

@Component({
  imports: [LiquidGlassDirective],
  template: `
    <div 
      appLiquidGlass="medium" 
      class="my-card"
      [animatedBackground]="true">
      <h3>Mi Tarjeta</h3>
      <p>Con efecto glass</p>
    </div>
  `
})
```

### 3. Configuración Personalizada

```typescript
import { LiquidGlassDirective, LiquidGlassConfig } from './shared/liquid-glass';

@Component({
  template: `
    <div 
      [appLiquidGlass]="customConfig" 
      class="my-card">
      <h3>Configuración Personalizada</h3>
    </div>
  `
})
export class MyComponent {
  customConfig: LiquidGlassConfig = {
    blurIntensity: 8,
    turbulenceIntensity: 0.006,
    displacementScale: 60,
    borderRadius: '40px',
    width: '350px',
    height: '250px'
  };
}
```

## API

### LiquidGlassComponent

#### Inputs
- `containerClass`: string - Clases CSS adicionales
- `containerStyle`: string - Estilos inline adicionales
- `blurIntensity`: number - Intensidad del blur (0-20)
- `turbulenceIntensity`: number - Intensidad de la turbulencia (0.001-0.02)
- `displacementScale`: number - Escala del desplazamiento (10-150)
- `borderRadius`: string - Radio del borde
- `width`: string - Ancho del contenedor
- `height`: string - Alto del contenedor

### LiquidGlassDirective

#### Inputs
- `appLiquidGlass`: string | LiquidGlassConfig - Preset o configuración personalizada
- `glassIntensity`: 'light' | 'medium' | 'heavy' - Intensidad predefinida
- `animatedBackground`: boolean - Habilitar animación de fondo
- `backgroundImage`: string - URL de imagen de fondo

### LiquidGlassService

#### Métodos
- `createCustomFilter(config)`: string - Crear filtro personalizado
- `removeCustomFilter(filterId)`: void - Remover filtro
- `getDefaultConfig()`: LiquidGlassConfig - Obtener configuración por defecto
- `applyBackgroundAnimation(element, imageUrl)`: void - Aplicar animación de fondo

## Presets Disponibles

### Light
- Blur: 5px
- Turbulence: 0.005
- Displacement: 50

### Medium (Default)
- Blur: 10px
- Turbulence: 0.008
- Displacement: 77

### Heavy
- Blur: 15px
- Turbulence: 0.012
- Displacement: 100

## Clases CSS Utilitarias

```scss
.liquid-glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.liquid-glass-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
}
```

## Ejemplos de Uso

### Tarjeta de Información
```html
<div appLiquidGlass="medium" class="info-card">
  <h3>Información Importante</h3>
  <p>Contenido con efecto glass</p>
</div>
```

### Botón con Efecto
```html
<button appLiquidGlass="light" class="liquid-glass-button">
  Click Me
</button>
```

### Contenedor Animado
```html
<div 
  appLiquidGlass="heavy" 
  [animatedBackground]="true"
  [backgroundImage]="'url(/assets/background.jpg)'">
  <h2>Contenido Animado</h2>
</div>
```

## Notas de Rendimiento

- Los filtros SVG se crean dinámicamente y se limpian automáticamente
- Usa `isolation: isolate` para optimizar el rendimiento
- Los efectos de blur pueden ser costosos en dispositivos móviles
- Considera usar `will-change: transform` para animaciones

## Compatibilidad

- ✅ Chrome/Edge (Webkit)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (limitado)

## Troubleshooting

### El efecto no se ve
1. Verifica que los estilos estén importados
2. Asegúrate de que el elemento tenga contenido
3. Revisa la consola por errores de SVG

### Rendimiento lento
1. Reduce la intensidad del blur
2. Usa presets en lugar de configuración personalizada
3. Evita múltiples elementos con el efecto en la misma página

### Problemas en móviles
1. Usa intensidad "light" en dispositivos móviles
2. Deshabilita animaciones de fondo
3. Considera usar `@media (prefers-reduced-motion)` 