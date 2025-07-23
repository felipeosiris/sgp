import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Catalog {
  key: string;
  label: string;
  items: { id: number; nombre: string }[];
  path: string;
}

@Component({
  selector: 'app-catalogs',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './catalogs.component.html',
  styleUrls: ['./catalogs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogsComponent {
  API_URL = 'https://express-pg-app-dev.fly.dev/api';

  catalogs: Catalog[] = [
    { key: 'stages', label: 'Etapas', items: [], path: 'stages' },
    { key: 'services', label: 'Servicios', items: [], path: 'services' },
    { key: 'technologies', label: 'Tecnologías', items: [], path: 'technology' },
    { key: 'roles', label: 'Roles', items: [], path: 'roles' },
    { key: 'reasons', label: 'Motivos', items: [], path: 'reason' },
    { key: 'activity-types', label: 'Tipos de Actividad', items: [], path: 'activity-type' },
    { key: 'positions', label: 'Puestos', items: [], path: 'position' },
    { key: 'project-types', label: 'Tipos de Proyecto', items: [], path: 'project-type' },
  ];

  selectedCatalog: Catalog = this.catalogs[0];

  modalOpen = false;
  isEditMode = false;
  modalItem: { id?: number; nombre: string } = { nombre: '' };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.catalogs.forEach(catalog => this.loadCatalog(catalog));
  }

  selectCatalog(catalog: Catalog) {
    this.selectedCatalog = catalog;
    if (catalog.items.length === 0) {
      this.loadCatalog(catalog);
    }
  }

  loadCatalog(catalog: Catalog) {
    this.http.get<any[]>(`${this.API_URL}/${catalog.path}/`).subscribe(data => {
      if (catalog.key === 'reasons') {
        catalog.items = data.map(item => ({ id: item.id, nombre: item.descripcion }));
      } else {
        catalog.items = data;
      }
      this.cdr.detectChanges();
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.modalItem = { nombre: '' };
    this.modalOpen = true;
  }

  openEditModal(item: { id: number; nombre: string }) {
    this.isEditMode = true;
    this.modalItem = { ...item };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
  }

  saveItem() {
    if (this.isEditMode && this.modalItem.id != null) {
      // Editar
      this.http.put(`${this.API_URL}/${this.selectedCatalog.path}/${this.modalItem.id}`, { nombre: this.modalItem.nombre }).subscribe(() => {
        this.loadCatalog(this.selectedCatalog);
        this.closeModal();
      });
    } else {
      // Agregar
      this.http.post(`${this.API_URL}/${this.selectedCatalog.path}/`, { nombre: this.modalItem.nombre }).subscribe(() => {
        this.loadCatalog(this.selectedCatalog);
        this.closeModal();
      });
    }
  }

  deleteItem(item: { id: number }) {
    this.http.delete(`${this.API_URL}/${this.selectedCatalog.path}/${item.id}`).subscribe(() => {
      this.loadCatalog(this.selectedCatalog);
    });
  }
} 