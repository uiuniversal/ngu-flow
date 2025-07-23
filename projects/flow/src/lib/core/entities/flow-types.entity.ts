import { DotOptions } from './flow-node.entity';

/**
 * Core type definitions for flow diagram.
 */
export type FlowDirection = 'horizontal' | 'vertical';

/**
 * Function type for generating arrow paths between dots.
 */
export type ArrowPathFn = (
  start: DotOptions,
  end: DotOptions,
  arrowSize: number,
  strokeWidth: number,
) => string;