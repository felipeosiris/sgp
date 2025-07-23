import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission } from '../interfaces/permission.interface';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private baseUrl = 'https://express-pg-app-qa.fly.dev/api/role-permissions/role-permissions';

  constructor(private http: HttpClient) {}

  getPermissionsByUserId(userId: number): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/${userId}`);
  }
} 