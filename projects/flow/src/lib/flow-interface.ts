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

export class FlowConfig {
  Arrows = true;
  ArrowSize = 20;
}
