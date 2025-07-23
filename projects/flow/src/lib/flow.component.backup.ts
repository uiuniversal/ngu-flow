import { NgForOf } from '@angular/common';
import {
  Component,
  AfterContentInit,
  AfterViewInit,
  OnDestroy,
  ContentChildren,
  QueryList,
  ViewChild,
  ElementRef,
  NgZone,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { startWith } from 'rxjs';
import { FlowChildComponent } from './flow-child.component';
import { FlowService } from './flow.service';
import { FlowNode, FlowEdge, ChildInfo, FlowDirection } from './flow-interface';
import { FlowConfig, FlowPlugin } from './plugins/plugin';
import { Connections } from './plugins/connections';
import { MinimapComponent } from './minimap/minimap.component';

const BASE_SCALE_AMOUNT = 0.05;

@Component({
  standalone: true,
  imports: [NgForOf, FlowChildComponent, MinimapComponent],
  providers: [FlowService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngu-flow',
  template: ` <div class="zoom-container" #zoomContainer>
      <svg #svg>
        <defs>
          @if (config.arrows) {
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

        <!-- <text font-size="20" text-anchor="middle">
        <textPath xlink:href="#arrow2-to-1" startOffset="50%">
          Follow me
        </textPath>
      </text> -->
        <!-- <text font-size="20" dy="20" dx="10">
        <textPath
          xlink:href="#arrow2-to-1"
          startOffset="50%"
          side="left"
          text-anchor="middle"
        >
          Follow me
        </textPath>
        <textPath
          xlink:href="#arrow6-to-1"
          startOffset="50%"
          side="left"
          text-anchor="middle"
        >
          Follow me
        </textPath>
      </text> -->
      </svg>
      <ng-content></ng-content>
    </div>
    <flow-minimap [flowComponent]="this"></flow-minimap>`,
  styles: [
    `
      :host {
        --dot-size: 10px;
        --flow-dot-color: red;
        --flow-path-color: blue;
        --grid-size: 20px;
        display: block;
        height: 100%;
        width: 100%;
        position: relative;
        overflow: hidden;
      }

      .flow-pattern {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0px;
        left: 0px;
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

  @Input() config: FlowConfig = new FlowConfig();
  @Input() nodes: FlowNode[] = [];
  @Input() edges: FlowEdge[] = [];
  @ContentChildren(FlowChildComponent) children =
    new QueryList<FlowChildComponent>();

  // @ViewChildren('arrowPaths') arrowPaths: QueryList<ElementRef<SVGPathElement>>;
  @ViewChild('zoomContainer') zoomContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('svg') svg!: ElementRef<SVGSVGElement>;
  @ViewChild('g') g!: ElementRef<SVGGElement>;
  // New SVG element for guide lines
  @ViewChild('guideLines') guideLines!: ElementRef<SVGGElement>;
  initialX = 0;
  initialY = 0;
  defaultPlugins = [new Connections()];

  arrowW = 10;
  arrowH = 10;
  refY = 3.5;
  points = '0 0, 10 3.5, 0 7';

  constructor() {}

  ngOnInit(): void {
    this.flow.zoomContainer = this.el.nativeElement;
    this.config = { ...new FlowConfig(), ...this.config };
    this.flow.config = this.config;
    this.calculateArrowSize();
    this.runPlugin((p) => p.onInit?.(this));
    this.flow.arrowsChange.subscribe((e) => {
      this.runPlugin((p) => p.onNodeChange?.(this, e));
    });
    this.ngZone.runOutsideAngular(() => {
      this.el.nativeElement.addEventListener('wheel', this._wheelPanning);

      this.el.nativeElement.addEventListener(
        'mousedown',
        this._startDraggingZoomContainer,
      );
      this.el.nativeElement.addEventListener('mouseup', this._onMouseUp);
      this.el.nativeElement.addEventListener('mousemove', this._onMouseMove);
    });
  }

  public _onMouseUp = (event: MouseEvent) => {
    this._stopDraggingZoomContainer(event);
    this.runPlugin((p) => p.onMouseUp?.(this, event));
  };

  public _onMouseMove = (event: MouseEvent) => {
    this._dragZoomContainer(event);
    this.runPlugin((p) => p.onMouseMove?.(this, event));
  };

  calculateArrowSize() {
    const size = this.config.arrowSize!;
    const scaleFactor = size / 20;
    this.arrowW = 10 * scaleFactor;
    this.arrowH = 7 * scaleFactor;
    this.refY = 3.5 * scaleFactor;
    this.points = `0 0, ${this.arrowW} ${this.refY}, 0 ${this.arrowH}`;
  }

  ngAfterViewInit(): void {
    this.children.changes.pipe(startWith(this.children)).subscribe(() => {
      const positions =
        this.nodes.length > 0
          ? this.nodes
          : this.children.map((x) => x.position);
      this.flow.update(positions);
      this.flow.updateEdges(this.edges);
      this.runPlugin((e) => e.beforeUpdate?.(this));
      this.runPlugin((e) => e.onChange?.(this));
      requestAnimationFrame(() => this.runPlugin((p) => p.afterUpdate?.(this)));
    });
    this.runPlugin((e) => e.afterInit?.(this));
  }

  public runPlugin(callback: (e: FlowPlugin) => void) {
    for (const key in this.config.plugins) {
      if (Object.prototype.hasOwnProperty.call(this.config.plugins, key)) {
        const element = this.config.plugins[key];
        callback(element);
      }
    }
    for (const plug of this.defaultPlugins) {
      callback(plug);
    }
  }

  ngAfterContentInit() {}

  updateChildDragging(enable = true) {
    this.flow.config.childDragging = enable;
    this.flow.enableChildDragging.next(enable);
  }

  updateZooming(enable = true) {
    this.flow.config.zooming = enable;
    this.flow.enableZooming.next(enable);
  }

  updateDirection(direction: FlowDirection) {
    this.flow.config.direction = direction;
    this.runPlugin((e) => e.beforeUpdate?.(this));
    this.runPlugin((e) => e.onChange?.(this));
    requestAnimationFrame(() => this.runPlugin((p) => p.afterUpdate?.(this)));
  }

  public _startDraggingZoomContainer = (event: MouseEvent) => {
    event.stopPropagation();
    this.flow.isDraggingZoomContainer = true;
    this.initialX = event.clientX - this.flow.panX;
    this.initialY = event.clientY - this.flow.panY;
  };

  public _stopDraggingZoomContainer = (event: MouseEvent) => {
    event.stopPropagation();
    this.flow.isDraggingZoomContainer = false;
  };

  public _dragZoomContainer = (event: MouseEvent) => {
    if (this.flow.isDraggingZoomContainer) {
      event.preventDefault();
      event.stopPropagation();
      this.flow.panX = event.clientX - this.initialX;
      this.flow.panY = event.clientY - this.initialY;
      this.updateZoomContainer();
      this.flow.panChange.next();
    }
  };

  public _wheelPanning = (event: WheelEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (event.deltaX === 0) {
      // console.log(event.deltaX);
      // this.flow.panX = event.deltaX;
      // this.flow.panY -= event.deltaY;
      // this.updateZoomContainer();
      // this.flow.panChange.next();
      // return;
      if (this.flow.enableZooming.value && this.flow.config.zooming) {
        this.zoomHandle(event);
      }
    }
  };

  // zoom in should be center on the screen
  zoomIn() {
    // we have to consider the center of the zrect respective to viewport
    this.setZoom1(this.flow.zRect.width / 2, this.flow.zRect.height / 2, 1);
  }

  zoomOut() {
    this.setZoom1(this.flow.zRect.width / 2, this.flow.zRect.height / 2, -1);
  }

  private zoomHandle = (event: WheelEvent) => {
    if (this.flow.isDraggingZoomContainer || this.flow.isChildDragging) return;
    event.stopPropagation();
    event.preventDefault();
    const scaleDirection = event.deltaY < 0 ? 1 : -1;
    // if it is zoom out and the scale is less than 0.2, then return
    if (scaleDirection === -1 && this.flow.scale < 0.3) return;
    // if it is zoom in and the scale is greater than 10, then return
    if (scaleDirection === 1 && this.flow.scale > 2) return;

    this.setZoom1(event.clientX, event.clientY, scaleDirection);
  };

  private setZoom1(clientX: number, clientY: number, scaleDirection: number) {
    const { left, top } = this.flow.zRect;
    const { scale, panX, panY } = this._setZoom(
      clientX - left,
      clientY - top,
      scaleDirection,
      this.flow.panX,
      this.flow.panY,
      this.flow.scale,
    );
    this.flow.scale = scale;
    this.flow.panX = panX;
    this.flow.panY = panY;

    // Apply the zoom and the pan
    this.updateZoomContainer();
    this.flow.scaleChange.next();
    this.flow.panChange.next();
  }

  public _setZoom(
    wheelClientX: number,
    wheelClientY: number,
    scaleDirection: number,
    panX: number,
    panY: number,
    scale: number,
  ) {
    // Make scaleAmount proportional to the current scale
    const scaleAmount = BASE_SCALE_AMOUNT * scale;
    // Calculate new scale
    const newScale = scale + scaleDirection * scaleAmount;
    // Calculate new pan values to keep the zoom point in the same position on the screen
    const newPanX = wheelClientX + ((panX - wheelClientX) * newScale) / scale;
    const newPanY = wheelClientY + ((panY - wheelClientY) * newScale) / scale;

    return { scale: newScale, panX: newPanX, panY: newPanY };
  }

  updateZoomContainer() {
    this.zoomContainer.nativeElement.style.transform = `translate3d(${this.flow.panX}px, ${this.flow.panY}px, 0) scale(${this.flow.scale})`;
  }

  get list() {
    return this.children.toArray().map((x) => {
      // calculate the width and height with scale
      const elRect = x.el.nativeElement.getBoundingClientRect();
      const width = elRect.width / this.flow.scale;
      const height = elRect.height / this.flow.scale;
      const newElRect = {
        x: elRect.x,
        y: elRect.y,
        bottom: elRect.bottom,
        left: elRect.left,
        right: elRect.right,
        top: elRect.top,
        width,
        height,
      };
      return {
        position: x.position,
        elRect: newElRect,
        dots: x.dots.map((y) => y.nativeElement.getBoundingClientRect()),
      } as ChildInfo;
    });
  }

  positionChange(position: FlowNode) {
    // Find the item in the list
    const item = this.list.find((item) => item.position.id === position.id);

    // Update item position
    if (!item) return;
    item.position.x = position.x;
    item.position.y = position.y;

    // Update corresponding node in nodes array
    const nodeIndex = this.nodes.findIndex((node) => node.id === position.id);
    if (nodeIndex !== -1) {
      this.nodes[nodeIndex] = {
        ...this.nodes[nodeIndex],
        x: position.x,
        y: position.y,
      };
    }

    // Update arrows
    requestAnimationFrame(() =>
      this.runPlugin((p) => p.onNodeChange?.(this, position)),
    );
    this.flow.nodePositionChange.next(position);
  }

  oldChildObj() {
    return this.children.toArray().reduce(
      (acc, curr) => {
        acc[curr.position.id] = curr;
        return acc;
      },
      {} as Record<string, FlowChildComponent>,
    );
  }

  getChildInfo() {
    return this.list.reduce(
      (acc, curr) => {
        acc[curr.position.id] = curr;
        return acc;
      },
      {} as Record<string, ChildInfo>,
    );
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('wheel', this._wheelPanning);
    this.el.nativeElement.removeEventListener(
      'mousedown',
      this._startDraggingZoomContainer,
    );
    this.el.nativeElement.removeEventListener(
      'mouseup',
      this._stopDraggingZoomContainer,
    );
    this.el.nativeElement.removeEventListener(
      'mousemove',
      this._dragZoomContainer,
    );
    this.el.nativeElement.removeEventListener('mousemove', this._onMouseMove);
  }
}
