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
} from '@angular/core';
import { startWith } from 'rxjs';
import { Arrangements } from './arrangements';
import { ChildInfo, Connections } from './connections';
import { FlowChildComponent } from './flow-child.component';
import { FlowService } from './flow.service';
import { FlowOptions } from './flow-interface';
import { SvgHandler } from './svg';
import { FitToWindow } from './fit-to-window';

@Component({
  standalone: true,
  imports: [NgForOf, FlowChildComponent],
  providers: [FlowService],
  selector: 'app-flow',
  template: ` <!-- <svg class="flow-pattern">
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
    </svg> -->
    <div class="zoom-container" #zoomContainer>
      <svg #svg>
        <!-- <defs>
          <marker
            id="arrowhead"
            viewBox="-10 -10 20 20"
            refX="0"
            refY="0"
            orient="auto"
          >
            <polygon points="-6.75,-6.75 0,0 -6.75,6.75"></polygon>
          </marker>
        </defs> -->
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon fill="blue" points="0 0, 10 3.5, 0 7"></polygon>
          </marker>
        </defs>
        <g #g></g>
        <!-- <g #guideLines></g> -->

        <!-- <text font-size="20" writing-mode="tb" text-anchor="middle">
          <textPath xlink:href="#arrow2-to-1" startOffset="50%">
            Follow me
          </textPath>
        </text> -->
        <text font-size="20" dy="20" dx="10">
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
        </text>
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
      this.flow.enableZooming.subscribe((enable) => {
        if (enable) {
          this.el.nativeElement.addEventListener('wheel', this.zoomHandle);
        } else {
          this.el.nativeElement.removeEventListener('wheel', this.zoomHandle);
        }
      });
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
  }

  ngAfterViewInit(): void {
    this.createArrows();
    // this.updateZoomContainer();
  }

  ngAfterContentInit() {
    this.children.changes
      .pipe(startWith(this.children))
      .subscribe((children) => {
        // console.log('children changed', children);
        this.flow.update(this.children.map((x) => x.position));
        this.arrangeChildren();
        this.createArrows();
      });
    requestAnimationFrame(() => this.updateArrows()); // this required for angular to render the dot
  }

  updateChildDragging(enable = true) {
    this.flow.enableChildDragging.next(enable);
  }

  updateZooming(enable = true) {
    this.flow.enableZooming.next(enable);
  }

  public _startDraggingZoomContainer = (event: MouseEvent) => {
    event.stopPropagation();
    this.flow.isDraggingZoomContainer = true;
    // const containerRect = this.el.nativeElement.getBoundingClientRect();
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
    }
  };

  public zoomHandle = (event: WheelEvent) => {
    if (this.flow.isDraggingZoomContainer || this.flow.isChildDragging) return;
    event.stopPropagation();
    event.preventDefault();
    const scaleDirection = event.deltaY < 0 ? 1 : -1;
    // if it is zoom out and the scale is less than 0.2, then return
    if (scaleDirection === -1 && this.flow.scale < 0.2) return;

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
    const baseScaleAmount = 0.02; // You can adjust this base scale amount

    // Make scaleAmount proportional to the current scale
    const scaleAmount = baseScaleAmount * scale;
    // const scaleAmount = 0.02;

    // Calculate new scale
    const newScale = scale + scaleDirection * scaleAmount;

    // Calculate new pan values to keep the zoom point in the same position on the screen
    const newPanX = wheelClientX + ((panX - wheelClientX) * newScale) / scale;
    const newPanY = wheelClientY + ((panY - wheelClientY) * newScale) / scale;

    return { scale: newScale, panX: newPanX, panY: newPanY };
  }

  fitToWindow() {
    const ftw = new FitToWindow(
      this.list,
      this.zoomContainer.nativeElement.getBoundingClientRect(),
      this.flow.scale,
      this.flow.panX,
      this.flow.panY
    );
    const { scale, panX, panY } = ftw.fitToWindow();
    this.flow.scale = scale;
    this.flow.panX = panX;
    this.flow.panY = panY;
    this.updateZoomContainer();
  }

  // fitToWindow() {
  //   // The amount of padding to leave around the edges of the container and it should be scale independent
  //   const containerPadding = 30 / this.flow.scale;
  //   // Step 1: Get the positions of all nodes and dimensions of the container
  //   const positions = this.list.map((child) => {
  //     const scaledX = child.elRect.x / this.flow.scale - this.flow.panX;
  //     const scaledY = child.elRect.y / this.flow.scale - this.flow.panY;
  //     const scaledWidth = child.elRect.width;
  //     const scaledHeight = child.elRect.height;
  //     return {
  //       x: scaledX,
  //       y: scaledY,
  //       width: scaledWidth,
  //       height: scaledHeight,
  //     };
  //   });
  //   const containerRect =
  //     this.zoomContainer.nativeElement.getBoundingClientRect();

  //   // Step 2: Calculate the boundaries (min and max coordinates) of the nodes
  //   const minX = Math.min(...positions.map((p) => p.x));
  //   const maxX = Math.max(...positions.map((p) => p.x + p.width));
  //   const minY = Math.min(...positions.map((p) => p.y));
  //   const maxY = Math.max(...positions.map((p) => p.y + p.height));

  //   // Step 3: Determine the scaling factor to fit nodes within the container
  //   const adjMaxX = maxX - minX + containerPadding;
  //   const adjMaxY = maxY - minY + containerPadding;

  //   // find the actual width and height of the container after scale
  //   const cRect = {
  //     x: containerRect.x / this.flow.scale - this.flow.panX,
  //     y: containerRect.y / this.flow.scale - this.flow.panY,
  //     width: containerRect.width / this.flow.scale,
  //     height: containerRect.height / this.flow.scale,
  //   };

  //   const scaleX = cRect.width / adjMaxX;
  //   const scaleY = cRect.height / adjMaxY;
  //   const newScale = Math.min(scaleX, scaleY);

  //   // Step 4: Determine the panning values to center the content within the container
  //   // These are now calculated relative to the unscaled positions
  //   const panX =
  //     cRect.x +
  //     (cRect.width - (adjMaxX - containerPadding) * newScale) / 2 -
  //     minX * newScale;
  //   const panY =
  //     cRect.y +
  //     (cRect.height - (adjMaxY - containerPadding) * newScale) / 2 -
  //     minY * newScale;

  //   // Apply the calculated scale and pan values
  //   this.flow.scale = newScale;
  //   this.flow.panX = panX;
  //   this.flow.panY = panY;

  //   // Update the zoomContainer's transform property to apply the new scale and pan
  //   this.updateZoomContainer();
  // }

  private updateZoomContainer() {
    this.zoomContainer.nativeElement.style.transform = `translate(${this.flow.panX}px, ${this.flow.panY}px) scale(${this.flow.scale})`;
  }

  arrangeChildren() {
    // this.flow.connections = new Connections(this.list);
    const arrangements = new Arrangements(
      this.list,
      this.flow.direction,
      this.flow.horizontalPadding,
      this.flow.verticalPadding,
      this.flow.groupPadding
    );
    const newList = arrangements.autoArrange();
    // console.log('new list', Object.fromEntries(newList));
    this.flow.update([...newList.values()]);
    // this.flow.items.clear();
    // newList.forEach((value, key) => {
    //   this.flow.items.set(key, value);
    // });
    this.flow.layoutUpdated.next();
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
      item.position.deps.forEach((depId) => {
        const dep = this.list.find((dep) => dep.position.id === depId);
        if (dep) {
          const arrow = {
            d: `M${item.position.x},${item.position.y} L${dep.position.x},${dep.position.y}`,
            deps: [item.position.id, dep.position.id],
            startDot: 0,
            endDot: 0,
            id: `arrow${item.position.id}-to-${dep.position.id}`,
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
    const item = this.list.find((item) => item.position.id === position.id);

    // Update item position
    if (!item) return;
    item.position.x = position.x;
    item.position.y = position.y;

    // Update arrows
    this.updateArrows();
  }

  updateArrows(e?: FlowOptions) {
    const containerRect = this.el.nativeElement.getBoundingClientRect();
    const gElement: SVGGElement = this.g.nativeElement;
    // Clear existing arrows
    // const childObj = this.children.toArray().reduce((acc, curr) => {
    //   acc[curr.position.id] = curr;
    //   return acc;
    // }, {} as Record<string, FlowChildComponent>);
    const childObj = this.getChildInfo();

    // Handle reverse dependencies
    // this.closestDots.clear();
    // this.reverseDepsMap.clear();
    this.flow.connections = new Connections(this.list);

    // Calculate new arrows
    this.flow.arrows.forEach((arrow) => {
      const [from, to] = arrow.deps;
      const fromItem = childObj[from];
      const toItem = childObj[to];
      if (fromItem && toItem) {
        const [endDotIndex, startDotIndex] = this.getClosestDots(toItem, from);
        // const toClosestDots = this.getClosestDots(
        //   toItem.position,
        //   from,
        //   childObj
        // );

        // Assuming 0 is a default value, replace it with actual logic
        // const startDotIndex = fromClosestDots[0] || 0;
        // const endDotIndex = toClosestDots[0] || 0;
        // console.log('startDotIndex', startDotIndex, endDotIndex);

        let startDot: FlowOptions = undefined as any;
        let endDot: FlowOptions = undefined as any;
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

        // we need to reverse the path because the arrow head is at the end
        arrow.d = new SvgHandler().blendCorners(endDot, startDot);
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

    this.flow.connections.updateDotVisibility(this.oldChildObj());
  }

  private oldChildObj() {
    return this.children.toArray().reduce((acc, curr) => {
      acc[curr.position.id] = curr;
      return acc;
    }, {} as Record<string, FlowChildComponent>);
  }

  private getChildInfo() {
    return this.list.reduce((acc, curr) => {
      acc[curr.position.id] = curr;
      return acc;
    }, {} as Record<string, ChildInfo>);
  }

  private getDotByIndex(
    childObj: Record<string, ChildInfo>,
    item: FlowOptions,
    dotIndex: number,
    scale: number,
    panX: number,
    panY: number
  ) {
    const child = childObj[item.id];
    const childDots = child.dots as DOMRect[];
    // console.log('childDots', childDots, dotIndex, item.id);

    // Make sure the dot index is within bounds
    if (dotIndex < 0 || dotIndex >= childDots.length) {
      throw new Error(`Invalid dot index: ${dotIndex}`);
    }

    const rect = childDots[dotIndex];
    const { left, top } = this.flow.zRect;
    // const rect = dotEl.nativeElement.getBoundingClientRect();
    const x = (rect.x + rect.width / 2 - panX - left) / scale;
    const y = (rect.y + rect.height / 2 - panY - top) / scale;

    return { ...item, x, y, dotIndex };
  }

  public getClosestDots(item: ChildInfo, dep?: string): number[] {
    return this.flow.connections.getClosestDotsSimplified(
      item,
      dep as string
      // newObj
    );
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('wheel', this.zoomHandle);
  }
}
