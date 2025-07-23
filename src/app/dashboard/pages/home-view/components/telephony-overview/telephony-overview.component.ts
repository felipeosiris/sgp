import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-telephony-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './telephony-overview.component.html',
  styleUrls: ['./telephony-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelephonyOverviewComponent {
  constructor() {}
}
