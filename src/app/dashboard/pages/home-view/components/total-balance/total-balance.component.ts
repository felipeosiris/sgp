import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-total-balance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './total-balance.component.html',
  styleUrls: ['./total-balance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotalBalanceComponent {
  hayRutaHija: boolean = false;
  constructor() {}
}
