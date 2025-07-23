import { FlowNode } from '../../core/entities';

/**
 * Framework-specific interfaces that depend on DOM/Angular.
 * These live in the adapters layer.
 */
export interface ChildInfo {
  position: FlowNode;
  dots?: DOMRect[];
  el?: HTMLElement;
  elRect: DOMRect;
}
