import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiquidGlassComponent } from './liquid-glass.component';
import { LiquidGlassDirective } from './liquid-glass.directive';
import { LiquidGlassService } from './liquid-glass.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    LiquidGlassComponent,
    LiquidGlassDirective
  ],
  exports: [
    LiquidGlassComponent,
    LiquidGlassDirective
  ],
  providers: [
    LiquidGlassService
  ]
})
export class LiquidGlassModule { } 