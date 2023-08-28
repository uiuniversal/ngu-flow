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
} from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ContainerComponent } from './container.component';
import { Subject, startWith } from 'rxjs';

interface FlowOptions {
  x: number;
  y: number;
  id: string;
  deps: string[];
}

interface Arrow {
  d: any;
  deps: string[];
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
  }

  get list() {
    return Array.from(this.items.values());
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: '[flowChild]',
  template: `<ng-content></ng-content>
    <div #dot class="dot dot-left"></div>
    <div #dot class="dot dot-right"></div>
    <div #dot class="dot dot-top"></div>
    <div #dot class="dot dot-bottom"></div>`,
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
export class FlowChildComponent implements OnInit {
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

  positionChange = new Subject<{ x: number; y: number }>();

  constructor(
    public el: ElementRef<HTMLDivElement>,
    private flow: FlowService,
    private ngZone: NgZone
  ) {
    this.el.nativeElement.style.position = 'absolute';
    this.el.nativeElement.style.transformOrigin = '0, 0';
    // track mouse move outside angular
    this.ngZone.runOutsideAngular(() => {
      // mouse move event
      document.addEventListener('mousemove', this.onMouseMove);

      // mouse up event
      this.el.nativeElement.addEventListener('mouseup', (event) => {
        event.stopPropagation();
        this.isDragging = false;
      });

      // mouse down event
      this.el.nativeElement.addEventListener('mousedown', (event) => {
        event.stopPropagation();
        this.isDragging = true;
        const rect = this.el.nativeElement.getBoundingClientRect();
        this.offsetX = event.clientX - rect.x;
        this.offsetY = event.clientY - rect.y;
      });
    });
  }

  private onMouseMove = (event: MouseEvent) => {
    if (this.isDragging) {
      event.stopPropagation();
      const x =
        Math.round(
          (event.clientX - this.flow.panX - this.offsetX) /
            (this.flow.gridSize * this.flow.scale)
        ) * this.flow.gridSize;
      const y =
        Math.round(
          (event.clientY - this.flow.panY - this.offsetY) /
            (this.flow.gridSize * this.flow.scale)
        ) * this.flow.gridSize;

      this.position.x = x;
      this.position.y = y;
      this.flow.arrowsChange.next(this.position);
      this.updatePosition(x, y);
    }
  };

  ngOnInit() {
    this.updatePosition(this.position.x, this.position.y);
  }

  private updatePosition(x: number, y: number) {
    this.el.nativeElement.style.transform = `translate(${x}px, ${y}px)`;
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
        <g #g>
          <path
            #arrowPaths
            *ngFor="let arrow of flow.arrows"
            [attr.d]="arrow.d"
            url="url(#arrowhead)"
            fill="none"
            id="arrow{{ arrow.deps[0] }}"
            stroke="blue"
            stroke-width="2"
            marker-end="url(#arrowhead)"
          ></path>
        </g>
      </svg>
      <ng-content></ng-content>
    </div>`,
  styles: [
    `
      :host {
        --grid-size: 20px;
        display: block;
        height: 100vh;
        position: relative;
        overflow: hidden;
        /* background-image: linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px
          ),
          linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: var(--grid-size) var(--grid-size); */
        /* background-image: radial-gradient(circle, #000 1px, transparent 1px);
        background-size: 20px 20px; */
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
        /* background-image: linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px
          ),
          linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 20px 20px; */
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
export class FlowComponent implements AfterContentInit, OnDestroy {
  @ContentChildren(FlowChildComponent) children: QueryList<FlowChildComponent> =
    new QueryList();

  @ViewChildren('arrowPaths') arrowPaths: QueryList<ElementRef<SVGPathElement>>;
  @ViewChild('zoomContainer') zoomContainer: ElementRef<HTMLDivElement>;
  @ViewChild('svg') svg: ElementRef<SVGSVGElement>;
  @ViewChild('g') g: ElementRef<SVGGElement>;

  isDraggingZoomContainer: boolean;
  initialX: number;
  initialY: number;
  readonly reverseDepsMap = new Map<string, string[]>();
  readonly closestDots = new Map<string, number>();

  constructor(
    private el: ElementRef<HTMLElement>,
    public flow: FlowService,
    private ngZone: NgZone
  ) {
    this.flow.arrowsChange.subscribe((e) => this.updateArrows(e));
    this.ngZone.runOutsideAngular(() => {
      this.el.nativeElement.addEventListener('wheel', this.zoomHandle);
      this.el.nativeElement.addEventListener(
        'mousedown',
        this.startDraggingZoomContainer
      );
      this.el.nativeElement.addEventListener(
        'mouseup',
        this.stopDraggingZoomContainer
      );
      this.el.nativeElement.addEventListener(
        'mousemove',
        this.dragZoomContainer
      );
    });
  }

  private startDraggingZoomContainer = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDraggingZoomContainer = true;
    this.initialX = event.clientX - this.flow.panX;
    this.initialY = event.clientY - this.flow.panY;
  };

  private stopDraggingZoomContainer = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDraggingZoomContainer = false;
  };

  private dragZoomContainer = (event: MouseEvent) => {
    if (this.isDraggingZoomContainer) {
      event.stopPropagation();
      this.flow.panX = event.clientX - this.initialX;
      this.flow.panY = event.clientY - this.initialY;
      this.updateZoomContainer();
    }
  };

  private zoomHandle = (event: WheelEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const scaleDirection = event.deltaY < 0 ? 1 : -1;
    this.setZoom1(event.clientX, event.clientY, scaleDirection);
  };

  private setZoom1(clientX: number, clientY: number, scaleDirection: number) {
    const { scale, panX, panY } = this.setZoom(
      clientX,
      clientY,
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

  private setZoom(
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
    // Clear existing arrows
    this.flow.arrows = [];

    // Calculate new arrows
    this.list.forEach((item) => {
      item.deps.forEach((depId) => {
        const dep = this.list.find((dep) => dep.id === depId);
        if (dep) {
          this.flow.arrows.push({
            d: `M${item.x},${item.y} L${dep.x},${dep.y}`,
            deps: [item.id, dep.id],
            startDot: 0,
            endDot: 0,
          });
        }
      });
    });
  }

  positionChange(position: { x: number; y: number; id: string }) {
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
    // Clear existing arrows
    const childObj = this.children.toArray().reduce((acc, curr) => {
      acc[curr.position.id] = curr;
      return acc;
    }, {} as Record<string, FlowChildComponent>);

    // Handle reverse dependencies
    this.closestDots.clear();
    this.reverseDepsMap.clear();
    this.list.forEach((item) => {
      item.deps.forEach((depId) => {
        if (!this.reverseDepsMap.has(depId)) {
          this.reverseDepsMap.set(depId, []);
        }
        this.reverseDepsMap.get(depId)!.push(item.id);
      });
    });

    // Create a reverse dependency map
    this.updateDotVisibility(childObj);

    // Calculate new arrows
    this.flow.arrows.forEach((arrow) => {
      const [from, to] = arrow.deps;
      const fromItem = childObj[from];
      const toItem = childObj[to];
      if (fromItem && toItem) {
        const fromClosestDots = this.getClosestDots(
          childObj,
          fromItem.position,
          this.flow.scale,
          this.flow.panX,
          this.flow.panY
        );
        const toClosestDots = this.getClosestDots(
          childObj,
          toItem.position,
          this.flow.scale,
          this.flow.panX,
          this.flow.panY,
          from
        );

        // Assuming 0 is a default value, replace it with actual logic
        const startDotIndex = fromClosestDots[0] || 0;
        const endDotIndex = toClosestDots[0] || 0;

        const startDot = this.getDotByIndex(
          childObj,
          fromItem.position,
          startDotIndex,
          this.flow.scale,
          this.flow.panX,
          this.flow.panY
        );
        const endDot = this.getDotByIndex(
          childObj,
          toItem.position,
          endDotIndex,
          this.flow.scale,
          this.flow.panX,
          this.flow.panY
        );

        arrow.d = this.calculatePath(startDot, endDot);
      }

      // the path element from viewChildren is not updated, so we need to update it manually
      const path = this.arrowPaths.find(
        (x) => x.nativeElement.id === `arrow${arrow.deps[0]}`
      );
      if (path) {
        path.nativeElement.setAttribute('d', arrow.d);
      }
    });
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
    const rect = dotEl.nativeElement.getBoundingClientRect();
    const x = (rect.x + rect.width / 2 - panX) / scale;
    const y = (rect.y + rect.height / 2 - panY) / scale;

    return { ...item, x, y, dotIndex };
  }

  private updateDotVisibility(childObj: Record<string, FlowChildComponent>) {
    Object.keys(childObj).forEach((id) => {
      const child = childObj[id];
      const position = child.position;
      const dots = child.dots.toArray();

      const closestDots = this.getClosestDots(
        childObj,
        position,
        this.flow.scale,
        this.flow.panX,
        this.flow.panY
      );

      dots.forEach((dot, index) => {
        dot.nativeElement.style.visibility = closestDots.includes(index)
          ? 'visible'
          : 'hidden';
      });
    });
  }

  private getClosestDots(
    childObj: Record<string, FlowChildComponent>,
    item: FlowOptions,
    scale: number,
    panX: number,
    panY: number,
    dep?: string
  ): number[] {
    const ids = [];
    const closestDots = new Map<string, number>();
  
    const findClosestDot = (depId: string) => {
      const dep = this.list.find((item) => item.id === depId);
      if (dep) {
        const child = childObj[item.id];
        const childDots = child.dots.toArray();
        let minDistance = Number.MAX_VALUE;
        let closestDotIndex = 0;
  
        childDots.forEach((dotEl, index) => {
          const rect = dotEl.nativeElement.getBoundingClientRect();
          const x = (rect.x + rect.width / 2 - panX) / scale;
          const y = (rect.y + rect.height / 2 - panY) / scale;
  
          const dx = dep.x - x;
          const dy = dep.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
  
          if (distance < minDistance) {
            minDistance = distance;
            closestDotIndex = index;
          }
        });
  
        closestDots.set(depId, closestDotIndex);
      }
    };
  
    // Handle dependencies
    ids.push(...item.deps);
  
    // Assuming reverseDepsMap is a map that you've created to track reverse dependencies
    const reverseDeps = this.reverseDepsMap.get(item.id) || [];
    ids.push(...reverseDeps);
  
    // Get all the closestDots
    ids.forEach(findClosestDot);
  
    const arr = Array.from(new Set(ids.map(x => closestDots.get(x) as number))); // Remove duplicates
    return dep ? [closestDots.get(dep) as number] : arr;
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
    <app-flow>
      <div [flowChild]="item" *ngFor="let item of list">{{ item.id }}</div>
    </app-flow>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'angular-flow';

  list: FlowOptions[];

  constructor() {
    this.list = [
      { x: 240, y: 160, id: '1', deps: [] },
      { x: 560, y: 20, id: '2', deps: ['1'] },
      { x: 560, y: 300, id: '3', deps: ['1'] },
      { x: 860, y: 20, id: '4', deps: ['2'] },
      { x: 860, y: 300, id: '5', deps: ['3'] },
      { x: 240, y: 460, id: '6', deps: ['1'] },
    ];
  }
}
