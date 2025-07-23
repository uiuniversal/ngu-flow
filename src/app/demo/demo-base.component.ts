import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-demo-base',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: ` <div class="flex gap-2 p-2">
      <a class="p-2 rounded" routerLinkActive="bg-gray-200" routerLink="/demo">
        Simple Demo
      </a>
      <a class="p-2 rounded" routerLinkActive="bg-gray-200" routerLink="/demo-one">
        Default Dots Demo
      </a>
      <a class="p-2 rounded" routerLinkActive="bg-gray-200" routerLink="/chain">
        Custom Dots Demo
      </a>
      <a class="p-2 rounded" routerLinkActive="bg-gray-200" routerLink="/svg">
        SVG Demo
      </a>
    </div>
    <router-outlet />`,
})
export class DemoBaseComponent {}
