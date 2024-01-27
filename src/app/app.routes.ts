import { Routes } from '@angular/router';
import { FlowDemoComponent } from './flow-demo.component';
import { SvgComponent } from './svg.component';

export const routes: Routes = [
  { path: '', component: FlowDemoComponent },
  { path: 'svg', component: SvgComponent }
];
