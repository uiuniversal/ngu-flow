import {
  Component,
  AfterContentInit,
  ContentChildren,
  ElementRef,
  Input,
  QueryList,
  OnInit,
  Injectable,
  NgZone,
  ViewChildren,
  ViewChild,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgForOf } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ContainerComponent } from './container.component';
import { Subject, merge, startWith } from 'rxjs';
import { Connections } from './connections';

export interface FlowOptions {
  x: number;
  y: number;
  id: string;
  deps: string[];
}

interface Arrow {
  d: any;
  deps: string[];
  id: string;
  startDot: number; // Index of the starting dot
  endDot: number; // Index of the ending dot
}

@Injectable()
export class FlowService {
  readonly items = new Map<string, FlowOptions>();
  arrowsChange = new Subject<FlowOptions>();
  deps = new Map<string, string[]>();
  scale = 1;
  panX = 0;
  panY = 0;
  gridSize = 1;
  arrows: Arrow[] = [];
  zoomContainer: HTMLElement;
  connections: Connections;
  layoutUpdated = new Subject<void>();
  onMouse = new Subject<MouseEvent>();

  constructor(private ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() => {
      // mouse move event
      document.addEventListener('mousemove', this.onMouseMove);
    });
  }

  private onMouseMove = (event: MouseEvent) => {
    this.onMouse.next(event);
  };

  update(children: FlowOptions[]) {
    this.items.clear();
    children.forEach((child) => {
      this.items.set(child.id, child);
      child.deps.forEach((dep) => {
        let d = this.deps.get(dep);
        if (!d) {
          d = [];
        }
        d.push(child.id);
        this.deps.set(dep, d);
      });
    });
    this.connections = new Connections(this.list);
    const newItems = this.autoArrange();
    this.items.clear();
    newItems.forEach((value, key) => {
      this.items.set(key, value);
    });
    this.layoutUpdated.next();
  }

  public determineLevels(): Map<string, number> {
    const levels: Map<string, number> = new Map();
    const processed: Set<string> = new Set();

    const determineNodeLevel = (id: string, lvl: number) => {
      if (!levels.has(id) || levels.get(id)! < lvl) {
        levels.set(id, lvl);
      }
      processed.add(id);

      const deps = this.connections.reverseDepsMap.get(id) || [];
      deps.forEach((depId) => {
        if (!processed.has(depId)) {
          determineNodeLevel(depId, lvl + 1);
        }
      });
    };

    this.list.forEach((node) => {
      if (node.deps.length === 0) {
        determineNodeLevel(node.id, 0);
      }
    });

    return levels;
  }

  public autoArrange(
    horizontalPadding = 100,
    verticalPadding = 100
  ): Map<string, FlowOptions> {
    const levels = this.determineLevels();
    const positions: Record<number, number> = {};

    const newItems = new Map<string, FlowOptions>();

    this.list.forEach((node) => {
      const level = levels.get(node.id)!;
      if (!(level in positions)) {
        positions[level] = 0;
      }
      const newNode = {
        ...node,
        x: positions[level] * horizontalPadding,
        y: level * verticalPadding,
      };
      positions[level] += 1;
      newItems.set(node.id, newNode);
    });

    return newItems;
  }

  get list() {
    return Array.from(this.items.values());
  }

  get zRect() {
    return this.zoomContainer.getBoundingClientRect();
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: '[flowChild]',
  template: `<ng-content></ng-content>
    <div #dot class="dot dot-top"></div>
    <div #dot class="dot dot-right"></div>
    <div #dot class="dot dot-bottom"></div>
    <div #dot class="dot dot-left"></div>`,
  styles: [
    `
      .dot {
        position: absolute;
        width: 10px;
        height: 10px;
        background: red;
        border-radius: 999px;
      }
      .dot-left {
        top: 45px;
        left: -5px;
      }
      .dot-right {
        top: 45px;
        right: -5px;
      }
      .dot-top {
        left: 50%;
        top: -5px;
      }
      .dot-bottom {
        left: 50%;
        bottom: -5px;
      }
      .invisible {
        visibility: hidden;
      }
    `,
  ],
})
export class FlowChildComponent implements OnInit, OnDestroy {
  private isDragging = false;
  private offsetX = 0;
  private offsetY = 0;

