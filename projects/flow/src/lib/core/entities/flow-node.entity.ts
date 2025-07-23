/**
 * Core entity representing a node in the flow diagram.
 * This is a pure data structure with no framework dependencies.
 */
export interface FlowNode {
  x: number;
  y: number;
  id: string;
  dots?: Dot[];
  data?: any;
}

/**
 * Core entity representing a connection point on a node.
 */
export interface Dot {
  id: string;
  type: 'input' | 'output';
}

/**
 * Extended node interface with dot positioning information.
 */
export interface DotOptions extends FlowNode {
  /**
   * The index of the dot
   * top = 0
   * right = 1
   * bottom = 2
   * left = 3
   */
  dotIndex: number;
}