import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectsService, Proyecto } from '../../../services/projects.service';
import { CreateProjectModalComponent } from './components/modals/create-project-view.component';
import { TeamLeadersComponent } from './components/team-leaders/team-leaders.component';
import { CollaboratorsComponent } from './components/collaborators/collaborators.component';
import { CatalogsComponent } from './components/catalogs/catalogs.component';
import * as XLSX from 'xlsx';
import { ProjectService, ProjectResponse, PartidaPresupuestal, Asignacion, ProjectLeader } from '../../services/project.service';
import { CatalogsService } from '../../../services/catalogs.service';
import { HttpClient } from '@angular/common/http';

interface PersonaPartida {
  nombre: string;
  rol: string;
  fotoUrl?: string;
}

// Interfaz local para las partidas presupuestales del formulario
interface PartidaPresupuestalForm {
  etapa: string;
  tecnologia_id: number;
  servicio: string;
  costo: number | null;
  horas: number | null;
  abierta: boolean;
}

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CreateProjectModalComponent,
    TeamLeadersComponent,
    CollaboratorsComponent,
    CatalogsComponent
  ],
  templateUrl: './admin-view.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminComponent implements OnInit {
  proyectos: any[] = []; // Cambiado a any[] para poder acceder a 'activo'

  // Variable para el tab seleccionado
  public selectedTab: 'activos' | 'archivados' | 'lideres' | 'colaboradores' | 'catalogos' = 'activos';

  // Variable para mostrar el modal de nuevo proyecto
  public showModalNuevoProyecto: boolean = false;

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
  public nuevoProyectoLider: string = '';

  // Arreglo general de personas (se obtiene de un servicio externo)
  public personas: PersonaPartida[] = [];

  // Relación de personas asignadas a cada partida presupuestal
  // Cada elemento es un arreglo de personas para la partida correspondiente
  public personasPorPartida: PersonaPartida[][] = [];

  // Partidas presupuestales para el desglose
  public partidasPresupuestales: PartidaPresupuestalForm[] = [
    {
      etapa: '',
      tecnologia_id: 0,
      servicio: '',
      costo: null,
      horas: null,
      abierta: true
    }
  ];

  constructor(
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadPersonas();
  }

  public loadProjects(): void {
    this.projectsService.getAllProjects().subscribe({
      next: (projects) => {
        this.proyectos = projects;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar los proyectos:', error);
        this.cdr.markForCheck(); // También marcamos en caso de error
      }
    });
  }

  private loadPersonas(): void {
    // Simulación temporal:
    this.personas = [
      { nombre: 'Ana López', rol: 'Desarrolladora', fotoUrl: '' },
      { nombre: 'Juan Pérez', rol: 'Diseñador', fotoUrl: '' },
      { nombre: 'María García', rol: 'Tester', fotoUrl: '' }
    ];
    this.cdr.markForCheck(); // Marcamos para detectar cambios después de cargar las personas
  }

  // Getter para filtrar los proyectos según el tab seleccionado
  get proyectosFiltrados(): any[] {
    if (this.selectedTab === 'activos') {
      return this.proyectos.filter(p => p.activo === true);
    } else {
      return this.proyectos.filter(p => p.activo === false);
    }
  }

  // Método auxiliar para determinar si un proyecto está activo
  private esActivo(proyecto: any): boolean {
    return proyecto.activo === true;
  }

  // Métodos para el manejo de partidas presupuestales
  public agregarPartida(): void {
    this.partidasPresupuestales.push({
      etapa: '',
      tecnologia_id: 0,
      servicio: '',
      costo: null,
      horas: null,
      abierta: true
    });
    this.personasPorPartida.push([]);
  }

  public togglePartida(index: number): void {
    this.partidasPresupuestales[index].abierta = !this.partidasPresupuestales[index].abierta;
  }

  public guardarPartida(index: number): void {
    // Aquí podrías agregar lógica para validar o guardar la partida individualmente
    // Por ahora solo cerramos la partida
    this.partidasPresupuestales[index].abierta = false;
  }

  // Método para eliminar una persona de una partida presupuestal
  public eliminarPersonaDePartida(indexPartida: number, indexPersona: number): void {
    if (
      this.personasPorPartida[indexPartida] &&
      this.personasPorPartida[indexPartida].length > indexPersona
    ) {
      this.personasPorPartida[indexPartida].splice(indexPersona, 1);
    }
  }

  // Método para asignar una persona a una partida presupuestal
  public asignarPersonaAPartida(indexPartida: number, persona: PersonaPartida): void {
    if (!this.personasPorPartida[indexPartida]) {
      this.personasPorPartida[indexPartida] = [];
    }
    // Evitar duplicados
    if (!this.personasPorPartida[indexPartida].some(p => p.nombre === persona.nombre)) {
      this.personasPorPartida[indexPartida].push(persona);
    }
  }

  // Método para reiniciar el formulario del modal de nuevo proyecto
  public resetNuevoProyecto(): void {
    this.nuevoProyectoNombre = '';
    this.nuevoProyectoId = '';
    this.nuevoProyectoPresupuestoHoras = null;
    this.nuevoProyectoPresupuestoOperativo = '';
    this.nuevoProyectoCostoOperativo = '';
    this.nuevoProyectoFechaInicio = '';
    this.nuevoProyectoFechaFin = '';
    this.nuevoProyectoLider = '';
    this.partidasPresupuestales = [
      {
        etapa: '',
        tecnologia_id: 0,
        servicio: '',
        costo: null,
        horas: null,
        abierta: true
      }
    ];
    this.personasPorPartida = [
      []
    ];
    this.modalPaso2 = false;
  }

  // NUEVO: Exportar proyecto a Excel con detalle completo y diseño profesional
  public async exportarProyectoExcel(proyecto: any): Promise<void> {
    // Obtener el detalle completo del proyecto
    const id = Number(proyecto.id);
    this.projectService.getProjectById(id).subscribe({
      next: async (detalle: ProjectResponse) => {
        // Obtener información del líder del proyecto
        let infoLider: any = {};
        try {
          const lider = await this.projectService.getLeaderById(detalle.responsable_id).toPromise();
          infoLider = lider;
        } catch (error) {
          console.warn('No se pudo obtener información del líder:', error);
        }

        // Obtener catálogos para nombres descriptivos
        let catalogs: any = {};
        try {
          const catalogsService = new CatalogsService(this.http);
          catalogs = await catalogsService.getCreateProjectCatalogs().toPromise();
        } catch (error) {
          console.warn('No se pudieron obtener los catálogos:', error);
        }

        // Función helper para obtener nombre descriptivo
        const getDisplayName = (catalog: any[], id: number): string => {
          const item = catalog?.find(c => c.id === id);
          return item?.displayName || `ID: ${id}`;
        };

        // Función helper para formatear moneda
        const formatearMoneda = (valor: number): string => {
          return `$${Number(valor).toLocaleString('es-MX', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}`;
        };

        // Función helper para formatear fecha
        const formatearFecha = (fecha: string): string => {
          return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        };

        // Calcular totales del proyecto
        const totalHorasProyecto = detalle.partidas_presupuestales?.reduce((sum, p) => sum + p.presupuesto_horas, 0) || 0;
        const totalCostoProyecto = detalle.partidas_presupuestales?.reduce((sum, p) => sum + Number(p.presupuesto_costo), 0) || 0;
        const totalPersonasProyecto = detalle.partidas_presupuestales?.reduce((sum, p) => sum + (p.asignaciones?.length || 0), 0) || 0;
        const duracionDias = Math.ceil((new Date(detalle.fecha_fin).getTime() - new Date(detalle.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24));

        // Hoja 1: Información General del Proyecto
        const infoGeneral = [
          { 'INFORMACIÓN GENERAL DEL PROYECTO': '' },
          { '': '' },
          { 'Nombre del Proyecto': detalle.nombre },
          { 'Código Interno': detalle.codigo_interno },
          { 'ID del Proyecto': detalle.id },
          { '': '' },
          { 'FECHAS DEL PROYECTO': '' },
          { 'Fecha de Inicio': formatearFecha(detalle.fecha_inicio) },
          { 'Fecha de Fin': formatearFecha(detalle.fecha_fin) },
          { 'Duración Total': `${duracionDias} días` },
          { '': '' },
          { 'PRESUPUESTOS': '' },
          { 'Presupuesto Horas Total': `${totalHorasProyecto.toLocaleString('es-MX')} horas` },
          { 'Presupuesto Costo Total': formatearMoneda(totalCostoProyecto) },
          { 'Presupuesto Horas Original': `${detalle.presupuesto_horas} horas` },
          { 'Presupuesto Costo Original': formatearMoneda(Number(detalle.presupuesto_costo)) },
          { '': '' },
          { 'EQUIPO DEL PROYECTO': '' },
          { 'Líder del Proyecto': infoLider?.nombre || 'No disponible' },
          { 'Cargo del Líder': infoLider?.cargo || 'No disponible' },
          { 'Total Partidas Presupuestales': detalle.partidas_presupuestales?.length || 0 },
          { 'Total Personas Asignadas': totalPersonasProyecto },
          { '': '' },
          { 'ESTADO DEL PROYECTO': '' },
          { 'Estado': detalle.activo ? '🟢 ACTIVO' : '🔴 ARCHIVADO' },
          { 'Fecha de Creación del Reporte': new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        ];

        // Hoja 2: Partidas Presupuestales Detalladas
        const partidas = (detalle.partidas_presupuestales || []).map((p: PartidaPresupuestal, index: number) => {
          const totalHorasAsignadas = p.asignaciones?.reduce((sum, a) => sum + (a.horas_asignadas || 0), 0) || 0;
          const totalPorcentaje = p.asignaciones?.reduce((sum, a) => sum + (parseFloat(a.porcentaje) || 0), 0) || 0;
          const costoPorHora = p.presupuesto_horas > 0 ? Number(p.presupuesto_costo) / p.presupuesto_horas : 0;
          
          return {
            'Número': index + 1,
            'ID Partida': p.id,
            'Etapa': getDisplayName(catalogs?.phasesCatalog, p.etapa_id),
            'Servicio': getDisplayName(catalogs?.servicesCatalog, p.servicio_id),
            'Tecnología': getDisplayName(catalogs?.technologiesCatalog, p.tecnologia_id),
            'Presupuesto Horas': p.presupuesto_horas,
            'Presupuesto Costo': formatearMoneda(Number(p.presupuesto_costo)),
            'Costo por Hora': formatearMoneda(costoPorHora),
            'Personas Asignadas': p.asignaciones?.length || 0,
            'Total Horas Asignadas': totalHorasAsignadas,
            'Total Porcentaje': `${totalPorcentaje.toFixed(1)}%`,
            'Estado': p.activo ? '🟢 Activa' : '🔴 Inactiva',
            'Fecha Creación': formatearFecha(p.fecha_creacion),
            'Observaciones': p.personas || 'Sin observaciones'
          };
        });

        // Hoja 3: Asignaciones Detalladas por Persona
        let asignaciones: any[] = [];
        (detalle.partidas_presupuestales || []).forEach((p: PartidaPresupuestal, partidaIndex: number) => {
          (p.asignaciones || []).forEach((a: Asignacion, asignacionIndex: number) => {
            const costoAsignacion = (a.horas_asignadas || 0) * (Number(p.presupuesto_costo) / p.presupuesto_horas);
            asignaciones.push({
              'Número Asignación': asignacionIndex + 1,
              'Partida Número': partidaIndex + 1,
              'Etapa': getDisplayName(catalogs?.phasesCatalog, p.etapa_id),
              'Servicio': getDisplayName(catalogs?.servicesCatalog, p.servicio_id),
              'Tecnología': getDisplayName(catalogs?.technologiesCatalog, p.tecnologia_id),
              'Nombre Persona': a.nombre,
              'Cargo': a.cargo || 'No especificado',
              'Horas Asignadas': a.horas_asignadas,
              'Porcentaje Asignación': `${a.porcentaje}%`,
              'Costo Asignación': formatearMoneda(costoAsignacion),
              'Fecha Asignación': formatearFecha(a.fecha_asignacion),
              'Estado': a.activo ? '🟢 Activa' : '🔴 Inactiva',
              'Foto URL': a.foto_url || 'No disponible'
            });
          });
        });

        // Hoja 4: Resumen por Etapa
        const resumenPorEtapa = new Map();
        (detalle.partidas_presupuestales || []).forEach((p: PartidaPresupuestal) => {
          const etapaNombre = getDisplayName(catalogs?.phasesCatalog, p.etapa_id);
          if (!resumenPorEtapa.has(etapaNombre)) {
            resumenPorEtapa.set(etapaNombre, {
              etapa: etapaNombre,
              partidas: 0,
              presupuestoHoras: 0,
              presupuestoCosto: 0,
              personasAsignadas: 0,
              totalHorasAsignadas: 0,
              costoPorHora: 0
            });
          }
          const resumen = resumenPorEtapa.get(etapaNombre);
          resumen.partidas++;
          resumen.presupuestoHoras += p.presupuesto_horas;
          resumen.presupuestoCosto += Number(p.presupuesto_costo);
          resumen.personasAsignadas += p.asignaciones?.length || 0;
          resumen.totalHorasAsignadas += p.asignaciones?.reduce((sum, a) => sum + (a.horas_asignadas || 0), 0) || 0;
        });

        const resumenEtapas = Array.from(resumenPorEtapa.values()).map(r => ({
          'Etapa': r.etapa,
          'Número Partidas': r.partidas,
          'Presupuesto Horas': r.presupuestoHoras,
          'Presupuesto Costo': formatearMoneda(r.presupuestoCosto),
          'Personas Asignadas': r.personasAsignadas,
          'Total Horas Asignadas': r.totalHorasAsignadas,
          'Costo Promedio por Hora': formatearMoneda(r.presupuestoHoras > 0 ? r.presupuestoCosto / r.presupuestoHoras : 0)
        }));

        // Hoja 5: Resumen por Persona
        const resumenPorPersona = new Map();
        (detalle.partidas_presupuestales || []).forEach((p: PartidaPresupuestal) => {
          (p.asignaciones || []).forEach((a: Asignacion) => {
            if (!resumenPorPersona.has(a.nombre)) {
              resumenPorPersona.set(a.nombre, {
                nombre: a.nombre,
                cargo: a.cargo || 'No especificado',
                partidasAsignadas: 0,
                totalHorasAsignadas: 0,
                totalPorcentaje: 0,
                totalCostoAsignado: 0,
                etapas: new Set(),
                servicios: new Set(),
                tecnologias: new Set()
              });
            }
            const resumen = resumenPorPersona.get(a.nombre);
            const costoAsignacion = (a.horas_asignadas || 0) * (Number(p.presupuesto_costo) / p.presupuesto_horas);
            
            resumen.partidasAsignadas++;
            resumen.totalHorasAsignadas += a.horas_asignadas || 0;
            resumen.totalPorcentaje += parseFloat(a.porcentaje) || 0;
            resumen.totalCostoAsignado += costoAsignacion;
            resumen.etapas.add(getDisplayName(catalogs?.phasesCatalog, p.etapa_id));
            resumen.servicios.add(getDisplayName(catalogs?.servicesCatalog, p.servicio_id));
            resumen.tecnologias.add(getDisplayName(catalogs?.technologiesCatalog, p.tecnologia_id));
          });
        });

        const resumenPersonas = Array.from(resumenPorPersona.values()).map(r => ({
          'Nombre': r.nombre,
          'Cargo': r.cargo,
          'Partidas Asignadas': r.partidasAsignadas,
          'Total Horas Asignadas': r.totalHorasAsignadas,
          'Total Porcentaje': `${r.totalPorcentaje.toFixed(1)}%`,
          'Total Costo Asignado': formatearMoneda(r.totalCostoAsignado),
          'Etapas Participando': Array.from(r.etapas).join(', '),
          'Servicios Participando': Array.from(r.servicios).join(', '),
          'Tecnologías Participando': Array.from(r.tecnologias).join(', ')
        }));

        // Crear libro y hojas con diseño profesional
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        
        // Hoja 1: Información General
        const wsInfo = XLSX.utils.json_to_sheet(infoGeneral);
        this.aplicarEstilosGenerales(wsInfo, 'Información General');
        XLSX.utils.book_append_sheet(wb, wsInfo, 'Información General');
        
        // Hoja 2: Partidas Presupuestales
        if (partidas.length > 0) {
          const wsPartidas = XLSX.utils.json_to_sheet(partidas);
          this.aplicarEstilosPartidas(wsPartidas, 'Partidas Presupuestales');
          XLSX.utils.book_append_sheet(wb, wsPartidas, 'Partidas Presupuestales');
        }
        
        // Hoja 3: Asignaciones Detalladas
        if (asignaciones.length > 0) {
          const wsAsignaciones = XLSX.utils.json_to_sheet(asignaciones);
          this.aplicarEstilosAsignaciones(wsAsignaciones, 'Asignaciones Detalladas');
          XLSX.utils.book_append_sheet(wb, wsAsignaciones, 'Asignaciones Detalladas');
        }
        
        // Hoja 4: Resumen por Etapa
        if (resumenEtapas.length > 0) {
          const wsResumenEtapas = XLSX.utils.json_to_sheet(resumenEtapas);
          this.aplicarEstilosResumen(wsResumenEtapas, 'Resumen por Etapa');
          XLSX.utils.book_append_sheet(wb, wsResumenEtapas, 'Resumen por Etapa');
        }
        
        // Hoja 5: Resumen por Persona
        if (resumenPersonas.length > 0) {
          const wsResumenPersonas = XLSX.utils.json_to_sheet(resumenPersonas);
          this.aplicarEstilosPersonas(wsResumenPersonas, 'Resumen por Persona');
          XLSX.utils.book_append_sheet(wb, wsResumenPersonas, 'Resumen por Persona');
        }

        // Descargar el archivo
        const fechaExportacion = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `📊_Reporte_Detallado_${detalle.nombre || detalle.id || 'proyecto'}_${fechaExportacion}.xlsx`);
      },
      error: (err) => {
        console.error('Error al obtener el detalle del proyecto para exportar:', err);
      }
    });
  }

  // Métodos para aplicar estilos profesionales al Excel
  private aplicarEstilosGenerales(worksheet: XLSX.WorkSheet, titulo: string): void {
    // Configurar ancho de columnas
    const colWidths = [
      { wch: 30 }, // Campo
      { wch: 40 }  // Valor
    ];
    worksheet['!cols'] = colWidths;

    // Aplicar estilos a los títulos principales
    for (let i = 0; i < 30; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
      if (worksheet[cellRef]) {
        if (worksheet[cellRef].v && typeof worksheet[cellRef].v === 'string' && 
            worksheet[cellRef].v.includes('INFORMACIÓN') || 
            worksheet[cellRef].v.includes('FECHAS') || 
            worksheet[cellRef].v.includes('PRESUPUESTOS') || 
            worksheet[cellRef].v.includes('EQUIPO') || 
            worksheet[cellRef].v.includes('ESTADO')) {
          worksheet[cellRef].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center" }
          };
        }
      }
    }
  }

  private aplicarEstilosPartidas(worksheet: XLSX.WorkSheet, titulo: string): void {
    // Configurar ancho de columnas
    const colWidths = [
      { wch: 8 },  // Número
      { wch: 12 }, // ID Partida
      { wch: 20 }, // Etapa
      { wch: 20 }, // Servicio
      { wch: 20 }, // Tecnología
      { wch: 15 }, // Presupuesto Horas
      { wch: 18 }, // Presupuesto Costo
      { wch: 15 }, // Costo por Hora
      { wch: 18 }, // Personas Asignadas
      { wch: 20 }, // Total Horas Asignadas
      { wch: 18 }, // Total Porcentaje
      { wch: 12 }, // Estado
      { wch: 20 }, // Fecha Creación
      { wch: 30 }  // Observaciones
    ];
    worksheet['!cols'] = colWidths;

    // Aplicar estilos a los encabezados
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "70AD47" } },
          alignment: { horizontal: "center" }
        };
      }
    }
  }

  private aplicarEstilosAsignaciones(worksheet: XLSX.WorkSheet, titulo: string): void {
    // Configurar ancho de columnas
    const colWidths = [
      { wch: 15 }, // Número Asignación
      { wch: 15 }, // Partida Número
      { wch: 20 }, // Etapa
      { wch: 20 }, // Servicio
      { wch: 20 }, // Tecnología
      { wch: 25 }, // Nombre Persona
      { wch: 20 }, // Cargo
      { wch: 15 }, // Horas Asignadas
      { wch: 18 }, // Porcentaje Asignación
      { wch: 18 }, // Costo Asignación
      { wch: 20 }, // Fecha Asignación
      { wch: 12 }, // Estado
      { wch: 30 }  // Foto URL
    ];
    worksheet['!cols'] = colWidths;

    // Aplicar estilos a los encabezados
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "C5504B" } },
          alignment: { horizontal: "center" }
        };
      }
    }
  }

  private aplicarEstilosResumen(worksheet: XLSX.WorkSheet, titulo: string): void {
    // Configurar ancho de columnas
    const colWidths = [
      { wch: 25 }, // Etapa
      { wch: 15 }, // Número Partidas
      { wch: 18 }, // Presupuesto Horas
      { wch: 20 }, // Presupuesto Costo
      { wch: 18 }, // Personas Asignadas
      { wch: 20 }, // Total Horas Asignadas
      { wch: 20 }  // Costo Promedio por Hora
    ];
    worksheet['!cols'] = colWidths;

    // Aplicar estilos a los encabezados
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "FFC000" } },
          alignment: { horizontal: "center" }
        };
      }
    }
  }

  private aplicarEstilosPersonas(worksheet: XLSX.WorkSheet, titulo: string): void {
    // Configurar ancho de columnas
    const colWidths = [
      { wch: 25 }, // Nombre
      { wch: 20 }, // Cargo
      { wch: 18 }, // Partidas Asignadas
      { wch: 20 }, // Total Horas Asignadas
      { wch: 18 }, // Total Porcentaje
      { wch: 20 }, // Total Costo Asignado
      { wch: 30 }, // Etapas Participando
      { wch: 30 }, // Servicios Participando
      { wch: 30 }  // Tecnologías Participando
    ];
    worksheet['!cols'] = colWidths;

    // Aplicar estilos a los encabezados
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "7030A0" } },
          alignment: { horizontal: "center" }
        };
      }
    }
  }
}