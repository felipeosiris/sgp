import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityType {
  id: number;
  displayName: string;
  type: string;
  color: string;
}

export interface Cause {
  id: number;
  displayName: string;
  type: string;
}

export interface TimeRecordCatalogs {
  activityTypes: ActivityType[];
  causes: Cause[];
  projects: any[];
}

export interface TimeRecord {
  id: number;
  userId: number;
  activityDisplayName: string;
  activityDisplayColor: string;
  registerDate: string;
  workedHours: number;
  workWeekId: number;
  observations: string;
  projectId?: number;
  projectDisplayName?: string;
  causeId?: number;
  causeType?: string;
  causeDisplayName?: string;
}

export interface WeekTimeRecords {
  weekId: number;
  weekStartDate: string;
  weekEndDate: string;
  timeRecords: TimeRecord[];
}

export interface MonthlyTimeRecords {
  weeks: WeekTimeRecords[];
}

export interface ProjectSummary {
  projectId: number;
  projectName: string;
  hoursUsed: number;
  plannedHours: number;
  pctUsed: number;
}

export interface TopUserSummary {
  userId: number;
  userName: string;
  userPhoto: string;
  userPosition: string;
  totalHours: number;
  totalPeriodHours: number;
  pctOfPeriod: number;
}

export interface InactiveUserSummary {
  userId: number;
  userName: string;
  userPhoto: string;
  userPosition: string;
  inactiveDays: number;
}

export interface GeneralSummary {
  totalHours: number;
  activeProjects: number;
}

export interface TimeAndProjectsSummary {
  projectsSummary: ProjectSummary[];
  topUsersSummary: TopUserSummary[];
  inactiveUsersSummary: InactiveUserSummary[];
  generalSummary: GeneralSummary;
}

@Injectable({
  providedIn: 'root'
})
export class TimeRecordService {
  private readonly API_URL = 'https://express-pg-app-qa.fly.dev/api';
  private readonly API_URL_DEV = 'https://express-pg-app-dev.fly.dev/api';

  constructor(private http: HttpClient) { }

  getTimeRecordCatalogs(userId: number): Observable<TimeRecordCatalogs> {
    return this.http.get<TimeRecordCatalogs>(`${this.API_URL}/catalogs/time-record/${userId}`);
  }

  getMonthlyTimeRecords(userId: number, monthDate: string): Observable<MonthlyTimeRecords> {
    return this.http.get<MonthlyTimeRecords>(`${this.API_URL}/time-registration/monthly`, {
      params: { userId: userId, monthDate }
    });
  }

  deleteTimeRecord(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/time-registration/${id}`);
  }
  createTimeRecord(data: {
    userId: number;
    activityTypeId: number;
    registerDate: string;
    hours: number;
    description?: string;
    projectId?: number | null;
    causeId?: number | null;
    workWeekId: number;
  }): Observable<any> {
    return this.http.post(`${this.API_URL}/time-registration/`, data);
  }

  /**
   * Descarga el reporte financiero mensual como archivo Excel
   * @param date Fecha en formato YYYY-MM-DD
   */
  downloadMonthlyTimeFinancialReport(date: string): Observable<Blob> {
    const url = `${this.API_URL_DEV}/reports/download/monthly-time-financial?date=${date}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Obtiene un resumen de los registros de tiempo y proyectos de un usuario
   * @param userId ID del usuario
   */
  getTimeAndProjectsSummary(userId: number): Observable<TimeAndProjectsSummary> {
    const url = `${this.API_URL_DEV}/reports/get-time-n-projects-summary/${userId}`;
    return this.http.get<TimeAndProjectsSummary>(url);
  }
} 