import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Persona {
  nombre: string;
  rol: string;
  horas: number;
  horasMaximas: number;
  porcentaje: number;
  imagen: string;
  proyecto?: boolean;
  certificado?: boolean;
  idioma?: boolean;
  vacaciones?: boolean;
}

export interface ApiPersona {
  userId: number;
  userName: string;
  userPhotoUrl?: string;
  userEmail: string;
  userPosition?: string;
  totalHoursPeriod: string;
  totalHours: string;
  percentageUsed: string;
  activities: Array<{
    activityId: number;
    activityName: string;
    activityRegistered: boolean;
  }>;
}

export interface PersonasFiltros {
  withProject: boolean;
  withSFCertification: boolean;
  withLanguage: boolean;
  porcentajeUsoFilter?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonasService {
  private readonly API_URL = 'https://express-pg-app-dev.fly.dev/time-approval/approved-summary';

  constructor(private http: HttpClient) { }

  getPersonas(): Observable<Persona[]>;
  getPersonas(userId: number): Observable<Persona[]>;
  getPersonas(userId: number, filtros: PersonasFiltros): Observable<Persona[]>;
  getPersonas(userId?: number, filtros?: PersonasFiltros): Observable<Persona[]> {
    if (userId === undefined) {
      // Modo mock para compatibilidad con pantallas antiguas
      const personas: Persona[] = [
        {
          nombre: 'Marguerite Yourcenar',
          rol: 'SCRUM Master',
          horas: 384,
          horasMaximas: 480,
          porcentaje: 80,
          imagen: 'assets/avatar-placeholder.png',
          proyecto: true,
          certificado: false,
          idioma: true,
          vacaciones: true
        },
        {
          nombre: 'Elena Voss',
          rol: 'Agile Facilitator',
          horas: 384,
          horasMaximas: 480,
          porcentaje: 50,
          imagen: 'assets/avatar-placeholder.png',
          proyecto: true,
          certificado: true,
          idioma: true,
          vacaciones: false
        }
      ];
      return of(personas);
    }
    if (filtros === undefined) {
      // Llamada global sin filtros
      return this.http.get<ApiPersona[]>(`${this.API_URL}/${userId}`).pipe(
        map(apiPersonas => apiPersonas.map(apiPersona => {
          const tieneProyecto = apiPersona.activities.some(activity => 
            activity.activityName === 'Proyecto' && activity.activityRegistered
          );
          const estudiandoIdioma = apiPersona.activities.some(activity => 
            activity.activityName === 'Idioma' && activity.activityRegistered
          );
          return {
            nombre: apiPersona.userName,
            rol: apiPersona.userPosition || 'Sin rol asignado',
            horas: parseFloat(apiPersona.totalHours) || 0,
            horasMaximas: parseFloat(apiPersona.totalHoursPeriod) || 480,
            porcentaje: parseFloat(apiPersona.percentageUsed) || 0,
            imagen: apiPersona.userPhotoUrl || '',
            proyecto: tieneProyecto,
            certificado: false,
            idioma: estudiandoIdioma,
            vacaciones: false
          };
        }))
      );
    }
    // Modo real con filtros
    const params: any = {
      withProject: filtros.withProject,
      withSFCertification: filtros.withSFCertification,
      withLanguage: filtros.withLanguage,
    };
    if (filtros.porcentajeUsoFilter) {
      params.porcentajeUsoFilter = filtros.porcentajeUsoFilter;
    }
    return this.http.get<ApiPersona[]>(`${this.API_URL}/${userId}`, { params }).pipe(
      map(apiPersonas => apiPersonas.map(apiPersona => {
        const tieneProyecto = apiPersona.activities.some(activity => 
          activity.activityName === 'Proyecto' && activity.activityRegistered
        );
        const estudiandoIdioma = apiPersona.activities.some(activity => 
          activity.activityName === 'Idioma' && activity.activityRegistered
        );
        return {
          nombre: apiPersona.userName,
          rol: apiPersona.userPosition || 'Sin rol asignado',
          horas: parseFloat(apiPersona.totalHours) || 0,
          horasMaximas: parseFloat(apiPersona.totalHoursPeriod) || 480,
          porcentaje: parseFloat(apiPersona.percentageUsed) || 0,
          imagen: apiPersona.userPhotoUrl || '',
          proyecto: tieneProyecto,
          certificado: false, // Por ahora lo dejamos en false
          idioma: estudiandoIdioma,
          vacaciones: false // Por ahora lo dejamos en false como mencionaste
        };
      }))
    );
  }

  getEstadisticas() {
    return of({
      totalPersonas: 320,
      enCertificacion: 120,
      sinProyecto: 20,
      proyectosActivos: 15
    });
  }
} 