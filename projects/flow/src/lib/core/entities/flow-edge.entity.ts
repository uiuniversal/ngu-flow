/**
 * Core entity representing an edge (connection) between nodes in the flow diagram.
 * This is a pure data structure with no framework dependencies.
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  data?: any;
  /**
   * Connection mode:
   * - 'flexible': Arrows adapt their connection points based on node positions (dynamic)
   * - 'strict': Arrows maintain fixed connection points (static)
   * @default 'flexible'
   */
  mode?: 'flexible' | 'strict';
}

/**
 * Core entity representing a visual arrow connection.
 */
export interface Arrow {
  id: string;
  d: string;
  deps: string[];
  output?: string; // Optional - only set for custom dots
  input?: string;  // Optional - only set for custom dots
  startDot: number; // Index of the starting dot
  endDot: number; // Index of the ending dot
  mode?: 'flexible' | 'strict'; // Connection mode from the edge
}