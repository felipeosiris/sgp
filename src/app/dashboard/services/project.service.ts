import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectResponse {
  id: number;
  nombre: string;
  codigo_interno: string;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_horas: string;
  presupuesto_costo: string;
  responsable_id: number;
  activo: boolean;
  partidas_presupuestales: PartidaPresupuestal[];
  partidas: string;
  personas: string;
}

export interface ProjectLeader {
  id: number;
  nombre: string;
  foto_url: string;
  cargo: string | null;
  personas: string;
  proyectos: string;
}

export interface PartidaPresupuestal {
  id: number;
  proyecto_id: number;
  presupuesto_horas: number;
  presupuesto_costo: string;
  etapa_id: number;
  servicio_id: number;
  tecnologia_id: number;
  activo: boolean;
  fecha_creacion: string;
  asignaciones: Asignacion[];
  etapa: string;
  personas: string;
  costo: string;
  suma_horas_registro: string;
  maximo_horas_registro: string | null;
  porcentaje_horas: string | null;
  porcentaje_costo: string;
}

export interface Asignacion {
  id: number;
  usuario_id: number;
  partida_id: number;
  horas_asignadas: number;
  porcentaje: string;
  fecha_asignacion: string;
  foto_url: string;
  photo_b64: string;
  horas_registradas: string;
  activo: boolean | null;
  cargo: string | null;
  nombre: string;
  maximo_horas: string | null;
  porcentaje_registro: string | null;
}

export interface ValidacionColaborador {
  userId: number;
  leaderName: string;
  leaderPhoto: string;
  leaderPosition: string;
  activity: string;
  internalCode: string;
  startDate: string;
  endDate: string;
  dailyAverage: number;
  approvalStatus: string;
}

export interface ValidacionAdmin {
  userId: number;
  userName: string;
  userEmail: string;
  userPhotoUrl: string;
  userPosition: string | null;
  activityId: string;
  activityName: string;
  startDate: string;
  endDate: string;
  totalHours: string;
  totalTXTHours: string;
  dailyAverage: string;
  registroHorasIds: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'https://express-pg-app-qa.fly.dev/projects';
  private baseUrl = 'https://express-pg-app-qa.fly.dev/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    let token = null;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('access_token');
    }
    return new HttpHeaders().set('Authorization', token ? `Bearer ${token}` : '');
  }

  getProjectById(id: number): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.apiUrl}/getById/${id}`);
  }

  getLeaderById(id: number): Observable<ProjectLeader> {
    return this.http.get<ProjectLeader>(`${this.apiUrl}/getLeaderById/${id}`);
  }

  archiveProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getValidationsByUserId(userId: number): Observable<ValidacionColaborador[]> {
    return this.http.get<ValidacionColaborador[]>(
      `${this.baseUrl}/Inbox/getValidationsByUserId/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  getTimeAprovalPendingRecords(leaderId: number): Observable<ValidacionAdmin[]> {
    return this.http.get<ValidacionAdmin[]>(
      `https://express-pg-app-qa.fly.dev/time-approval/pending-records/${leaderId}`,
      { headers: this.getHeaders() }
    );
  }

  updateTimeApprovalStatus(body: { leaderId: number; timeRegistrationIds: number[]; status: boolean }): Observable<any> {
    return this.http.put(
      'https://express-pg-app-qa.fly.dev/time-approval/update-status',
      body,
      { headers: this.getHeaders() }
    );
  }
} 