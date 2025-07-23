import { FlowNode } from '../entities';

/**
 * Interfaces that the adapters layer must implement to interact with use cases.
 * These define the contracts for the dependency inversion principle.
 */

export interface IFlowPresenter {
  onScaleChange(): void;
  onPanChange(): void;
  onNodesChange(): void;
  onNodePositionChange(node: FlowNode): void;
  onLayoutUpdate(): void;
}

export interface IFlowGateway {
  getZoomContainerRect(): DOMRect;
  updateZoomContainerTransform(scale: number, panX: number, panY: number): void;
}

export interface IPluginManager {
  registerPlugin(name: string, plugin: any): void;
  triggerHook(hookName: string, ...args: any[]): void;
}