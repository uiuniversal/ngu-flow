import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: ` <div class="flex gap-2 p-2">
      <a class="p-2 rounded" routerLinkActive="bg-gray-200" routerLink="/one">
        Demo One
      </a>
      <a class="p-2 rounded" routerLinkActive="bg-gray-200" routerLink="/two">
        Demo Two
      </a>
      <!-- <a class="p-2 rounded" routerLinkActive="bg-gray-200" routerLink="/svg">
        Svg
      </a> -->
    </div>
    <router-outlet />`,
})
export class AppComponent {
  constructor() {}
}
