import { FlowPlugin } from '../interfaces/flow-plugin.interface';
import { FlowNode } from '../../core/entities';

// Import ChildInfo from framework layer since it contains DOM references
interface ChildInfo {
  position: FlowNode;
  elRect: DOMRect;
  dots?: any;
}

/**
 * Abstract base class for all flow plugins.
 * Provides common functionality and standardized patterns.
 */
export abstract class BasePlugin implements FlowPlugin {
  protected data!: any; // FlowComponent reference
  protected list!: ChildInfo[];

  /**
   * Standard data initialization pattern used across all plugins
   */
  protected setData(data: any): void {
    this.data = data;
    this.list = data.list;
  }

  /**
   * Get current flow configuration with type safety
   */
  protected getConfig(): any {
    return this.data.flow.getConfig();
  }

  /**
   * Get current flow direction
   */
  protected getDirection(): 'horizontal' | 'vertical' {
    return this.data.flow.config.direction || 'horizontal';
  }

  /**
   * Get current scale, panX, panY values
   */
  protected getTransform(): { scale: number; panX: number; panY: number } {
    return {
      scale: this.data.flow.scale,
      panX: this.data.flow.panX,
      panY: this.data.flow.panY,
    };
  }

  /**
   * Get container bounds
   */
  protected getContainerRect(): DOMRect {
    return this.data.zoomContainer.nativeElement.getBoundingClientRect();
  }

  /**
   * Get SVG group element for drawing
   */
  protected getSvgGroup(): SVGGElement {
    return this.data.g.nativeElement;
  }

  /**
   * Notify other plugins that layout has been updated
   */
  protected notifyLayoutUpdated(): void {
    this.data.flow.layoutUpdated.next();
  }

  /**
   * Update zoom container after making changes
   */
  protected updateZoomContainer(): void {
    this.data.updateZoomContainer();
  }

  /**
   * Run a callback on all plugins
   */
  protected runPluginCallback(callback: (plugin: FlowPlugin) => void): void {
    this.data.runPlugin(callback);
  }

  /**
   * Find a node by ID
   */
  protected findNodeById(id: string): ChildInfo | undefined {
    return this.list.find((item) => item.position.id === id);
  }

  /**
   * Get all edges from the flow
   */
  protected getEdges(): any[] {
    return Array.from(this.data.flow.edges.values());
  }

  // Abstract methods that can be implemented by concrete plugins
  onInit?(component: any): void;
  afterInit?(component: any): void;
  onChange?(component: any): void;
  onNodeChange?(component: any, node: FlowNode): void;
  beforeUpdate?(component: any): void;
  afterUpdate?(component: any): void;
  onMouseMove?(component: any, event: MouseEvent): void;
  onMouseUp?(component: any, event: MouseEvent): void;
}
