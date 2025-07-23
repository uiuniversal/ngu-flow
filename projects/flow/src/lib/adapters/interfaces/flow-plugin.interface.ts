import { FlowNode } from '../../core/entities';

/**
 * Plugin interface that lives in the adapters layer.
 * Plugins can interact with framework components through this interface.
 */
export interface FlowPlugin {
  onInit?(component: any): void;
  afterInit?(component: any): void;
  // This is called when the list of nodes is changed
  onChange?(component: any): void;
  // This is called when a node is changed
  onNodeChange?(component: any, node: FlowNode): void;
  beforeUpdate?(component: any): void;
  afterUpdate?(component: any): void;
  onMouseMove?(component: any, event: MouseEvent): void;
  onMouseUp?(component: any, event: MouseEvent): void;
}

export type FlowPlugins = Record<string, FlowPlugin>;
