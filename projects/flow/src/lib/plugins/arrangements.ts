import { FlowOptions, ChildInfo, FlowDirection } from '../flow-interface';
import { FlowComponent } from '../flow.component';
import { FlowPlugin } from './plugin';
import {
  LayoutAlgorithm,
  LayoutNode,
  LayoutOptions,
} from './layouts/layout-algorithm';
import { SimpleTreeLayout } from './layouts/simple-tree-layout';
import { SugiyamaLayout } from './layouts/sugiyama-layout';

export class Arrangements implements FlowPlugin {
  data!: FlowComponent;
  private list!: ChildInfo[];
  private direction: FlowDirection = 'horizontal';
  public horizontalPadding = 100;
  public verticalPadding = 20;
  public groupPadding = 20;
  private layoutAlgorithm: LayoutAlgorithm;
  private autoArrange = true;

  constructor(
    data?: Partial<{
      layoutAlgorithm: LayoutAlgorithm;
      autoArrange: boolean;
      verticalPadding: number;
      horizontalPadding: number;
    }>,
  ) {
    this.layoutAlgorithm = data?.layoutAlgorithm ?? new SimpleTreeLayout();
    this.autoArrange = data?.autoArrange ?? true;
    this.verticalPadding = data?.verticalPadding ?? 20;
    this.horizontalPadding = data?.horizontalPadding ?? 100;
  }

  /**
   * Get the current layout algorithm
   */
  public getLayoutAlgorithm(): LayoutAlgorithm {
    return this.layoutAlgorithm;
  }

  onInit(data: FlowComponent): void {
    this.data = data;
  }

  beforeUpdate(data: FlowComponent): void {
    this.data = data;
    // Don't auto-arrange on every update
  }

  onChange(data: FlowComponent): void {
    this.data = data;
    // Only auto-arrange if enabled
    if (this.autoArrange) {
      this.runArrange();
    }
  }

  enableAutoArrange(enabled: boolean = true): void {
    this.autoArrange = enabled;
  }

  private runArrange() {
    const newList = this._autoArrange();
    this.data.flow.update([...newList.values()]);
    this.data.flow.layoutUpdated.next();
  }

  arrange() {
    this.runArrange();
  }

  public setLayoutAlgorithm(algorithm: LayoutAlgorithm): void {
    this.layoutAlgorithm = algorithm;
  }

  public _autoArrange(): Map<string, FlowOptions> {
    this.list = this.data.list;
    this.direction = this.data.flow.config.direction!;
    // this.horizontalPadding = this.data.flow.horizontalPadding;
    // this.verticalPadding = this.data.flow.verticalPadding;
    // this.groupPadding = this.data.flow.groupPadding;

    // Convert to layout nodes with fallback dimensions
    const layoutNodes: LayoutNode[] = this.list.map((item) => {
      const width = item.elRect.width || 150;
      const height = item.elRect.height || 50;

      // Log for debugging
      if (!item.elRect.width || !item.elRect.height) {
        console.warn(
          `Node ${item.position.id} has no dimensions, using defaults: ${width}x${height}`,
        );
      }

      return {
        id: item.position.id,
        width,
        height,
        children: item.position.children,
      };
    });
    // console.log(layoutNodes);

    // Configure layout options
    const layoutOptions: LayoutOptions = {
      direction: this.direction,
      horizontalSpacing: this.horizontalPadding,
      verticalSpacing: this.verticalPadding,
      gridSize: this.data.flow.gridSize || 1,
    };

    // Run layout algorithm
    const layoutResult = this.layoutAlgorithm.layout(
      layoutNodes,
      layoutOptions,
    );

    // Update positions
    const newItems = new Map<string, FlowOptions>();
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
