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
  HostListener,
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

@Injectable()
export class FlowService {
  readonly items = new Map<string, FlowOptions>();
  arrowsChange = new Subject<FlowOptions>();
  deps = new Map<string, string[]>();

  gridSize = 1;
  arrows: { d: any; deps: string[] }[] = [];

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
    <div #dot class="dot" [ngClass]="isLeft ? 'dot-left' : 'invisible'"></div>
    <div #dot class="dot" [ngClass]="isRight ? 'dot-right' : 'invisible'"></div>
    <!-- <div #dot class="dot" [ngClass]="isTop ? 'dot-top' : 'invisible'"></div> -->
    <!-- <div
      #dot
      class="dot"
      [ngClass]="isBottom ? 'dot-bottom' : 'invisible'"
    ></div>  --> `,
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

  // @HostListener('mousedown', ['$event'])
  // onMousedown(event: MouseEvent) {
  //   this.isDragging = true;
  //   const rect = this.el.nativeElement.getBoundingClientRect();
  //   this.offsetX = event.clientX - rect.x;
  //   this.offsetY = event.clientY - rect.y;
  // }

  // @HostListener('document:mouseup', ['$event'])
  // onMouseup(event: MouseEvent) {
  //   this.isDragging = false;
  // }

  constructor(
    private el: ElementRef<HTMLDivElement>,
    private flow: FlowService,
    private ngZone: NgZone
  ) {
    this.el.nativeElement.style.position = 'absolute';
    this.el.nativeElement.style.transformOrigin = '0, 0';
    // track mouse move outside angular
    this.ngZone.runOutsideAngular(() => {
      // mouse move event
      document.addEventListener('mousemove', (event) => {
        if (this.isDragging) {
          this.ngZone.run(() => {
            const x =
              Math.round((event.clientX - this.offsetX) / this.flow.gridSize) *
              this.flow.gridSize;
            const y =
              Math.round((event.clientY - this.offsetY) / this.flow.gridSize) *
              this.flow.gridSize;

            this.position.x = x;
            this.position.y = y;
            this.flow.arrowsChange.next(this.position);
            this.updatePosition(x, y);
          });
        }
      });

      // mouse up event
      this.el.nativeElement.addEventListener('mouseup', (event) => {
        this.isDragging = false;
      });

      // mouse down event
      this.el.nativeElement.addEventListener('mousedown', (event) => {
        this.isDragging = true;
        const rect = this.el.nativeElement.getBoundingClientRect();
        this.offsetX = event.clientX - rect.x;
        this.offsetY = event.clientY - rect.y;
      });
    });
  }

  ngOnInit() {
    this.updatePosition(this.position.x, this.position.y);
  }

  // @HostListener('document:mousemove', ['$event'])
  // onMousemove(event: MouseEvent) {
  //   if (this.isDragging) {
  //     const x =
  //       Math.round((event.clientX - this.offsetX) / this.flow.gridSize) *
  //       this.flow.gridSize;
  //     const y =
  //       Math.round((event.clientY - this.offsetY) / this.flow.gridSize) *
  //       this.flow.gridSize;

  //     this.position.x = x;
  //     this.position.y = y;
  //     this.flow.arrowsChange.next(this.position);
  //     this.updatePosition(x, y);
  //   }
  // }

  get isLeft() {
    const ids = this.flow.deps.get(this.position.id);
    let isDep = ids?.some((id) => {
      const item = this.flow.items.get(id);
      if (item) {
        return item.x < this.position.x;
      }
      return false;
    });

    // check whether the deps is left
    const item = this.flow.items.get(this.position.id);
    if (!isDep && item) {
      isDep = item.deps.some((id) => {
        const item = this.flow.items.get(id);
        if (item) {
          return item.x < this.position.x;
        }
        return false;
      });
    }
    return isDep;
  }

  get isRight() {
    const ids = this.flow.deps.get(this.position.id);
    let isDep = ids?.some((id) => {
      const item = this.flow.items.get(id);
      if (item) {
        return item.x > this.position.x;
      }
      return false;
    });

    // check whether the deps is right
    const item = this.flow.items.get(this.position.id);
    if (!isDep && item) {
      isDep = item.deps.some((id) => {
        const item = this.flow.items.get(id);
        if (item) {
          return item.x > this.position.x;
        }
        return false;
      });
    }
    return isDep;
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
        right: 0;
        bottom: 0;
        /* background-image: linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px
          ),
          linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 20px 20px; */
      }

      svg {
        position: absolute; /* New */
        top: 0; /* New */
        left: 0; /* New */
        width: 100%; /* New */
        height: 100%; /* New */
      }
    `,
  ],
})
export class FlowComponent implements AfterContentInit {
  @ContentChildren(FlowChildComponent) children: QueryList<FlowChildComponent> =
    new QueryList();

