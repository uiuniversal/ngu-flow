import { FlowComponent } from '../flow.component';

export class FlowConfig {
  Arrows = true;
  ArrowSize = 20;
  Plugins: { [x: string]: FlowPlugin } = {};
}

export interface FlowPlugin {
  onInit?(data: FlowComponent): void;
  afterInit?(data: FlowComponent): void;
  beforeUpdate?(data: FlowComponent): void;
  afterUpdate?(data: FlowComponent): void;
}
