import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProjectsService, Proyecto } from '../../../services/projects.service';
import { ProjectService, ProjectResponse } from '../../services/project.service';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-my-projects-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './my-projects-view.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MyProjectsViewComponent implements OnInit {
  proyectos: any[] = [];
  userId: number = 0;
  isLoading: boolean = false;

  // Variable para el tab seleccionado
  public selectedTab: 'activos' | 'archivados' = 'activos';

  constructor(
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.userId = this.getUserIdFromLocalStorage();
    this.cdr.detectChanges(); // Forzar detección inicial
    this.loadProjects();
  }

  private getUserIdFromLocalStorage(): number {
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
    return 10; // fallback
  }

  public loadProjects(): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // Forzar detección al iniciar carga

    this.projectsService.getAllProjects().pipe(
      switchMap(projects => {
        // Crear un array de observables para obtener los detalles de cada proyecto
        const projectDetails$ = projects.map(project => 
          this.projectService.getProjectById(Number(project.id)).pipe(
            map(projectDetail => ({
              ...project,
              responsable_id: projectDetail.responsable_id
            })),
            catchError(error => {
              console.error(`Error al obtener detalle del proyecto ${project.id}:`, error);
              // Retornar el proyecto sin responsable_id si hay error
              return of({
                ...project,
                responsable_id: null
              });
            })
          )
        );
        
        return forkJoin(projectDetails$);
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección al finalizar
      })
    ).subscribe({
      next: (projectsWithDetails) => {
        // Filtrar solo los proyectos donde el userId local sea igual al responsable_id
        this.proyectos = projectsWithDetails.filter(project => 
          project.responsable_id === this.userId
        );
        console.log('Proyectos filtrados para el usuario:', this.userId, this.proyectos);
        
        // Verificar si solo hay un proyecto activo asignado
        const proyectosActivos = this.proyectos.filter(p => p.activo === true);
        
        if (proyectosActivos.length === 1) {
          // Si solo hay un proyecto activo, redirigir automáticamente al detalle
          const proyectoUnico = proyectosActivos[0];
          console.log('Redirigiendo automáticamente al proyecto único:', proyectoUnico.id);
          this.router.navigate(['/home/project-view', proyectoUnico.id]);
        } else {
          // Si hay más de un proyecto o ninguno, mostrar la lista
          this.cdr.detectChanges(); // Forzar detección después de filtrar
        }
      },
      error: (error) => {
        console.error('Error al cargar los proyectos:', error);
        this.proyectos = [];
        this.cdr.detectChanges(); // Forzar detección en caso de error
      }
    });
  }

  // Getter para filtrar los proyectos según el tab seleccionado
  get proyectosFiltrados(): any[] {
    if (this.selectedTab === 'activos') {
      return this.proyectos.filter(p => p.activo === true);
    } else {
      return this.proyectos.filter(p => p.activo === false);
    }
  }
}