  @ViewChildren('arrowPaths') arrowPaths: QueryList<ElementRef<SVGPathElement>>;
  @ViewChild('zoomContainer') zoomContainer: ElementRef<HTMLDivElement>;
  @ViewChild('svg') svg: ElementRef<SVGSVGElement>;
  @ViewChild('g') g: ElementRef<SVGGElement>;

  scale = 1;
  panX = 0;
  panY = 0;

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    const scaleAmount = 0.02; // You can adjust this to control the scale amount
    const scaleDirection = event.deltaY < 0 ? 1 : -1;
    const newScale = Math.max(this.scale + scaleDirection * scaleAmount, 0.1); // Prevent scaling to zero or negative

    // Get the bounding box of the host element
    const bbox = this.el.nativeElement.getBoundingClientRect();

    // Translate the window coordinates of the mouse event to the coordinate space of the host element
    const x = event.clientX - bbox.left;
    const y = event.clientY - bbox.top;

    // Update the pan to center the zoom around the mouse position
    this.panX -= (x - this.panX) * (newScale - this.scale);
    this.panY -= (y - this.panY) * (newScale - this.scale);

    // Update the scale
    this.scale = newScale;

    // Apply the zoom and the pan
    this.zoomContainer.nativeElement.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }

  constructor(private el: ElementRef, public flow: FlowService) {
    this.flow.arrowsChange.subscribe(() => this.updateArrows());
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

  updateArrows() {
    // Clear existing arrows
    const childObj = this.children.toArray().reduce((acc, curr) => {
      acc[curr.position.id] = curr;
      return acc;
    }, {} as Record<string, FlowChildComponent>);

    // Calculate new arrows
    this.flow.arrows.forEach((arrow) => {
      const [from, to] = arrow.deps;
      const fromItem = childObj[from];
      const toItem = childObj[to];
      if (fromItem && toItem) {
        arrow.d = this.calculatePath(
          this.getDot(childObj, fromItem.position, toItem.position),
          this.getDot(childObj, toItem.position, fromItem.position)
        );
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

  private getDot(
    childObj: Record<string, FlowChildComponent>,
    item: FlowOptions,
    dep: FlowOptions
  ) {
    // based on the item and dep, we need to know whether the item is top or bottom or left or right
    const isDepLeft = dep.x < item.x;
    const isDepRight = dep.x > item.x;
    // const isDepTop = dep.y < item.y;
    // const isDepBottom = dep.y > item.y;

    const i = [isDepLeft, isDepRight].indexOf(true);

    const child = childObj[item.id];
    const childDotEl = child.dots.get(i);
    let childX = 0;
    let childY = 0;
    if (childDotEl) {
      const childDot = childDotEl.nativeElement.getBoundingClientRect();
      childX = childDot.x + childDot.width / 2;
      childY = childDot.y + childDot.height / 2;
    }
    const r = { ...item, x: childX, y: childY };

    // console.log('childDotEl', childDotEl, i, item.deps, dep.id, r);
    return r;
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
  template: `<app-flow>
    <div [flowChild]="item" *ngFor="let item of list">{{ item.id }}</div>
  </app-flow> `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'angular-flow';

  list: FlowOptions[] = [
    { x: 240, y: 160, id: '1', deps: [] },
    { x: 560, y: 20, id: '2', deps: ['1'] },
    { x: 560, y: 300, id: '3', deps: ['1'] },
    { x: 860, y: 20, id: '4', deps: ['2'] },
    { x: 860, y: 300, id: '5', deps: ['3'] },
  ];
}
