import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: ` <!-- <div class="flex gap-2 p-2">
      <a class="bg-gray-200 p-2" routerLink="">Flow Demo</a>
      <a class="bg-gray-200 p-2" routerLink="/svg">Svg</a>
    </div> -->
    <router-outlet />`,
})
export class AppComponent {
  constructor() {}
}
