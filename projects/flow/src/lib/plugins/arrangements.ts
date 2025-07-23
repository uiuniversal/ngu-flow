import { FlowNode, ChildInfo, FlowDirection } from '../flow-interface';
import { FlowComponent } from '../flow.component';
import { BasePlugin } from '../adapters/base/base-plugin';
import {
  ArrangementsConfig,
  PluginConfigManager,
} from '../core/config/plugin-config';
import {
  LayoutAlgorithm,
  LayoutNode,
  LayoutOptions,
} from './layouts/layout-algorithm';
import { SimpleTreeLayout } from './layouts/simple-tree-layout';
import { DagreLayout } from './layouts/dagre-layout';

export class Arrangements extends BasePlugin {
  private direction: FlowDirection = 'horizontal';
  public horizontalPadding = 100;
  public verticalPadding = 20;
  public groupPadding = 20;
  private layoutAlgorithm: LayoutAlgorithm;
  private autoArrange = true;
  private configManager: PluginConfigManager<ArrangementsConfig>;

  constructor(
    data?: Partial<{
      layoutAlgorithm: LayoutAlgorithm;
      autoArrange: boolean;
      verticalPadding: number;
      horizontalPadding: number;
    }>,
    config?: Partial<ArrangementsConfig>,
  ) {
    super();
    this.layoutAlgorithm = data?.layoutAlgorithm ?? new SimpleTreeLayout();
    this.autoArrange = data?.autoArrange ?? true;
    this.verticalPadding = data?.verticalPadding ?? 20;
    this.horizontalPadding = data?.horizontalPadding ?? 100;

    this.configManager = new PluginConfigManager<ArrangementsConfig>(
      {
        enabled: true,
        priority: 0,
        layoutAlgorithm: 'simple-tree',
        autoArrange: this.autoArrange,
        verticalPadding: this.verticalPadding,
        horizontalPadding: this.horizontalPadding,
      },
      config,
    );
  }

  /**
   * Get the current layout algorithm
   */
  public getLayoutAlgorithm(): LayoutAlgorithm {
    return this.layoutAlgorithm;
  }

  override onInit(data: FlowComponent): void {
    this.setData(data);
  }

  override beforeUpdate(data: FlowComponent): void {
    this.setData(data);
    // Don't auto-arrange on every update
  }

  override onChange(data: FlowComponent): void {
    this.setData(data);
    // Only auto-arrange if enabled
    const config = this.configManager.getConfig();
    if (config.autoArrange && this.configManager.isEnabled()) {
      this.runArrange();
    }
  }

  enableAutoArrange(enabled: boolean = true): void {
    this.autoArrange = enabled;
  }

  private runArrange() {
    const newList = this._autoArrange();
    console.log([...newList.values()]);
    this.data.flow.update([...newList.values()]);
    this.notifyLayoutUpdated();
  }

  arrange() {
    this.runArrange();
  }

  public setLayoutAlgorithm(algorithm: LayoutAlgorithm): void {
    this.layoutAlgorithm = algorithm;
  }

  public _autoArrange(): Map<string, FlowNode> {
    this.direction = this.getDirection();
    const config = this.configManager.getConfig();
    // this.horizontalPadding = this.data.flow.horizontalPadding;
    // this.verticalPadding = this.data.flow.verticalPadding;
    // this.groupPadding = this.data.flow.groupPadding;

    // Convert to layout nodes with fallback dimensions
    const layoutNodes: LayoutNode[] = this.list.map((item, index) => {
      const width = item.elRect.width || 150;
      const height = item.elRect.height || 50;

      // Log for debugging
      if (!item.elRect.width || !item.elRect.height) {
        console.warn(
          `Node ${item.position.id} has no dimensions, using defaults: ${width}x${height}`,
        );
      }

      // Get children from edges instead of node.children
      const edges = this.getEdges();
      const children = edges
        .filter((edge) => edge.source === item.position.id)
        .map((edge) => edge.target);

      return {
        id: item.position.id,
        width,
        height,
        children,
        originalIndex: index, // Preserve original order
      };
    });
    // console.log(layoutNodes);

    // Configure layout options
    const layoutOptions: LayoutOptions = {
      direction: this.direction,
      horizontalSpacing: config.horizontalPadding!,
      verticalSpacing: config.verticalPadding!,
      gridSize: this.data.flow.gridSize || 1,
    };

    // Run layout algorithm
    const layoutResult = this.layoutAlgorithm.layout(
      layoutNodes,
      layoutOptions,
    );

    // Update positions
    const newItems = new Map<string, FlowNode>();
    for (const item of this.list) {
      const newPos = layoutResult.positions.get(item.position.id);
      if (newPos) {
        item.position.x = newPos.x;
        item.position.y = newPos.y;
      }
      newItems.set(item.position.id, item.position);
    }

    return newItems;
  }
}
