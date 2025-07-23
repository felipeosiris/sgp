import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-liquid-glass',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="liquid-glass-container" [class]="containerClass" [style]="containerStyle">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./liquid-glass.component.scss']
})
export class LiquidGlassComponent implements OnInit, OnDestroy {
  @Input() containerClass: string = '';
  @Input() containerStyle: string = '';
  @Input() blurIntensity: number = 0;
  @Input() turbulenceIntensity: number = 0.008;
  @Input() displacementScale: number = 77;
  @Input() borderRadius: string = '30px';
  @Input() width: string = '300px';
  @Input() height: string = '200px';

  private filterId: string = '';

  ngOnInit() {
    this.generateFilterId();
    this.createSVGFilter();
  }

  ngOnDestroy() {
    this.removeSVGFilter();
  }

  private generateFilterId() {
    this.filterId = `liquid-glass-filter-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSVGFilter() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.display = 'none';
    svg.setAttribute('id', this.filterId);

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('x', '0%');
    filter.setAttribute('y', '0%');
    filter.setAttribute('width', '100%');
    filter.setAttribute('height', '100%');

    // Turbulence
    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', `${this.turbulenceIntensity} ${this.turbulenceIntensity}`);
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
    displacementMap.setAttribute('scale', this.displacementScale.toString());
    displacementMap.setAttribute('xChannelSelector', 'R');
    displacementMap.setAttribute('yChannelSelector', 'G');

    filter.appendChild(turbulence);
    filter.appendChild(gaussianBlur);
    filter.appendChild(displacementMap);
    svg.appendChild(filter);

    document.body.appendChild(svg);
  }

  private removeSVGFilter() {
    const existingFilter = document.getElementById(this.filterId);
    if (existingFilter) {
      existingFilter.remove();
    }
  }
} 