import { FlowEdge } from './flow-edge.entity';
import { FlowConfig } from './flow-config.entity';

/**
 * Resolves the connection mode for an edge using the priority system:
 * 1. Edge-level mode (highest priority)
 * 2. Config-level mode 
 * 3. Default ('flexible') (lowest priority)
 */
export function resolveConnectionMode(edge: FlowEdge, config: FlowConfig): 'flexible' | 'strict' {
  // Priority 1: Edge-level mode
  if (edge.mode) {
    return edge.mode;
  }
  
  // Priority 2: Config-level mode
  if (config.connectionMode) {
    return config.connectionMode;
  }
  
  // Priority 3: Default
  return 'flexible';
}