import { FlowDirection, FlowOptions } from '../flow-interface';
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
  // This is called when the list of nodes is changed
  onChange?(data: FlowComponent): void;
  // This is called when a node is changed
  onNodeChange?(data: FlowComponent, node: FlowOptions): void;
  beforeUpdate?(data: FlowComponent): void;
  afterUpdate?(data: FlowComponent): void;
}
