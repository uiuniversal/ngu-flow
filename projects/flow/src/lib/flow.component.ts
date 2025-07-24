import {
  Component,
  AfterContentInit,
  AfterViewInit,
  OnDestroy,
  contentChildren,
  viewChild,
  ElementRef,
  NgZone,
  ChangeDetectionStrategy,
  input,
  output,
  OnInit,
  inject,
  afterRenderEffect,
  untracked,
} from '@angular/core';
import { FlowChildComponent } from './flow-child.component';
import { FlowService } from './flow.service';
import { FlowNode, FlowEdge, FlowDirection } from './flow-interface';
import { FlowConfig, FlowPlugin } from './plugins/plugin';
import { Connections } from './plugins/connections';
import { MinimapComponent } from './minimap/minimap.component';

/**
 * FlowComponent - Clean Architecture Implementation
 *
 * Usage Options:
 * 1. Content Projection (Recommended for custom designs):
 *    <ngu-flow>
 *      <div flowChild="node1">Custom Node Content</div>
 *      <div flowChild="node2">Custom Node Content</div>
 *    </ngu-flow>
 *
 * 2. Nodes Input (Simple use case):
 *    <ngu-flow [nodes]="nodeArray"></ngu-flow>
 *
 * Content projection takes priority for maximum developer flexibility.
 */
