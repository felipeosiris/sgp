import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TeamLeader {
  nombre: string;
  rol: string;
  imagen?: string;
  area: string;
  personas: number;
  desde: string;
}

@Component({
  selector: 'app-team-leaders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-leaders.component.html'
})
export class TeamLeadersComponent {
  defaultAvatar = 'https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=';
  searchTerm: string = '';

  leaders: TeamLeader[] = [
    {
      nombre: 'Laurie',
      rol: 'Management MKT',
      imagen: 'https://randomuser.me/api/portraits/women/1.jpg',
      area: 'Marketing',
      personas: 16,
      desde: 'FEB - 2025'
    },
    {
      nombre: 'Te-Jay',
      rol: 'Management QA',
      imagen: 'https://randomuser.me/api/portraits/men/2.jpg',
      area: 'QA',
      personas: 23,
      desde: 'FEB - 2025'
    },
    {
      nombre: 'Aon',
      rol: 'Management QA',
      imagen: 'https://randomuser.me/api/portraits/men/3.jpg',
      area: 'Desarrollo',
      personas: 12,
      desde: 'FEB - 2025'
    },
    {
      nombre: 'Aon',
      rol: 'Management Arq. Sis.',
      imagen: '',
      area: 'Cloud',
      personas: 8,
      desde: 'FEB - 2025'
    }
  ];

  get filteredLeaders(): TeamLeader[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.leaders;
    return this.leaders.filter(l =>
      l.nombre.toLowerCase().includes(term) ||
      l.area.toLowerCase().includes(term)
    );
  }

  getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  handleImageError(event: any, nombre: string) {
    event.target.src = this.defaultAvatar + encodeURIComponent(nombre);
  }

  getAvatarUrl(nombre: string): string {
    return this.defaultAvatar + encodeURIComponent(nombre);
  }
} 