import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProyectoAPI } from './projects.service';

export interface CreateProjectDTO {
  id?: number;
  nombre: string;
  codigo_interno: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_horas: number;
  presupuesto_costo: number;
  responsable_id: number;
  fecha_creacion?: string;
  activo: boolean;
  partidas: {
    id: number;
    proyecto_id: number;
    presupuesto_horas: number;
    presupuesto_costo: number;
    etapa_id: number;
    servicio_id: number;
    tecnologia_id: number;
    activo: boolean;
    fecha_creacion: string;
    asignaciones: {
      id: number;
      usuario_id: number;
      partida_id: number;
      horas_asignadas: number;
      porcentaje: number;
      fecha_asignacion: string;
    }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class CreateProjectService {
  private apiUrl = 'https://express-pg-app-qa.fly.dev/projects';

  constructor(private http: HttpClient) { }

  createProject(projectData: CreateProjectDTO): Observable<ProyectoAPI> {
    console.log('CreateProjectService: Iniciando creación de proyecto');
    
    // Generar un ID aleatorio de 4 dígitos numéricos
    function generarUUID(): number {
      return Math.floor(1000 + Math.random() * 9000);
    }

    // Calcular el total de partidas y personas
    const totalPartidas = projectData.partidas.length;
    const totalPersonas = projectData.partidas.reduce((total, partida) => {
      return total + (partida.asignaciones?.length || 0);
    }, 0);

    // Valores por defecto según el ejemplo, id ahora es un UUID
    const defaultData = {
      id: generarUUID(), // Genera un UUID único para el id
      responsable_id: 10,
      activo: true,
      partidas: totalPartidas.toString(),
      personas: totalPersonas.toString()
    };

    const payload = {
      ...defaultData,
      ...projectData
    };

    console.log('CreateProjectService: URL de la API:', this.apiUrl);
    console.log('CreateProjectService: Payload a enviar:', payload);

    return this.http.post<ProyectoAPI>(this.apiUrl, payload);
  }
} 