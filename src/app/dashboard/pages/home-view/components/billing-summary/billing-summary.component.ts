import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-billing-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './billing-summary.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingSummaryComponent {
    user = {
    name: 'Marguerite Yourcenar',
    role: 'SCRUM Master',
    photo: 'assets/user-photo.jpg'
  };

  currentWeek = [
    { day: 'Lunes', date: 21 },
    { day: 'Martes', date: 22 },
    { day: 'Miércoles', date: 23 },
    { day: 'Jueves', date: 24 },
    { day: 'Viernes', date: 25 },
    { day: 'Sábado', date: 26 },
    { day: 'Domingo', date: 27 },
  ];

  selectedDay = 0;

  selectDay(index: number) {
    this.selectedDay = index;
  }
}
