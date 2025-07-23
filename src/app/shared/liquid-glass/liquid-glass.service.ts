import { Injectable } from '@angular/core';

export interface LiquidGlassConfig {
  blurIntensity?: number;
  turbulenceIntensity?: number;
  displacementScale?: number;
  borderRadius?: string;
  width?: string;
  height?: string;
  backgroundImage?: string;
  animatedBackground?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LiquidGlassService {
  private filterCounter = 0;
  private activeFilters: Set<string> = new Set();

  constructor() {
    this.initializeGlobalFilters();
  }

  private initializeGlobalFilters() {
    // Crear filtros globales predefinidos
    this.createGlobalFilter('liquid-glass-filter-light', {
      blurIntensity: 5,
      turbulenceIntensity: 0.005,
      displacementScale: 50
    });

    this.createGlobalFilter('liquid-glass-filter-medium', {
      blurIntensity: 10,
      turbulenceIntensity: 0.008,
      displacementScale: 77
    });

    this.createGlobalFilter('liquid-glass-filter-heavy', {
      blurIntensity: 15,
      turbulenceIntensity: 0.012,
      displacementScale: 100
    });
  }

  private createGlobalFilter(filterId: string, config: LiquidGlassConfig) {
    const existingFilter = document.getElementById(filterId);
    if (existingFilter) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.display = 'none';
    svg.setAttribute('id', filterId);

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('x', '0%');
    filter.setAttribute('y', '0%');
    filter.setAttribute('width', '100%');
    filter.setAttribute('height', '100%');

    // Turbulence
    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', `${config.turbulenceIntensity || 0.008} ${config.turbulenceIntensity || 0.008}`);
    turbulence.setAttribute('numOctaves', '2');
    turbulence.setAttribute('seed', '92');
    turbulence.setAttribute('result', 'noise');

    // Gaussian Blur
    const gaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    gaussianBlur.setAttribute('in', 'noise');
    gaussianBlur.setAttribute('stdDeviation', '0.02');
    gaussianBlur.setAttribute('result', 'blur');

    // Displacement Map
    const displacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    displacementMap.setAttribute('in', 'SourceGraphic');
    displacementMap.setAttribute('in2', 'blur');
    displacementMap.setAttribute('scale', (config.displacementScale || 77).toString());
    displacementMap.setAttribute('xChannelSelector', 'R');
    displacementMap.setAttribute('yChannelSelector', 'G');

    filter.appendChild(turbulence);
    filter.appendChild(gaussianBlur);
    filter.appendChild(displacementMap);
    svg.appendChild(filter);

    document.body.appendChild(svg);
  }

  createCustomFilter(config: LiquidGlassConfig): string {
    const filterId = `liquid-glass-custom-${++this.filterCounter}`;
    this.createGlobalFilter(filterId, config);
    this.activeFilters.add(filterId);
    return filterId;
  }

  removeCustomFilter(filterId: string) {
    const filter = document.getElementById(filterId);
    if (filter) {
      filter.remove();
      this.activeFilters.delete(filterId);
    }
  }

  cleanup() {
    this.activeFilters.forEach(filterId => {
      this.removeCustomFilter(filterId);
    });
  }

  getDefaultConfig(): LiquidGlassConfig {
    return {
      blurIntensity: 10,
      turbulenceIntensity: 0.008,
      displacementScale: 77,
      borderRadius: '30px',
      width: '300px',
      height: '200px',
      animatedBackground: false
    };
  }

  applyBackgroundAnimation(element: HTMLElement, imageUrl?: string) {
    if (imageUrl) {
      element.style.backgroundImage = `url(${imageUrl})`;
      element.style.backgroundSize = '400px';
      element.style.animation = 'moveBackground 60s linear infinite';
    } else {
      element.style.background = 'linear-gradient(45deg, #f0f0f0, #e0e0e0, #f0f0e0)';
      element.style.backgroundSize = '400% 400%';
      element.style.animation = 'gradientShift 3s ease infinite';
    }
  }
} 