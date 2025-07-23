import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonasService, Persona, PersonasFiltros } from '../../../services/personas.service';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personas.component.html',
  styles: `
    :host {
      display: block;
    }
  `
})
export class PersonasComponent implements OnInit {
  defaultAvatar = 'https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=';
  
  filtros = {
    conProyecto: false,
    sinProyecto: false,
    conCertificado: false,
    sinCertificado: false,
    activas: false,
    inactivas: false,
    idiomaActivas: false,
    idiomaInactivas: false,
    horasCubiertas: '' // menos50, menos75, mas90, mas100
  };

  personas: Persona[] = [];
  estadisticas = {
    totalPersonas: 0,
    enCertificacion: 0,
    sinProyecto: 0,
    proyectosActivos: 0
  };

  userId: number = 0;

  constructor(
    private personasService: PersonasService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.userId = this.getUserIdFromLocalStorage();
    this.cargarDatos(true); // true = sin filtros
  }

  getUserIdFromLocalStorage(): number {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj && userObj.id) {
            return userObj.id;
          }
        } catch (e) {
          console.error('Error al parsear el usuario desde localStorage:', e);
        }
      }
    }
    return 15; // fallback
  }

  construirFiltros(): PersonasFiltros {
    // Por default todo en false
    let porcentajeUsoFilter = '';
    switch (this.filtros.horasCubiertas) {
      case 'menos50': porcentajeUsoFilter = '50'; break;
      case 'menos75': porcentajeUsoFilter = '75'; break;
      case 'mas90': porcentajeUsoFilter = '90'; break;
      case 'mas100': porcentajeUsoFilter = '100'; break;
      default: porcentajeUsoFilter = '';
    }
    return {
      withProject: this.filtros.conProyecto,
      withSFCertification: this.filtros.conCertificado,
      withLanguage: this.filtros.idiomaActivas,
      porcentajeUsoFilter: porcentajeUsoFilter
    };
  }

  cargarDatos(sinFiltros: boolean = false) {
    if (sinFiltros) {
      console.log('[Personas] Carga inicial sin filtros');
      this.personasService.getPersonas(this.userId).subscribe({
        next: (personas) => {
          console.log('[Personas] Respuesta de la API:', personas);
          this.personas = personas;
          this.estadisticas = {
            totalPersonas: personas.length,
            enCertificacion: personas.filter(p => p.certificado).length,
            sinProyecto: personas.filter(p => !p.proyecto).length,
            proyectosActivos: personas.filter(p => p.proyecto).length
          };
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('[Personas] Error al cargar personas:', error);
        }
      });
      return;
    }
    const filtros = this.construirFiltros();
    console.log('[Personas] Filtros aplicados:', filtros);
    this.personasService.getPersonas(this.userId, filtros).subscribe({
      next: (personas) => {
        console.log('[Personas] Respuesta de la API:', personas);
        this.personas = personas;
        this.estadisticas = {
          totalPersonas: personas.length,
          enCertificacion: personas.filter(p => p.certificado).length,
          sinProyecto: personas.filter(p => !p.proyecto).length,
          proyectosActivos: personas.filter(p => p.proyecto).length
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('[Personas] Error al cargar personas:', error);
      }
    });
  }

  aplicarFiltros() {
    console.log('[Personas] Botón aplicar presionado');
    this.cargarDatos(false);
  }

  limpiarFiltros() {
    this.filtros = {
      conProyecto: false,
      sinProyecto: false,
      conCertificado: false,
      sinCertificado: false,
      activas: false,
      inactivas: false,
      idiomaActivas: false,
      idiomaInactivas: false,
      horasCubiertas: ''
    };
    this.cargarDatos(true);
  }

  handleImageError(event: any, nombre: string) {
    event.target.src = this.defaultAvatar + encodeURIComponent(nombre);
  }

  getAvatarUrl(persona: Persona): string {
    return persona.imagen || this.defaultAvatar + encodeURIComponent(persona.nombre);
  }

  getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
} 