  @ViewChildren('dot') dots: QueryList<ElementRef<HTMLDivElement>>;

  @Input('flowChild') position: FlowOptions = {
    x: 0,
    y: 0,
    id: '',
    deps: [],
  };

  positionChange = new Subject<FlowOptions>();

  constructor(
    public el: ElementRef<HTMLDivElement>,
    private flow: FlowService,
    private ngZone: NgZone
  ) {
    this.el.nativeElement.style.position = 'absolute';
    this.el.nativeElement.style.transformOrigin = '0, 0';
    // track mouse move outside angular
    this.ngZone.runOutsideAngular(() => {
      this.flow.onMouse.pipe(takeUntilDestroyed()).subscribe(this.onMouseMove);
      // mouse up event
      this.el.nativeElement.addEventListener('mouseup', this.onMouseUp);

      // mouse down event
      this.el.nativeElement.addEventListener('mousedown', this.onMouseDown);
    });

    merge(this.positionChange, this.flow.layoutUpdated).subscribe((x) => {
      const { left, top } = this.flow.zRect;
      console.log(this.position);
      this.updatePosition(this.position.x + left, this.position.y + top);
    });
  }

  private onMouseUp = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDragging = false;
  };

  private onMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDragging = true;
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.offsetX = event.clientX - rect.x;
    this.offsetY = event.clientY - rect.y;
  };

  private onMouseMove = (event: MouseEvent) => {
    if (this.isDragging) {
      event.stopPropagation();
      const zRect = this.flow.zRect;
      const cx = event.clientX - zRect.left;
      const cy = event.clientY - zRect.top;
      const x =
        Math.round(
          (cx - this.flow.panX - this.offsetX) /
            (this.flow.gridSize * this.flow.scale)
        ) * this.flow.gridSize;
      const y =
        Math.round(
          (cy - this.flow.panY - this.offsetY) /
            (this.flow.gridSize * this.flow.scale)
        ) * this.flow.gridSize;

      this.position.x = x - zRect.left;
      this.position.y = y - zRect.top;
      this.positionChange.next(this.position);
      this.flow.arrowsChange.next(this.position);
    }
  };

  ngOnInit() {
    this.updatePosition(this.position.x, this.position.y);
  }

  private updatePosition(x: number, y: number) {
    this.el.nativeElement.style.transform = `translate(${x}px, ${y}px)`;
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('mouseup', this.onMouseUp);
    this.el.nativeElement.removeEventListener('mousedown', this.onMouseDown);
  }
}

