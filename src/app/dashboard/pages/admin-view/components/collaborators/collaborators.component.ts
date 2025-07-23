import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Collaborator {
  id: number;
  name: string;
  email: string;
  position: string | null;
  area: string;
  photo_url?: string;
  role: number;
  is_active: boolean;
}

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collaborators.component.html'
})
export class CollaboratorsComponent implements OnInit {
  defaultAvatar = 'https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=';
  searchTerm: string = '';
  collaborators: Collaborator[] = [];
  filtered: Collaborator[] = [];
  loading = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchCollaborators();
  }

  fetchCollaborators() {
    this.loading = true;
    this.http.get<Collaborator[]>('https://express-pg-app-dev.fly.dev/api/users/')
      .subscribe({
        next: (data) => {
          // Puedes mapear aquí si necesitas transformar los datos
          this.collaborators = data.map(c => ({
            ...c,
            area: 'Desarrollo de software y aplicaciones', // Puedes ajustar esto si tienes el campo real
            position: c.position || 'Manager Especialista en Marketing Cloud', // Ajusta si tienes el campo real
          }));
          this.filterCollaborators();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
  }

  filterCollaborators() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filtered = this.collaborators;
      return;
    }
    this.filtered = this.collaborators.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.area.toLowerCase().includes(term) ||
      (c.position || '').toLowerCase().includes(term)
    );
  }

  handleImageError(event: any, name: string) {
    event.target.src = this.defaultAvatar + encodeURIComponent(name);
  }

  getAvatarUrl(name: string): string {
    return this.defaultAvatar + encodeURIComponent(name);
  }
} 