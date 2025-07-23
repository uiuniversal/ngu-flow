import { FlowEdge } from './flow-edge.entity';

/**
 * Helper functions for creating FlowEdge instances with specific modes.
 * 
 * Note: These helpers explicitly set the edge mode, which takes priority over config.connectionMode.
 * If you want to use the global config setting, simply create edges without the mode property.
 */

/**
 * Creates a flexible edge that adapts connection points based on node positions.
 * Arrows will automatically choose the best dots based on the relative positions of nodes.
 * This will override any config.connectionMode setting.
 */
export function createFlexibleEdge(
  id: string,
  source: string,
  target: string,
  data?: any
): FlowEdge {
  return {
    id,
    source,
    target,
    mode: 'flexible',
    data,
  };
}

/**
 * Creates a strict edge that maintains fixed connection points.
 * Arrows will keep their original dots even when nodes move.
 * This will override any config.connectionMode setting.
 */
export function createStrictEdge(
  id: string,
  source: string,
  target: string,
  sourcePort?: string,
  targetPort?: string,
  data?: any
): FlowEdge {
  return {
    id,
    source,
    target,
    sourcePort,
    targetPort,
    mode: 'strict',
    data,
  };
}

/**
 * Creates a custom edge with specific ports (always strict mode).
 * When custom ports are specified, the edge automatically uses strict mode.
 * This will override any config.connectionMode setting.
 */
export function createCustomEdge(
  id: string,
  source: string,
  target: string,
  sourcePort: string,
  targetPort: string,
  data?: any
): FlowEdge {
  return {
    id,
    source,
    target,
    sourcePort,
    targetPort,
    mode: 'strict', // Custom ports always use strict mode
    data,
  };
}

/**
 * Creates an edge that will use the global config.connectionMode setting.
 * Use this when you want the edge to follow the global configuration.
 */
export function createConfigAwareEdge(
  id: string,
  source: string,
  target: string,
  sourcePort?: string,
  targetPort?: string,
  data?: any
): FlowEdge {
  return {
    id,
    source,
    target,
    sourcePort,
    targetPort,
    // No mode property - will use config.connectionMode
    data,
  };
}