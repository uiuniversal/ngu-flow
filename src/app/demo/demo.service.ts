import { Injectable } from '@angular/core';
import { FlowComponent } from '@ngu/flow';

@Injectable({ providedIn: 'root' })
export class DemoService {
  flow: FlowComponent;

  constructor() {}
}
