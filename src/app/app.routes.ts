import { Routes } from '@angular/router';
import { DemoOneComponent } from './demo/demo-one.component';
import { SvgComponent } from './svg.component';
import { DemoTwoComponent } from './demo/demo-two.component';

export const routes: Routes = [
  { path: 'one', component: DemoOneComponent },
  { path: 'two', component: DemoTwoComponent },
  { path: 'svg', component: SvgComponent },
  { path: '', redirectTo: '/one', pathMatch: 'full' },
];
