import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TimeRecordService } from '../../../services/time-record.service';
import { FormsModule } from '@angular/forms';
import { TimeAndProjectsSummary, ProjectSummary, TopUserSummary, InactiveUserSummary, GeneralSummary } from '../../../services/time-record.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../../services/user.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-tiempos',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './tiempos.component.html',
  styles: `
    :host {
      display: block;
    }
    .image-loading {
      opacity: 0;
      transition: opacity 0.3s ease-in;
    }
    .image-loaded {
      opacity: 1;
    }
  `
})
export class TiemposComponent implements OnInit {
  defaultAvatar = 'https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png';
  imageLoading = true;
  isDownloading = false;
  selectedMonth: string | null = null;

  // Datos para el resumen real
  projectsSummary: ProjectSummary[] = [];
  topUsersSummary: TopUserSummary[] = [];
  inactiveUsersSummary: InactiveUserSummary[] = [];
  generalSummary: GeneralSummary | null = null;
  user: User | null = null;

  private routerSubscription: Subscription | undefined;

  constructor(
    private timeRecordService: TimeRecordService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadUserAndSummary();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadUserAndSummary() {
    if (this.isBrowser()) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          console.log('savedUser', savedUser);
          const userData: User = JSON.parse(savedUser);
          this.user = userData;
          console.log('Usuario cargado:', this.user.id, this.user.name);
          this.loadSummary(this.user.id); 
        } catch (error) {
          console.error('Error al parsear el usuario desde localStorage:', error);
        }
      } else {
        console.error('No se encontró usuario en localStorage');
      }
    }
  }

  private loadSummary(userId: number) {
    // Set default to current month in YYYY-MM format
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonth = `${year}-${month}`;

    this.timeRecordService.getTimeAndProjectsSummary(userId).subscribe({
      next: (summary) => {
        this.projectsSummary = summary.projectsSummary;
        this.topUsersSummary = summary.topUsersSummary;
        this.inactiveUsersSummary = summary.inactiveUsersSummary;
        this.generalSummary = summary.generalSummary;
        this.cdr.detectChanges();
        console.log("entra getTimeAndProjectsSummary");
      },
      error: (err) => {
        console.error('Error al obtener el resumen:', err);
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = this.defaultAvatar;
    this.imageLoading = false;
  }

  handleImageLoad(event: any) {
    this.imageLoading = false;
    event.target.classList.remove('image-loading');
    event.target.classList.add('image-loaded');
  }

  descargarReporteFinanciero() {
    if (!this.selectedMonth) return;
    this.isDownloading = true;
    // selectedMonth viene en formato YYYY-MM
    const dateString = `${this.selectedMonth}-01`;
    this.timeRecordService.downloadMonthlyTimeFinancialReport(dateString).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_finanzas_${dateString}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
      },
      error: (err: unknown) => {
        alert('Error al descargar el reporte financiero');
        this.isDownloading = false;
      }
    });
  }
} 