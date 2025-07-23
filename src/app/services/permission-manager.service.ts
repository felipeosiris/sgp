import { Injectable } from '@angular/core';
import { Permission } from '../interfaces/permission.interface';

@Injectable({ providedIn: 'root' })
export class PermissionManagerService {
  private permissions: Permission[] = [];

  setPermissions(permissions: Permission[]): void {
    this.permissions = permissions;
  }

  hasPermission(description: string): boolean {
    return this.permissions.some(p => p.description === description);
  }

  getPermissions(): Permission[] {
    return this.permissions;
  }
} 