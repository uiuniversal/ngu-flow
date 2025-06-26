import { Routes } from '@angular/router';
import { DemoOneComponent } from './demo/demo-one.component';
import { SvgComponent } from './svg.component';
import { DemoTwoComponent } from './demo/demo-two.component';
import { MindMapComponent } from './mind-map/mind-map.component';
import { DemoBaseComponent } from './demo/demo-base.component';
import { ChainComponent } from './demo/chain.component';

export const APP_ROUTES: Routes = [
  { path: 'mindmap', component: MindMapComponent },
  {
    path: '',
    component: DemoBaseComponent,
    children: [
      { path: 'one', component: DemoOneComponent },
      { path: 'two', component: DemoTwoComponent },
      { path: 'svg', component: SvgComponent },
      { path: 'chain', component: ChainComponent },
      { path: '', redirectTo: '/chain', pathMatch: 'full' },
    ],
  },
];
