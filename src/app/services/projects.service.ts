import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ProyectoAPI {
  id: number;
  nombre: string;
  codigo_interno: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_horas: number | null;
  presupuesto_costo: number | null;
  activo: boolean;
  partidas_presupuestales: any[];
  partidas: any;
  personas: any;
}

export interface Proyecto {
  nombre: string;
  id: string;
  prioridad: string;
  avances: string;
  presupuesto: string;
  presupuestoReal: string;
  inicio: string;
  fin: string;
  partidas: string;
  personas: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'https://express-pg-app-dev.fly.dev/projects';

  constructor(private http: HttpClient) { }

  getAllProjects(): Observable<Proyecto[]> {
    return this.http.get<ProyectoAPI[]>(`${this.apiUrl}/getAll`).pipe(
      map(projects => this.transformProjects(projects))
    );
  }

  private transformProjects(projects: ProyectoAPI[]): Proyecto[] {
    return projects.map(project => ({
      nombre: project.nombre,
      id: project.id.toString(),
      prioridad: 'E',
      avances: '0',
      presupuesto: project.presupuesto_costo
        ? `$${Number(project.presupuesto_costo).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00',
      presupuestoReal: project.presupuesto_horas
        ? `${project.presupuesto_horas} h`
        : '0 h',
      inicio: project.fecha_inicio
        ? new Date(project.fecha_inicio).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()
        : '',
      fin: project.fecha_fin
        ? new Date(project.fecha_fin).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()
        : '',
      activo: project.activo,
      partidas: project.partidas !== null && project.partidas !== undefined ? String(project.partidas) : '0',
      personas: project.personas !== null && project.personas !== undefined ? String(project.personas) : '0'
    }));
  }
} 