import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogsService, CatalogItem } from '../../../../../services/catalogs.service';
import { CreateProjectService } from '../../../../../services/create-project.service';
import { ProjectsService } from '../../../../../services/projects.service';
import { UserSearchService } from '../../../../../services/user-search.service';
import { UserSearch } from '../../../../../interfaces/user-search.interface';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface PersonaPartida {
  nombre: string;
  rol: string;
  fotoUrl?: string;
  email?: string;
  userId?: number;
  fechaInicio: string;
  fechaFin: string;
  porcentajeAsignacion: number;
}

interface PartidaPresupuestal {
  etapa: string;
  tecnologia_id: string;
  servicio: string;
  costo: number | null;
  horas: number | null;
  abierta: boolean;
  terminoBusqueda?: string;
  personasFiltradas?: PersonaPartida[];
}

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-project-view.component.html',
  styles: `
    :host {
      display: block;
    }
    .image-loading {
      opacity: 0;
      transition: opacity 0.3s ease-in;
    }
    .image-loaded {
      opacity: 1;
    }
  `
})
export class CreateProjectModalComponent implements OnInit {
  @Input() showModalNuevoProyecto: boolean = false;
  @Output() showModalNuevoProyectoChange = new EventEmitter<boolean>();
  @Output() projectCreated = new EventEmitter<void>();

  private searchSubject = new Subject<{index: number, query: string}>();

  public isLoading: boolean = false;
  public searchLoading: { [key: number]: boolean } = {};

  // Variables para el formulario de nuevo proyecto
  public nuevoProyectoNombre: string = '';
  public nuevoProyectoId: string = '';
  public nuevoProyectoPresupuestoHoras: number | null = null;
  public nuevoProyectoPresupuestoOperativo: string = '';
  public nuevoProyectoCostoOperativo: string = '';
  public nuevoProyectoFechaInicio: string = '';
  public nuevoProyectoFechaFin: string = '';

  // Paso del modal (1 o 2)
  public modalPaso2: boolean = false;

  // Variable para el líder del proyecto (Paso 2)
  public nuevoProyectoLider: number | null = null;

  // Arreglo general de personas (se obtiene de un servicio externo)
  public personas: PersonaPartida[] = [
    { nombre: 'Ana López', rol: 'Desarrolladora', fotoUrl: '', fechaInicio: '', fechaFin: '', porcentajeAsignacion: 0 },
    { nombre: 'Juan Pérez', rol: 'Diseñador', fotoUrl: '', fechaInicio: '', fechaFin: '', porcentajeAsignacion: 0 },
    { nombre: 'María García', rol: 'Tester', fotoUrl: '', fechaInicio: '', fechaFin: '', porcentajeAsignacion: 0 }
  ];

  // Arreglo de personas lideres
  public personasLideres: PersonaPartida[] = [];

  // Relación de personas asignadas a cada partida presupuestal
  public personasPorPartida: PersonaPartida[][] = [[]];

  // Partidas presupuestales para el desglose
  public partidasPresupuestales: PartidaPresupuestal[] = [
    {
      etapa: '',
      tecnologia_id: '',
      servicio: '',
      costo: null,
      horas: null,
      abierta: true,
      terminoBusqueda: '',
      personasFiltradas: []
    }
  ];

  // Catálogos
  public phasesCatalog: CatalogItem[] = [];
  public servicesCatalog: CatalogItem[] = [];
  public technologiesCatalog: CatalogItem[] = [];

  // Propiedades para manejo de imágenes
  imageLoading = true;
  defaultAvatar = 'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png';

  constructor(
    private catalogsService: CatalogsService,
    private createProjectService: CreateProjectService,
    private projectsService: ProjectsService,
    private userSearchService: UserSearchService,
    private cdr: ChangeDetectorRef
  ) {
    this.setupSearch();
  }

  ngOnInit() {
    this.loadCatalogs();
    this.calcularTotales();
    // Asegurar que personasPorPartida tenga al menos un array vacío
    if (this.personasPorPartida.length === 0) {
      this.personasPorPartida = [[]];
    }
  }

