import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, AfterViewInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { isPlatformBrowser } from '@angular/common';
import { ProjectService, ProjectResponse, PartidaPresupuestal, ProjectLeader } from '../../services/project.service';
import { map, switchMap, tap } from 'rxjs/operators';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { CreateProjectModalComponent } from '../../pages/admin-view/components/modals/create-project-view.component';

// Import Chart.js for direct usage
import Chart from 'chart.js/auto';

interface ProjectData {
  nombre: string;
  id: string;
  numeroProyectos: number;
  tiempoEstimado: string;
  costoEstimado: string;
  fechaInicio: string;
  fechaFin: string;
  gerente: {
    nombre: string;
    rol: string;
    imagen: string;
    numeroProyectos: string;
    personas: string;
  };
  grafica: {
    horas: number[];
    fechas: string[];
    costos: number[];
  };
  partidasPresupuestales: {
    nombre: string;
    personas: number;
    sumaHorasAsignadas: number;
    porcentajeHoras: number;
    presupuesto_horas: number;
    costoUsado: number;
    porcentajeCosto: number;
    presupuesto_costo: number;
    horasProyecto: string;
    costoProyecto: string;
    asignaciones: {
      id: number;
      usuario_id: number;
      partida_id: number;
      nombre: string;
      cargo: string;
      foto_url: string;
      photo_b64: string;
      horas_asignadas: number;
      horas_registradas: string;
      porcentaje: string;
      fecha_asignacion: string;
      maximo_horas: string | null;
      porcentaje_registro: string | null;
    }[];
  }[];
}

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgChartsModule,
    HttpClientModule,
    CreateProjectModalComponent
  ],
  templateUrl: './project-view.component.html',
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProjectComponent implements OnInit, AfterViewInit {
  isBrowser: boolean;
  defaultAvatar = 'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png';
  imageLoading = true;
  showModalNuevoProyecto = false;

  public donutCircunferencia: number = 2 * Math.PI * 95;
  public donutVerde: number = 0;
  public donutRojo: number = 0;

  // Método para calcular el total de personas asignadas
  getTotalPersonasAsignadas(): number {
    if (!this.projectData.partidasPresupuestales) return 0;
    return this.projectData.partidasPresupuestales.reduce((total, p) => total + p.personas, 0);
  }

  // Mock para el div con la vista de KPI
  kpiData = {
    delta: {
      costoEfectivo: 80,
      costoVariable: 5,
      total: 180865,
      max: 250000
    },
    semaforoKPI: [
      { estado: 'Óptimo', descripcion: 'Gastar menos de $250K', color: 'green' },
      { estado: 'Suficiente', descripcion: 'Quedar con un presupuesto de entre $250K y $280K', color: 'yellow' },
      { estado: 'Insuficiente', descripcion: 'Tener un costo al cierre del proyecto de más de $280K', color: 'red' }
    ]
  };

  projectData: ProjectData = {
    nombre: '',
    id: '',
    numeroProyectos: 0,
    tiempoEstimado: '',
    costoEstimado: '',
    fechaInicio: '',
    fechaFin: '',
    gerente: {
      nombre: '',
      rol: '',
      imagen: this.defaultAvatar,
      numeroProyectos: "0",
      personas: "0"
    },
    grafica: {
      horas: [],
      fechas: [],
      costos: []
    },
    partidasPresupuestales: []
  };

  private chart: Chart | null = null;

  constructor(
    @Inject(PLATFORM_ID) public platformId: Object,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  loadProjectData(projectId: number) {
    forkJoin({
      project: this.projectService.getProjectById(projectId),
      leader: this.projectService.getLeaderById(projectId)
    }).pipe(
      tap(({ project, leader }) => {
        // Transformar la respuesta al formato ProjectData
        this.projectData = {
          nombre: project.nombre,
          id: `ID:${project.id}`,
          numeroProyectos: project.partidas_presupuestales.length,
          tiempoEstimado: `${project.presupuesto_horas} h`,
          costoEstimado: `$${Number(project.presupuesto_costo).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          fechaInicio: new Date(project.fecha_inicio).toLocaleString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase(),
          fechaFin: new Date(project.fecha_fin).toLocaleString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase(),
          gerente: {
            nombre: leader.nombre,
            rol: leader.cargo || 'Scrum Master',
            imagen: leader.foto_url || "",
            numeroProyectos: leader.proyectos || "0",
            personas: leader.personas || "0"
          },
          grafica: {
            horas: [0, Number(project.presupuesto_horas) * 0.6, Number(project.presupuesto_horas)],
            fechas: [
              new Date(project.fecha_inicio).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
              new Date(Date.now()).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
              new Date(project.fecha_fin).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
            ],
            costos: [0, Number(project.presupuesto_costo) * 0.6, Number(project.presupuesto_costo)]
          },
          partidasPresupuestales: project.partidas_presupuestales.map(partida => {
            const sumaHorasAsignadas = partida.asignaciones.reduce((sum, a) => sum + Number(a.horas_asignadas), 0);
            const porcentajeHoras = Math.round((sumaHorasAsignadas / Number(partida.presupuesto_horas)) * 100);
            const costoUsado = Math.round((porcentajeHoras / 100) * Number(partida.presupuesto_costo));
            return {
              nombre: partida.etapa,
              personas: Number(partida.personas),
              sumaHorasAsignadas: Number(partida.suma_horas_registro),
              porcentajeHoras: Number(partida.porcentaje_horas),
              presupuesto_horas: Number(partida.presupuesto_horas),
              costoUsado: Number(partida.costo),
              porcentajeCosto: Number(partida.porcentaje_costo),
              presupuesto_costo: Number(partida.presupuesto_costo),
              horasProyecto: 'Directo',
              costoProyecto: `$${costoUsado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              asignaciones: partida.asignaciones.map(asignacion => ({
                id: asignacion.id,
                usuario_id: asignacion.usuario_id,
                partida_id: asignacion.partida_id,
                nombre: asignacion.nombre,
                cargo: asignacion.cargo || 'Colaborador',
                foto_url: asignacion.foto_url,
                photo_b64: asignacion.photo_b64,
                horas_asignadas: asignacion.horas_asignadas,
                horas_registradas: asignacion.horas_registradas,
                porcentaje: asignacion.porcentaje,
                fecha_asignacion: asignacion.fecha_asignacion,
                maximo_horas: asignacion.maximo_horas,
                porcentaje_registro: asignacion.porcentaje_registro
              }))
            };
          })
        };

        // Calcular suma de costoUsado de todas las partidas
        const totalCostoProyecto = project.partidas_presupuestales.reduce((sum, partida) => {
          const sumaHorasAsignadas = partida.asignaciones.reduce((s, a) => s + Number(a.horas_asignadas), 0);
          const porcentajeHoras = Math.round((sumaHorasAsignadas / Number(partida.presupuesto_horas)) * 100);
          const costoUsado = Math.round((porcentajeHoras / 100) * Number(partida.presupuesto_costo));
          return sum + costoUsado;
        }, 0);

        this.kpiData.delta.max = Number(project.presupuesto_costo);
        this.kpiData.delta.total = totalCostoProyecto;

        // Calcular arcos del donut basados en delta.total y delta.max
        this.donutCircunferencia = 2 * Math.PI * 95;
        let porcentajeVerde = 0;
        let porcentajeRojo = 0;
        if (this.kpiData.delta.max > 0) {
          porcentajeVerde = Math.min(100, (this.kpiData.delta.total / this.kpiData.delta.max) * 100);
          porcentajeRojo = this.kpiData.delta.total > this.kpiData.delta.max
            ? ((this.kpiData.delta.total - this.kpiData.delta.max) / this.kpiData.delta.max) * 100
            : 0;
        }
        this.donutVerde = (porcentajeVerde / 100) * this.donutCircunferencia;
        this.donutRojo = (porcentajeRojo / 100) * this.donutCircunferencia;

        // Forzar la detección de cambios y actualizar la gráfica
        this.cdr.detectChanges();
        this.initializeChart();
      })
    ).subscribe({
      error: (error) => {
        console.error('Error al cargar el proyecto:', error);
      }
    });
  }

  private initializeChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const ctx = document.getElementById('graficaHorasPresupuesto') as HTMLCanvasElement;
    if (!ctx) return;

    // Destruir el gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.projectData.grafica.fechas,
        datasets: [
          {
            label: 'Consumo Actual (horas)',
            data: this.projectData.grafica.horas,
            borderColor: '#22C55E',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0,
            pointBackgroundColor: '#22C55E',
            pointRadius: 4,
            borderWidth: 2,
            yAxisID: 'yHoras'
          },
          {
            label: 'Costo Acumulado ($)',
            data: this.projectData.grafica.costos,
            borderColor: '#3B82F6',
            backgroundColor: 'transparent',
            borderDash: [4, 4],
            tension: 0,
            pointBackgroundColor: '#3B82F6',
            pointRadius: 4,
            borderWidth: 2,
            yAxisID: 'yCosto'
          },
          {
            label: 'Límite presupuestal ($320,000)',
            data: Array(this.projectData.grafica.fechas.length).fill(320000),
            borderColor: '#9CA3AF',
            borderDash: [2, 2],
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            yAxisID: 'yCosto'
          },
          {
            label: 'Proyección futura (horas)',
            data: [
              0,
              this.projectData.grafica.horas[1] * 0.8,
              this.projectData.grafica.horas[2] * 1.05
            ],
            borderColor: '#8B5CF6',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointBackgroundColor: '#8B5CF6',
            pointRadius: 4,
            borderWidth: 2,
            fill: false,
            yAxisID: 'yHoras'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context: any) => {
                if (context.dataset.label?.includes('Costo')) {
                  return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                }
                if (context.dataset.label?.includes('Límite presupuestal')) {
                  return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                }
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}h`;
              }
            }
          }
        },
        scales: {
          yHoras: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Horas' }
          },
          yCosto: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            title: { display: true, text: 'Costo ($)' },
            grid: { drawOnChartArea: false }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha'
            }
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const projectId = params['id'];
      if (projectId) {
        this.loadProjectData(Number(projectId));
      }
    });
  }

  ngAfterViewInit(): void {
    // Ya no inicializamos el gráfico aquí, se hará después de cargar los datos
  }

  // Método auxiliar para generar colores aleatorios para las barras
  getRandomColor(): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

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

  // Add new method to handle project creation
  onProjectCreated() {
    // Reload the current project data
    const projectId = Number(this.projectData.id.replace('ID:', ''));
    if (projectId) {
      this.loadProjectData(projectId);
    }
  }

  archiveProject(): void {
    const projectId = Number(this.projectData.id.replace('ID:', ''));
    if (projectId) {
      this.projectService.archiveProject(projectId).subscribe({
        next: () => {
          // Redirigir a la vista de admin
          this.router.navigate(['/home/admin-view']);
        },
        error: (error) => {
          console.error('Error al archivar el proyecto:', error);
        }
      });
    }
  }
}
