import { FlowComponent } from './flow.component';

export interface ChildInfo {
  position: FlowOptions;
  dots?: DOMRect[];
  el?: HTMLElement;
  elRect: DOMRect;
}

export interface FlowOptions {
  x: number;
  y: number;
  id: string;
  deps: string[];
}

export interface DotOptions extends FlowOptions {
  /**
   * The index of the dot
   * top = 0
   * right = 1
   * bottom = 2
   * left = 3
   */
  dotIndex: number;
}

export class FlowConfig {
  Arrows = true;
  ArrowSize = 20;
  Plugins: { [x: string]: FlowPlugin } = {};
}

export type FlowDirection = 'horizontal' | 'vertical';

export type ArrowPathFn = (
  start: DotOptions,
  end: DotOptions,
  arrowSize: number,
  strokeWidth: number
) => string;

export interface FlowPlugin {
  onInit?(data: FlowComponent): void;
  afterInit?(data: FlowComponent): void;
  beforeUpdate?(data: FlowComponent): void;
  afterUpdate?(data: FlowComponent): void;
}
