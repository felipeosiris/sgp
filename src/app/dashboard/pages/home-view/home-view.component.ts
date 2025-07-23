import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidemenuComponent } from "../../../shared/sidemenu/sidemenu.component";
import MyTimeComponent from "../my-time-view/myTime-view.component";

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidemenuComponent,
    MyTimeComponent
],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeViewComponent implements OnInit {
  hayRutaHija: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.router.events.subscribe(() => {
      this.hayRutaHija = this.route.snapshot.firstChild !== null;
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      console.log('Token en home-view:', token);
    }
  }
}
