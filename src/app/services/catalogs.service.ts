import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CatalogItem {
  id: number;
  displayName: string;
}

export interface CatalogsResponse {
  phasesCatalog: CatalogItem[];
  servicesCatalog: CatalogItem[];
  technologiesCatalog: CatalogItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CatalogsService {
  private readonly API_URL = 'https://express-pg-app-qa.fly.dev/api';

  constructor(private http: HttpClient) { }

  getCreateProjectCatalogs(): Observable<CatalogsResponse> {
    return this.http.get<CatalogsResponse>(`${this.API_URL}/catalogs/create-project`);
  }
} 