@Component({
  standalone: true,
  imports: [NgForOf, FlowChildComponent],
  providers: [FlowService],
  selector: 'app-flow',
  template: ` <svg class="flow-pattern">
      <pattern
        id="pattern-1undefined"
        x="7.085546445278233"
        y="-1.3184974288563538"
        width="16.772199608271144"
        height="16.772199608271144"
        patternUnits="userSpaceOnUse"
        patternTransform="translate(-0.5241312377584733,-0.5241312377584733)"
      >
        <circle
          cx="0.5241312377584733"
          cy="0.5241312377584733"
          r="0.5241312377584733"
          fill="#aaa"
        ></circle>
      </pattern>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#pattern-1undefined)"
      ></rect>
    </svg>
    <div class="zoom-container" #zoomContainer>
      <svg #svg>
        <defs>
          <marker
            id="arrowhead"
            viewBox="-10 -10 20 20"
            refX="0"
            refY="0"
            orient="auto"
          >
            <polygon points="-6.75,-6.75 0,0 -6.75,6.75"></polygon>
          </marker>
        </defs>
        <g #g></g>
        <g #guideLines></g>
      </svg>
      <ng-content></ng-content>
    </div>`,
  styles: [
    `
      :host {
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
    `,
  ],
})
export class FlowComponent
  implements AfterContentInit, AfterViewInit, OnDestroy
{
  @ContentChildren(FlowChildComponent) children: QueryList<FlowChildComponent> =
    new QueryList();

  // @ViewChildren('arrowPaths') arrowPaths: QueryList<ElementRef<SVGPathElement>>;
  @ViewChild('zoomContainer') zoomContainer: ElementRef<HTMLDivElement>;
  @ViewChild('svg') svg: ElementRef<SVGSVGElement>;
  @ViewChild('g') g: ElementRef<SVGGElement>;
  // New SVG element for guide lines
  @ViewChild('guideLines') guideLines: ElementRef<SVGGElement>;

  isDraggingZoomContainer: boolean;
  initialX = 0;
  initialY = 0;

  constructor(
    private el: ElementRef<HTMLElement>,
    public flow: FlowService,
    private ngZone: NgZone
  ) {
    this.flow.zoomContainer = this.el.nativeElement;
    this.flow.arrowsChange.subscribe((e) => this.updateArrows(e));
    this.ngZone.runOutsideAngular(() => {
      this.el.nativeElement.addEventListener('wheel', this.zoomHandle);
      this.el.nativeElement.addEventListener(
        'mousedown',
        this._startDraggingZoomContainer
      );
      this.el.nativeElement.addEventListener(
        'mouseup',
        this._stopDraggingZoomContainer
      );
      this.el.nativeElement.addEventListener(
        'mousemove',
        this._dragZoomContainer
      );
    });

    // this.flow.arrowsChange.subscribe((position) => {
    //   this.positionChange(position);
    //   const isAligned = this.checkAlignment(position);
    //   console.log(isAligned);
    //   this.hideGuideLines();
    //   if (isAligned) {
    //     this.showGuideLines(position.x, position.y);
    //   }
    // });
  }

  // checkAlignment(position: FlowOptions): boolean {
  //   const threshold = 10; // You can adjust this value
  //   let aligned = false;
  //   const x = position.x;
  //   const y = position.y;

  //   for (let item of this.flow.list) {
  //     if (item.id !== position.id) {
  //       if (
  //         Math.abs(item.x - x) <= threshold ||
  //         Math.abs(item.y - y) <= threshold
  //       ) {
  //         aligned = true;
  //       }
  //     }
  //   }

  //   return aligned;
  // }

  // // New method to show guide lines
  // showGuideLines(x: number, y: number) {
  //   const guideElement: SVGGElement = this.guideLines.nativeElement;

  //   // Create horizontal guide
  //   const horizontalGuide = document.createElementNS(
  //     'http://www.w3.org/2000/svg',
  //     'line'
  //   );
  //   horizontalGuide.setAttribute('x1', '0');
  //   horizontalGuide.setAttribute('y1', y.toString());
  //   horizontalGuide.setAttribute('x2', '100%'); // or specify an end value
  //   horizontalGuide.setAttribute('y2', y.toString());
  //   horizontalGuide.setAttribute('stroke', 'green');
  //   horizontalGuide.setAttribute('stroke-width', '2');
  //   guideElement.appendChild(horizontalGuide);

  //   // Create vertical guide
  //   const verticalGuide = document.createElementNS(
  //     'http://www.w3.org/2000/svg',
  //     'line'
  //   );
  //   verticalGuide.setAttribute('x1', x.toString());
  //   verticalGuide.setAttribute('y1', '0');
  //   verticalGuide.setAttribute('x2', x.toString());
  //   verticalGuide.setAttribute('y2', '100%'); // or specify an end value
  //   verticalGuide.setAttribute('stroke', 'green');
  //   verticalGuide.setAttribute('stroke-width', '2');
  //   guideElement.appendChild(verticalGuide);
  // }

  // // New method to hide guide lines
  // hideGuideLines() {
  //   const guideElement: SVGGElement = this.guideLines.nativeElement;
  //   while (guideElement.firstChild) {
  //     guideElement.removeChild(guideElement.firstChild);
  //   }
  // }

  public _startDraggingZoomContainer = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDraggingZoomContainer = true;
    // const containerRect = this.el.nativeElement.getBoundingClientRect();
    this.initialX = event.clientX - this.flow.panX;
    this.initialY = event.clientY - this.flow.panY;
  };

  public _stopDraggingZoomContainer = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDraggingZoomContainer = false;
  };

  public _dragZoomContainer = (event: MouseEvent) => {
    if (this.isDraggingZoomContainer) {
      event.stopPropagation();
      this.flow.panX = event.clientX - this.initialX;
      this.flow.panY = event.clientY - this.initialY;
      this.updateZoomContainer();
    }
  };

  public zoomHandle = (event: WheelEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const scaleDirection = event.deltaY < 0 ? 1 : -1;
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
      this.flow.scale
    );
    this.flow.scale = scale;
    this.flow.panX = panX;
    this.flow.panY = panY;

    // Apply the zoom and the pan
    this.updateZoomContainer();
  }

  public _setZoom(
    wheelClientX: number,
    wheelClientY: number,
    scaleDirection: number,
    panX: number,
    panY: number,
    scale: number
  ) {
    const scaleAmount = 0.01;

    // Calculate new scale
    const newScale = scale + scaleDirection * scaleAmount;

    // Calculate new pan values to keep the zoom point in the same position on the screen
    const newPanX = wheelClientX + ((panX - wheelClientX) * newScale) / scale;
    const newPanY = wheelClientY + ((panY - wheelClientY) * newScale) / scale;

    return { scale: newScale, panX: newPanX, panY: newPanY };
  }

  private updateZoomContainer() {
    this.zoomContainer.nativeElement.style.transform = `translate(${this.flow.panX}px, ${this.flow.panY}px) scale(${this.flow.scale})`;
  }

  ngAfterViewInit(): void {
    this.createArrows();
  }

  ngAfterContentInit() {
    this.children.changes
      .pipe(startWith(this.children))
      .subscribe((children) => {
        this.flow.update(this.children.map((x) => x.position));
        this.createArrows();
      });
    setTimeout(() => this.updateArrows()); // this required for angular to render the dot
  }

  get list() {
    return this.children.toArray().map((x) => x.position);
  }

  createArrows() {
    if (!this.g) {
      return;
    }
    // Clear existing arrows
    this.flow.arrows = [];
    const gElement: SVGGElement = this.g.nativeElement;

    // Remove existing paths
    while (gElement.firstChild) {
      gElement.removeChild(gElement.firstChild);
    }

    // Calculate new arrows
    this.list.forEach((item) => {
      item.deps.forEach((depId) => {
        const dep = this.list.find((dep) => dep.id === depId);
        if (dep) {
          const arrow = {
            d: `M${item.x},${item.y} L${dep.x},${dep.y}`,
            deps: [item.id, dep.id],
            startDot: 0,
            endDot: 0,
            id: `arrow${item.id}-to-${dep.id}`,
          };

          // Create path element and set attributes
          const pathElement = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path'
          );
          pathElement.setAttribute('d', arrow.d);
          pathElement.setAttribute('id', arrow.id);
          pathElement.setAttribute('stroke', 'blue');
          pathElement.setAttribute('stroke-width', '2');
          pathElement.setAttribute('fill', 'none');
          pathElement.setAttribute('marker-end', 'url(#arrowhead)');

          // Append path to <g> element
          gElement.appendChild(pathElement);

          this.flow.arrows.push(arrow);
        }
      });
    });
    this.updateArrows();
  }

  positionChange(position: FlowOptions) {
    // Find the item in the list
    const item = this.list.find((item) => item.id === position.id);

    // Update item position
    if (!item) return;
    item.x = position.x;
    item.y = position.y;

    // Update arrows
    this.updateArrows();
  }

  updateArrows(e?: FlowOptions) {
    const containerRect = this.el.nativeElement.getBoundingClientRect();
    const gElement: SVGGElement = this.g.nativeElement;
    // Clear existing arrows
    const childObj = this.children.toArray().reduce((acc, curr) => {
      acc[curr.position.id] = curr;
      return acc;
    }, {} as Record<string, FlowChildComponent>);

    // Handle reverse dependencies
    // this.closestDots.clear();
    // this.reverseDepsMap.clear();
    this.flow.connections = new Connections(this.list);

    // Calculate new arrows
    this.flow.arrows.forEach((arrow) => {
      const [from, to] = arrow.deps;
      const fromItem = childObj[from];
      const toItem = childObj[to];
      let startDot: FlowOptions = undefined as any;
      let endDot: FlowOptions = undefined as any;
      if (fromItem && toItem) {
        const fromClosestDots = this.getClosestDots(
          childObj,
          fromItem.position
        );
        const toClosestDots = this.getClosestDots(
          childObj,
          toItem.position,
          from
        );

        // Assuming 0 is a default value, replace it with actual logic
        const startDotIndex = fromClosestDots[0] || 0;
        const endDotIndex = toClosestDots[0] || 0;

        startDot = this.getDotByIndex(
          childObj,
          fromItem.position,
          startDotIndex,
          this.flow.scale,
          this.flow.panX,
          this.flow.panY
        );
        endDot = this.getDotByIndex(
          childObj,
          toItem.position,
          endDotIndex,
          this.flow.scale,
          this.flow.panX,
          this.flow.panY
        );

        arrow.d = this.calculatePath(startDot, endDot);
      }

      // Update the SVG paths
      this.flow.arrows.forEach((arrow) => {
        const pathElement = gElement.querySelector(
          `#${arrow.id}`
        ) as SVGPathElement;
        if (pathElement) {
          pathElement.setAttribute('d', arrow.d);
        }
      });
    });

    this.flow.connections.updateDotVisibility(childObj);
  }

  private getDotByIndex(
    childObj: Record<string, FlowChildComponent>,
    item: FlowOptions,
    dotIndex: number,
    scale: number,
    panX: number,
    panY: number
  ) {
    const child = childObj[item.id];
    const childDots = child.dots.toArray();

    // Make sure the dot index is within bounds
    if (dotIndex < 0 || dotIndex >= childDots.length) {
      throw new Error(`Invalid dot index: ${dotIndex}`);
    }

    const dotEl = childDots[dotIndex];
    const { left, top } = this.flow.zRect;
    const rect = dotEl.nativeElement.getBoundingClientRect();
    const x = (rect.x + rect.width / 2 - panX - left) / scale;
    const y = (rect.y + rect.height / 2 - panY - top) / scale;

    return { ...item, x, y, dotIndex };
  }

  // public getClosestDots(
  public getClosestDots(
    childObj: Record<string, FlowChildComponent>,
    item: FlowOptions,
    dep?: string
  ): number[] {
    const newObj = Object.keys(childObj).reduce((acc, curr) => {
      acc[curr] = {
        dots: childObj[curr].dots
          .toArray()
          .map((x) => x.nativeElement.getBoundingClientRect()),
      };
      return acc;
    }, {} as Record<string, { dots: DOMRect[] }>);
    return this.flow.connections.getClosestDotsSimplified(
      newObj,
      item,
      dep as string
    );
  }

  calculatePath(start: FlowOptions, end: FlowOptions) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = dist / 12; // Adjust this value to change the "tightness" of the curve

    // Check if start and end points are on the same X-axis (within +/- 5 range)
    if (Math.abs(dy) <= 5) {
      return `M${start.x} ${start.y} L${end.x} ${end.y}`;
    } else {
      const startX = start.x;
      const startY = start.y;
      const endX = end.x;
      const endY = end.y;
      const cp1x = start.x + dx / 2;
      const cp2x = end.x - dx / 2;

      // Adjust control points based on the relative positions of the start and end nodes
      const cp1y = end.y > start.y ? startY + offset : startY - offset;
      const cp2y = end.y > start.y ? endY - offset : endY + offset;

      return `M${startX} ${startY} C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`;
    }
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('wheel', this.zoomHandle);
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgForOf,
    RouterOutlet,
    FlowComponent,
    ContainerComponent,
    FlowChildComponent,
  ],
  template: `
    <button (click)="trigger()">Trigger</button>
    <div class="flex items-center justify-center h-[800px]">
      <app-flow class="max-w-[90%] max-h-[90%] border">
        <div
          class="card"
          [flowChild]="item"
          *ngFor="let item of list; let i = index"
        >
          {{ item.id }}
          <button (click)="addNode(item)">Add</button>
          <button (click)="deleteNode(i)">Delete</button>
          <button (click)="startLinking(i)">Link</button>
        </div>
      </app-flow>
    </div>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'angular-flow';
  list: FlowOptions[] = [];
  linkingFrom: number | null = null; // Store the index of the node that we start linking from

  constructor() {
    // this.list = [
    //   { x: 240, y: 160, id: '1', deps: [] },
    //   { x: 560, y: 20, id: '2', deps: ['1'] },
    //   { x: 560, y: 300, id: '3', deps: ['1'] },
    //   { x: 860, y: 20, id: '4', deps: ['2'] },
    //   { x: 860, y: 300, id: '5', deps: ['3'] },
    //   { x: 240, y: 460, id: '6', deps: ['1'] },
    // ];
    this.list = [
      { x: 40, y: 40, id: '1', deps: [] },
      { x: 200, y: 40, id: '2', deps: ['1'] },
      { x: 360, y: 40, id: '3', deps: ['2'] },
      { x: 520, y: 40, id: '4', deps: ['2'] },
      { x: 40, y: 200, id: '5', deps: ['1'] },
      { x: 200, y: 200, id: '6', deps: ['5'] },
      { x: 360, y: 200, id: '7', deps: ['5'] },
      { x: 520, y: 200, id: '8', deps: ['6', '7'] },
      // { x: 200, y: 360, id: '9', deps: ['6'] },
      // { x: 360, y: 360, id: '10', deps: ['7'] },
      // { x: 520, y: 360, id: '11', deps: ['8'] },
      // { x: 200, y: 520, id: '12', deps: ['9'] },
      // { x: 360, y: 520, id: '13', deps: ['10'] },
      // { x: 520, y: 520, id: '14', deps: ['11'] },
      // { x: 360, y: 680, id: '15', deps: ['12', '13', '14'] },
    ];
    // this.list = [
    //   {
    //     x: 40,
    //     y: 40,
    //     id: '1',
    //     deps: [],
    //   },
    //   {
    //     x: 249.09375,
    //     y: -39,
    //     id: '2',
    //     deps: ['1'],
    //   },
    //   {
    //     x: 476.09375,
    //     y: 67,
    //     id: '3',
    //     deps: ['2'],
    //   },
    //   {
    //     x: 662.09375,
    //     y: 12,
    //     id: '4',
    //     deps: ['2'],
    //   },
    //   {
    //     x: -58.90625,
    //     y: 349,
    //     id: '5',
    //     deps: ['1'],
    //   },
    //   {
    //     x: 381.09375,
    //     y: 416,
    //     id: '6',
    //     deps: ['5'],
    //   },
    //   {
    //     x: 164.09375,
    //     y: 175,
    //     id: '7',
    //     deps: ['5'],
    //   },
    //   {
    //     x: 688.09375,
    //     y: 255,
    //     id: '8',
    //     deps: ['6', '7'],
    //   },
    // ];
  }

  addNode(item: FlowOptions) {
    const newNodeId = (this.list.length + 1).toString();
    const newNode: FlowOptions = {
      x: 40 + this.list.length * 160,
      y: 40,
      id: newNodeId,
      deps: [item.id],
    };
    this.list.push(newNode);
  }

  deleteNode(index: number) {
    if (index >= 0 && index < this.list.length) {
      const deletedNode = this.list.splice(index, 1)[0];
      // Remove dependencies of the deleted node
      this.list.forEach((item) => {
        item.deps = item.deps.filter((dep) => dep !== deletedNode.id);
      });
    }
  }

  startLinking(index: number) {
    if (this.linkingFrom === null) {
      this.linkingFrom = index;
    } else {
      // Complete the linking
      if (this.linkingFrom !== index) {
        const fromNode = this.list[this.linkingFrom];
        const toNode = this.list[index];
        fromNode.deps.push(toNode.id);
      }
      this.linkingFrom = null;
    }
  }

  trigger() {
    // Your trigger logic here
  }
}
