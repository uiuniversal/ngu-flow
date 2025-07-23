import { FlowDirection } from './flow-types.entity';

/**
 * Core configuration entity for flow diagram.
 * This is a pure data structure with no framework dependencies.
 */
export class FlowConfig {
  arrows = true;
  arrowSize = 20;
  strokeWidth? = 2;
  direction?: FlowDirection = 'horizontal';
  handlePositions?: 'top-bottom' | 'left-right' | 'bottom-top' | 'right-left';
  childDragging? = true;
  zooming? = true;
  gridSize? = 1;
  plugins: Record<string, any> = {};
  /**
   * Default connection mode for all edges (can be overridden at edge level)
   * - 'flexible': Arrows adapt their connection points based on node positions (dynamic)
   * - 'strict': Arrows maintain fixed connection points (static)
   * @default 'flexible'
   */
  connectionMode?: 'flexible' | 'strict' = 'flexible';
}