@Component({
  imports: [MinimapComponent],
  providers: [FlowService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngu-flow',
  template: `
    <div class="zoom-container" #zoomContainer>
      <svg #svg>
        <defs>
          @if (config().arrows) {
            <marker
              id="arrowhead"
              [attr.markerWidth]="arrowW"
              [attr.markerHeight]="arrowH"
              refX="0"
              [attr.refY]="refY"
              orient="auto"
            >
              <polygon [attr.points]="points"></polygon>
            </marker>
          }
        </defs>
        <g #g></g>
        <!-- <g #guideLines></g> -->
        <path
          id="temp-connection"
          d=""
          fill="none"
          stroke="var(--flow-path-color)"
          stroke-width="2"
        ></path>
      </svg>
      <ng-content></ng-content>
    </div>
    <flow-minimap></flow-minimap>
  `,
  styles: [
    `
      :host {
        --dot-size: 10px;
        --flow-dot-color: red;
        --flow-path-color: blue;
        --grid-size: 20px;
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .zoom-container {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        transform-origin: 0 0;
      }

      svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
      }

      #arrowhead polygon {
        fill: var(--flow-path-color);
      }
    `,
  ],
})
export class FlowComponent
  implements OnInit, AfterContentInit, AfterViewInit, OnDestroy
{
  public el = inject(ElementRef<HTMLElement>);
  public flow = inject(FlowService);
  private ngZone = inject(NgZone);

  config = input(new FlowConfig());
  nodes = input<FlowNode[]>([]); // Optional - only used when no content children
  edges = input<FlowEdge[]>([]);
  children = contentChildren(FlowChildComponent);

  // Output events
  connectionCreated = output<FlowEdge>();

  zoomContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('zoomContainer');
  svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  g = viewChild.required<ElementRef<SVGGElement>>('g');

  // UI state for drag handling
  initialX = 0;
  initialY = 0;
  defaultPlugins = [new Connections()];

  // Arrow configuration
  arrowW = 10;
  arrowH = 10;
  refY = 3.5;
  points = '0 0, 10 3.5, 0 7';

  constructor() {
    // Use afterRenderEffect for DOM-related operations in Angular v19+
    afterRenderEffect(() => {
      // Prioritize content children over nodes input for flexibility
      const childrenArray = this.children();
      const edges = this.edges();
      untracked(() => {
        const positions =
          childrenArray.length > 0
            ? childrenArray.map((x) => x.position())
            : this.nodes();

        this.flow.updateNodes(positions);
        this.flow.updateEdges(edges);

        this.runPlugin((e) => e.beforeUpdate?.(this));
        this.runPlugin((e) => e.onChange?.(this));
        requestAnimationFrame(() =>
          this.runPlugin((p) => p.afterUpdate?.(this)),
        );
      });
    });
  }

  ngOnInit(): void {
    this.initializeConfig();
    this.initializeFlowService();
    this.setupEventListeners();
    this.setupPlugins();
  }

  private initializeConfig(): void {
    const mergedConfig = { ...new FlowConfig(), ...this.config() };
    this.flow.updateConfig(mergedConfig);
    this.calculateArrowSize();
  }

  private initializeFlowService(): void {
    this.flow.setZoomContainer(this.el.nativeElement);
    this.flow.arrowsChange.subscribe((node) => {
      this.runPlugin((p) => p.onNodeChange?.(this, node));
    });

    // Subscribe to zoom and pan changes to update DOM
    this.flow.scaleChange.subscribe(() => {
      this.updateZoomContainer();
    });

    this.flow.panChange.subscribe(() => {
      this.updateZoomContainer();
    });
  }

  private setupEventListeners(): void {
    this.ngZone.runOutsideAngular(() => {
      this.el.nativeElement.addEventListener('wheel', this._wheelHandler);
      this.el.nativeElement.addEventListener(
        'mousedown',
        this._mouseDownHandler,
      );
      this.el.nativeElement.addEventListener('mouseup', this._mouseUpHandler);
      this.el.nativeElement.addEventListener(
        'mousemove',
        this._mouseMoveHandler,
      );
    });
  }

  private setupPlugins(): void {
    this.runPlugin((p) => p.onInit?.(this));
  }

  calculateArrowSize(): void {
    const size = this.config().arrowSize!;
    const scaleFactor = size / 20;
    this.arrowW = 10 * scaleFactor;
    this.arrowH = 7 * scaleFactor;
    this.refY = 3.5 * scaleFactor;
    this.points = `0 0, ${this.arrowW} ${this.refY}, 0 ${this.arrowH}`;
  }

  ngAfterViewInit(): void {
    this.runPlugin((e) => e.afterInit?.(this));
  }

  ngAfterContentInit(): void {}

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('wheel', this._wheelHandler);
    this.el.nativeElement.removeEventListener(
      'mousedown',
      this._mouseDownHandler,
    );
    this.el.nativeElement.removeEventListener('mouseup', this._mouseUpHandler);
    this.el.nativeElement.removeEventListener(
      'mousemove',
      this._mouseMoveHandler,
    );
  }

  // Event handlers - delegate to FlowService
  private _wheelHandler = (event: WheelEvent) => {
    if (event.deltaX === 0) {
      this.flow.handleWheel(event, event.clientX, event.clientY);
    }
  };

  private _mouseDownHandler = (event: MouseEvent) => {
    event.stopPropagation();
    this.initialX = event.clientX - this.flow.getPanX();
    this.initialY = event.clientY - this.flow.getPanY();
    this.flow.handlePanStart(this.initialX, this.initialY);
  };

  private _mouseUpHandler = (event: MouseEvent) => {
    event.stopPropagation();
    this.flow.handlePanEnd();
    this.runPlugin((p) => p.onMouseUp?.(this, event));
  };

  private _mouseMoveHandler = (event: MouseEvent) => {
    this.flow.handlePan(
      event.clientX,
      event.clientY,
      this.initialX,
      this.initialY,
    );
    this.runPlugin((p) => p.onMouseMove?.(this, event));
  };

  // Public API methods
  zoomIn(): void {
    const rect = this.flow.getZoomContainerRect();
    this.flow.handleWheel(
      new WheelEvent('wheel', {
        deltaY: -100,
        clientX: rect.width / 2,
        clientY: rect.height / 2,
      }),
      rect.width / 2,
      rect.height / 2,
    );
  }

  zoomOut(): void {
    const rect = this.flow.getZoomContainerRect();
    this.flow.handleWheel(
      new WheelEvent('wheel', {
        deltaY: 100,
        clientX: rect.width / 2,
        clientY: rect.height / 2,
      }),
      rect.width / 2,
      rect.height / 2,
    );
  }

  updateChildDragging(enable = true): void {
    this.flow.updateConfig({ childDragging: enable });
    this.flow.enableChildDragging.set(enable);
  }

  updateZooming(enable = true): void {
    this.flow.updateConfig({ zooming: enable });
    this.flow.enableZooming.set(enable);
  }

  updateDirection(direction: FlowDirection): void {
    this.flow.updateConfig({ direction });
    this.runPlugin((e) => e.beforeUpdate?.(this));
    this.runPlugin((e) => e.onChange?.(this));
    requestAnimationFrame(() => this.runPlugin((p) => p.afterUpdate?.(this)));
  }

  updateZoomContainer(): void {
    const scale = this.flow.getScale();
    const panX = this.flow.getPanX();
    const panY = this.flow.getPanY();
    this.zoomContainer().nativeElement.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
  }

  // Plugin system
  public runPlugin(callback: (e: FlowPlugin) => void): void {
    const config = this.flow.getConfig();
    for (const key in config.plugins) {
      if (Object.prototype.hasOwnProperty.call(config.plugins, key)) {
        const element = config.plugins[key];
        callback(element);
      }
    }
    for (const plug of this.defaultPlugins) {
      callback(plug);
    }
  }

  // Compatibility getters and methods for plugins
  get list() {
    // When using nodes input, the order should follow the nodes array
    // When using content projection, follow the content children order
    const nodesArray = this.nodes();
    const childrenArray = this.children();

    if (nodesArray.length > 0 && childrenArray.length === 0) {
      // Using nodes input without content children - create list from nodes array
      return nodesArray.map((nodePosition) => ({
        position: nodePosition,
        dots: [],
        el: null,
        elRect: new DOMRect(),
      }));
    }

    if (nodesArray.length > 0) {
      // Both nodes and children exist - sort children to match nodes order
      const sortedChildren = nodesArray
        .map((node) =>
          childrenArray.find((child) => child.position().id === node.id),
        )
        .filter(Boolean) as typeof childrenArray;

      // Add any children not in nodes array at the end
      const usedIds = new Set(nodesArray.map((n) => n.id));
      const extraChildren = childrenArray.filter(
        (child) => !usedIds.has(child.position().id),
      );
      const allChildren = [...sortedChildren, ...extraChildren];

      return allChildren.map(this.mapChildToListItem.bind(this));
    }

    // Only content children - use their natural order
    return childrenArray.map(this.mapChildToListItem.bind(this));
  }

  private mapChildToListItem(child: any) {
    const elRect = child.el?.nativeElement?.getBoundingClientRect();
    const width = elRect ? elRect.width / this.flow.getScale() : 0;
    const height = elRect ? elRect.height / this.flow.getScale() : 0;
    const scaledElRect = elRect
      ? ({
          x: elRect.x,
          y: elRect.y,
          bottom: elRect.bottom,
          left: elRect.left,
          right: elRect.right,
          top: elRect.top,
          width,
          height,
        } as DOMRect)
      : new DOMRect();

    return {
      position: child.position(),
      dots:
        child
          .dots()
          ?.map((dot: any) => dot.nativeElement.getBoundingClientRect()) || [],
      el: child.el?.nativeElement,
      elRect: scaledElRect,
    };
  }

  getChildInfo() {
    return this.list.reduce(
      (acc, curr) => {
        acc[curr.position.id] = curr;
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  oldChildObj() {
    return this.children().reduce(
      (acc: Record<string, FlowChildComponent>, curr: FlowChildComponent) => {
        acc[curr.position().id] = curr;
        return acc;
      },
      {} as Record<string, FlowChildComponent>,
    );
  }

  // Method for plugins to emit connection events
  emitConnectionCreated(edge: FlowEdge): void {
    this.connectionCreated.emit(edge);
  }
}
