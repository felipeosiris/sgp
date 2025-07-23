import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { LiquidGlassService, LiquidGlassConfig } from './liquid-glass.service';

@Directive({
  selector: '[appLiquidGlass]',
  standalone: true
})
export class LiquidGlassDirective implements OnInit, OnDestroy {
  @Input() appLiquidGlass: LiquidGlassConfig | string = '';
  @Input() glassIntensity: 'light' | 'medium' | 'heavy' = 'medium';
  @Input() animatedBackground = false;
  @Input() backgroundImage = '';

  private filterId: string = '';

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private liquidGlassService: LiquidGlassService
  ) {}

  ngOnInit() {
    this.applyLiquidGlassEffect();
  }

  ngOnDestroy() {
    if (this.filterId) {
      this.liquidGlassService.removeCustomFilter(this.filterId);
    }
  }

  private applyLiquidGlassEffect() {
    const element = this.elementRef.nativeElement;
    
    // Aplicar clases base
    this.renderer.addClass(element, 'liquid-glass-element');
    
    // Configurar el efecto según el tipo de input
    if (typeof this.appLiquidGlass === 'string') {
      this.applyPresetEffect(element, this.appLiquidGlass);
    } else {
      this.applyCustomEffect(element, this.appLiquidGlass);
    }

    // Aplicar animación de fondo si está habilitada
    if (this.animatedBackground) {
      this.liquidGlassService.applyBackgroundAnimation(element, this.backgroundImage);
    }
  }

  private applyPresetEffect(element: HTMLElement, preset: string) {
    const config = this.getPresetConfig(preset);
    this.filterId = this.liquidGlassService.createCustomFilter(config);
    
    // Aplicar estilos CSS
    this.renderer.setStyle(element, '--filter-url', `url(#${this.filterId})`);
    this.renderer.setStyle(element, '--blur-intensity', `${config.blurIntensity}px`);
    this.renderer.setStyle(element, '--border-radius', config.borderRadius);
    this.renderer.setStyle(element, '--width', config.width);
    this.renderer.setStyle(element, '--height', config.height);
  }

  private applyCustomEffect(element: HTMLElement, config: LiquidGlassConfig) {
    const finalConfig = { ...this.liquidGlassService.getDefaultConfig(), ...config };
    this.filterId = this.liquidGlassService.createCustomFilter(finalConfig);
    
    // Aplicar estilos CSS
    this.renderer.setStyle(element, '--filter-url', `url(#${this.filterId})`);
    this.renderer.setStyle(element, '--blur-intensity', `${finalConfig.blurIntensity}px`);
    this.renderer.setStyle(element, '--border-radius', finalConfig.borderRadius);
    this.renderer.setStyle(element, '--width', finalConfig.width);
    this.renderer.setStyle(element, '--height', finalConfig.height);
  }

  private getPresetConfig(preset: string): LiquidGlassConfig {
    switch (preset) {
      case 'light':
        return {
          blurIntensity: 5,
          turbulenceIntensity: 0.005,
          displacementScale: 50,
          borderRadius: '20px'
        };
      case 'medium':
        return {
          blurIntensity: 10,
          turbulenceIntensity: 0.008,
          displacementScale: 77,
          borderRadius: '30px'
        };
      case 'heavy':
        return {
          blurIntensity: 15,
          turbulenceIntensity: 0.012,
          displacementScale: 100,
          borderRadius: '40px'
        };
      default:
        return this.liquidGlassService.getDefaultConfig();
    }
  }
} 