  loadCatalogs() {
    this.catalogsService.getCreateProjectCatalogs().subscribe({
      next: (response) => {
        this.phasesCatalog = response.phasesCatalog;
        this.servicesCatalog = response.servicesCatalog;
        this.technologiesCatalog = response.technologiesCatalog;
      },
      error: (error) => {
        console.error('Error al cargar los catálogos:', error);
        // Aquí podrías agregar una notificación de error
      }
    });
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => 
        prev.index === curr.index && prev.query === curr.query
      ),
      switchMap(({index, query}) => {
        this.searchLoading[index] = true;
        return this.userSearchService.searchUsers(query);
      })
    ).subscribe({
      next: (users: UserSearch[]) => {
        const index = Object.keys(this.searchLoading).find(key => this.searchLoading[Number(key)]);
        if (index !== undefined) {
          const partidaIndex = Number(index);
          this.partidasPresupuestales[partidaIndex].personasFiltradas = users.map(user => ({
            nombre: user.userName,
            rol: user.roleName,
            fotoUrl: user.userPhotoUrl,
            email: user.userEmail,
            userId: user.userId,
            fechaInicio: '',
            fechaFin: '',
            porcentajeAsignacion: 0
          }));
          this.searchLoading[partidaIndex] = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        Object.keys(this.searchLoading).forEach(key => {
          this.searchLoading[Number(key)] = false;
        });
      }
    });
  }

  // Método para filtrar personas por término de búsqueda
  public filtrarPersonas(indexPartida: number, termino: string): void {
    const partidaActual = this.partidasPresupuestales[indexPartida];
    partidaActual.terminoBusqueda = termino;
    partidaActual.personasFiltradas = [];
    
    if (!termino || termino.length < 3) {
      return;
    }

    this.searchSubject.next({index: indexPartida, query: termino});
  }

  closeModal() {
    this.showModalNuevoProyecto = false;
    this.showModalNuevoProyectoChange.emit(false);
    this.resetForm();
  }

  // Métodos para el manejo de partidas presupuestales
  public agregarPartida(): void {
    this.partidasPresupuestales.push({
      etapa: '',
      tecnologia_id: '',
      servicio: '',
      costo: null,
      horas: null,
      abierta: true,
      terminoBusqueda: '',
      personasFiltradas: []
    });
    this.personasPorPartida.push([]);
    this.calcularTotales();
  }

  public eliminarPartida(index: number): void {
    if (this.partidasPresupuestales.length > 1) {
      this.partidasPresupuestales.splice(index, 1);
      this.personasPorPartida.splice(index, 1);
      this.calcularTotales();
    }
  }

  public togglePartida(index: number): void {
    this.partidasPresupuestales[index].abierta = !this.partidasPresupuestales[index].abierta;
  }

  public guardarPartida(index: number): void {
    this.partidasPresupuestales[index].abierta = false;
  }

  // Método para calcular automáticamente los totales
  private calcularTotales(): void {
    // Calcular total de horas
    const totalHoras = this.partidasPresupuestales.reduce((total, partida) => {
      return total + (partida.horas || 0);
    }, 0);
    this.nuevoProyectoPresupuestoHoras = totalHoras;

    // Calcular total de costo operativo
    const totalCosto = this.partidasPresupuestales.reduce((total, partida) => {
      return total + (partida.costo || 0);
    }, 0);
    this.nuevoProyectoCostoOperativo = this.formatearMoneda(totalCosto);
  }

  // Método para formatear moneda
  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(valor);
  }

  // Método para actualizar cálculos cuando cambian los valores de las partidas
  public actualizarCalculos(): void {
    this.calcularTotales();
  }

  // Método para eliminar una persona de una partida presupuestal
  public eliminarPersonaDePartida(indexPartida: number, indexPersona: number): void {
    if (
      this.personasPorPartida[indexPartida] &&
      this.personasPorPartida[indexPartida].length > indexPersona
    ) {
      this.personasPorPartida[indexPartida].splice(indexPersona, 1);
      this.actualizarListaLideres();
    }
  }

  // Método para asignar una persona a una partida presupuestal
  public asignarPersonaAPartida(indexPartida: number, persona: PersonaPartida): void {
    if (!this.personasPorPartida[indexPartida]) {
      this.personasPorPartida[indexPartida] = [];
    }
    
    // Verificar si la persona ya está asignada a esta partida
    const personaExistente = this.personasPorPartida[indexPartida].find(p => p.userId === persona.userId);
    if (!personaExistente) {
      this.personasPorPartida[indexPartida].push(persona);
      this.actualizarListaLideres();
      
      // Limpiar el término de búsqueda y las personas filtradas
      if (this.partidasPresupuestales[indexPartida]) {
        this.partidasPresupuestales[indexPartida].terminoBusqueda = '';
        this.partidasPresupuestales[indexPartida].personasFiltradas = [];
      }
      
      console.log(`Persona ${persona.nombre} asignada a partida ${indexPartida + 1}`);
    } else {
      console.log(`La persona ${persona.nombre} ya está asignada a esta partida`);
    }
  }

  // Método para actualizar la lista de líderes potenciales
  private actualizarListaLideres(): void {
    // Obtener todas las personas asignadas de todas las partidas
    const todasLasPersonas = this.personasPorPartida.flat();
    
    // Eliminar duplicados basados en userId
    this.personasLideres = todasLasPersonas.filter((persona, index, self) =>
      index === self.findIndex((p) => p.userId === persona.userId)
    );
  }

  // Método para reiniciar el formulario
  private resetForm(): void {
    this.nuevoProyectoNombre = '';
    this.nuevoProyectoId = '';
    this.nuevoProyectoPresupuestoHoras = 0;
    this.nuevoProyectoPresupuestoOperativo = '';
    this.nuevoProyectoCostoOperativo = this.formatearMoneda(0);
    this.nuevoProyectoFechaInicio = '';
    this.nuevoProyectoFechaFin = '';
    this.nuevoProyectoLider = null;
    this.partidasPresupuestales = [
      {
        etapa: '',
        tecnologia_id: '',
        servicio: '',
        costo: null,
        horas: null,
        abierta: true,
        terminoBusqueda: '',
        personasFiltradas: []
      }
    ];
    this.personasPorPartida = [[]];
    this.personasLideres = [];
    this.modalPaso2 = false;
    this.calcularTotales();
  }

  // Método para validar si se puede continuar al paso 2
  public validarPaso1(): boolean {
    // Validaciones básicas del paso 1
    if (!this.nuevoProyectoNombre || !this.nuevoProyectoId) {
      return false;
    }

    if (!this.nuevoProyectoFechaInicio || !this.nuevoProyectoFechaFin) {
      return false;
    }

    // Validar que al menos haya una partida presupuestal
    if (this.partidasPresupuestales.length === 0) {
      return false;
    }

    // Validar que cada partida tenga los campos requeridos
    return this.partidasPresupuestales.every(partida => 
      partida.etapa && 
      partida.tecnologia_id && 
      partida.servicio && 
      (partida.horas !== null || partida.costo !== null)
    );
  }

  // Método para validar el formulario
  public validarFormulario(): boolean {
    console.log('Validando formulario...');
    
    // Validaciones básicas
    if (!this.nuevoProyectoNombre || !this.nuevoProyectoId) {
      console.log('Faltan nombre o ID del proyecto');
      return false;
    }

    if (!this.nuevoProyectoFechaInicio || !this.nuevoProyectoFechaFin) {
      console.log('Faltan fechas de inicio o fin');
      return false;
    }

    // Validar que al menos haya una partida presupuestal
    if (this.partidasPresupuestales.length === 0) {
      console.log('No hay partidas presupuestales');
      return false;
    }

    // Validar que cada partida tenga los campos requeridos
    const partidasValidas = this.partidasPresupuestales.every((partida, index) => {
      const esValida = partida.etapa && 
                      partida.tecnologia_id && 
                      partida.servicio && 
                      (partida.horas !== null || partida.costo !== null);
      
      if (!esValida) {
        console.log(`Partida ${index + 1} no es válida:`, partida);
      }
      return esValida;
    });

    if (!partidasValidas) {
      console.log('Hay partidas presupuestales inválidas');
      return false;
    }

    // Validar que se haya seleccionado un líder
    if (!this.nuevoProyectoLider) {
      console.log('No se ha seleccionado un líder del proyecto');
      return false;
    }

    // Validar que al menos una partida tenga personas asignadas
    const tienePersonas = this.personasPorPartida.some(partida => partida.length > 0);
    if (!tienePersonas) {
      console.log('No hay personas asignadas a ninguna partida');
      return false;
    }

    // Validar que los campos de personas asignadas estén completos
    if (!this.camposPersonasCompletos()) {
      console.log('Hay personas asignadas con campos incompletos');
      return false;
    }

    console.log('Formulario válido');
    return true;
  }

  // Método para validar que los campos de personas asignadas estén completos
  public camposPersonasCompletos(): boolean {
    // Recorre todas las partidas y todas las personas asignadas
    return this.personasPorPartida.every(partida =>
      partida.every(persona =>
        !!persona.fechaInicio &&
        !!persona.fechaFin &&
        persona.porcentajeAsignacion !== undefined &&
        persona.porcentajeAsignacion !== null
      )
    );
  }

  // Método para crear un nuevo proyecto
  public crearProyecto(): void {
    console.log('Iniciando creación de proyecto...');
    console.log('Datos del formulario:', {
      nombre: this.nuevoProyectoNombre,
      id: this.nuevoProyectoId,
      fechas: { inicio: this.nuevoProyectoFechaInicio, fin: this.nuevoProyectoFechaFin },
      partidas: this.partidasPresupuestales,
      personasPorPartida: this.personasPorPartida,
      lider: this.nuevoProyectoLider
    });

    if (!this.validarFormulario()) {
      console.log('Formulario no válido, abortando creación');
      return;
    }

    this.isLoading = true;
    console.log('Formulario válido, procediendo con la creación...');

    // Transformar las partidas presupuestales al formato requerido
    const partidasPresupuestales = this.partidasPresupuestales.map((partida, index) => {
      const personasAsignadas = this.personasPorPartida[index] || [];
      const horasPorPersona = personasAsignadas.length > 0 ? Math.floor((partida.horas || 0) / personasAsignadas.length) : 0;
      const porcentajePorPersona = personasAsignadas.length > 0 ? 100 / personasAsignadas.length : 0;

      console.log(`Partida ${index + 1}:`, {
        personasAsignadas: personasAsignadas.length,
        horasPorPersona,
        porcentajePorPersona
      });

      return {
        id: index + 1,
        proyecto_id: 1, // El ID del proyecto será asignado por el backend
        presupuesto_horas: partida.horas || 0,
        presupuesto_costo: partida.costo || 0,
        etapa_id: parseInt(partida.etapa),
        servicio_id: parseInt(partida.servicio),
        tecnologia_id: parseInt(partida.tecnologia_id, 10) || 0,
        activo: true,
        fecha_creacion: new Date().toISOString(),
        asignaciones: personasAsignadas.map((persona, i) => ({
          id: i + 1,
          usuario_id: persona.userId || 10,
          partida_id: index + 1,
          horas_asignadas: horasPorPersona,
          porcentaje: porcentajePorPersona,
          fecha_asignacion: new Date().toISOString(),
          fecha_inicio: new Date(persona.fechaInicio).toISOString(),
          fecha_fin: new Date(persona.fechaFin ).toISOString(),
          porcentaje_asignacion: persona.porcentajeAsignacion
        }))
      };
    });

    const projectData = {
      nombre: this.nuevoProyectoNombre,
      codigo_interno: this.nuevoProyectoId,
      fecha_inicio: new Date(this.nuevoProyectoFechaInicio).toISOString(),
      fecha_fin: new Date(this.nuevoProyectoFechaFin).toISOString(),
      presupuesto_horas: this.nuevoProyectoPresupuestoHoras || 0,
      presupuesto_costo: this.nuevoProyectoPresupuestoOperativo ? parseInt(this.nuevoProyectoPresupuestoOperativo.replace(/[^0-9]/g, ''), 10) : 0,
      responsable_id: this.nuevoProyectoLider || 10,
      fecha_creacion: new Date().toISOString(),
      activo: true,
      partidas: partidasPresupuestales
    };

    console.log('Datos del proyecto a enviar:', projectData);

    this.createProjectService.createProject(projectData).subscribe({
      next: (response) => {
        console.log('Proyecto creado exitosamente:', response);
        this.isLoading = false;
        this.projectCreated.emit();
        this.closeModal();
      },
      error: (error) => {
        console.error('Error al crear el proyecto:', error);
        console.log('Bloque error ejecutado');
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        
        // Mostrar mensaje específico según el tipo de error
        if (error.status === 400) {
          console.error('Error de validación en el servidor');
        } else if (error.status === 401) {
          console.error('Error de autenticación');
        } else if (error.status === 500) {
          console.error('Error interno del servidor');
        } else if (error.status === 0) {
          console.error('Error de conexión - no se pudo conectar al servidor');
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        // Aquí podrías agregar una notificación de error
      }
    });
  }

  // Métodos para manejo de imágenes
  handleImageError(event: any) {
    event.target.src = this.defaultAvatar;
    this.imageLoading = false;
    this.cdr.detectChanges();
  }

  handleImageLoad(event: any) {
    this.imageLoading = false;
    event.target.classList.remove('image-loading');
    event.target.classList.add('image-loaded');
    this.cdr.detectChanges();
  }

  // Método para continuar al paso 2
  public continuarAPaso2(): void {
    if (this.validarPaso1()) {
      this.modalPaso2 = true;
    } else {
      console.log('Formulario del paso 1 incompleto, no se puede continuar');
    }
  }
} 