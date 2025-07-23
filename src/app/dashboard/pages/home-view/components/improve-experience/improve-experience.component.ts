import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-improve-experience',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './improve-experience.component.html',
  styleUrls: ['./improve-experience.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImproveExperienceComponent {
  constructor() {}
}
