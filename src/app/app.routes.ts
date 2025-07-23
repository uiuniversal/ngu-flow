import { Routes } from '@angular/router';
import { SvgComponent } from './svg.component';
import { DemoBaseComponent } from './demo/demo-base.component';
import { DemoSimpleComponent } from './demo/demo-simple.component';
import { DemoOneSimpleComponent } from './demo/demo-one-simple.component';
import { ChainComponent } from './demo/chain.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: DemoBaseComponent,
    children: [
      { path: 'demo', component: DemoSimpleComponent },
      { path: 'demo-one', component: DemoOneSimpleComponent },
      { path: 'svg', component: SvgComponent },
      { path: 'chain', component: ChainComponent },
      { path: '', redirectTo: '/chain', pathMatch: 'full' },
    ],
  },
];
