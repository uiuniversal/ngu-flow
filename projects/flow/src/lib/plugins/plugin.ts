import { FlowDirection } from '../flow-interface';
import { FlowComponent } from '../flow.component';

export class FlowConfig {
  arrows = true;
  arrowSize = 20;
  strokeWidth? = 2;
  plugins: FlowPlugins = {};
  direction?: FlowDirection = 'horizontal';
  handlePositions?: 'top-bottom' | 'left-right' | 'bottom-top' | 'right-left';
}

export type FlowPlugins = Record<string, FlowPlugin>;

export interface FlowPlugin {
  onInit?(data: FlowComponent): void;
  afterInit?(data: FlowComponent): void;
  beforeUpdate?(data: FlowComponent): void;
  afterUpdate?(data: FlowComponent): void;
}
