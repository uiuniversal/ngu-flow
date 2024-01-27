import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Connections } from './connections';
import { FlowConfig, FlowOptions } from './flow-interface';

@Injectable()
export class FlowService {
  readonly items = new Map<string, FlowOptions>();
  readonly config = new FlowConfig();
  arrowsChange = new Subject<FlowOptions>();
  deps = new Map<string, string[]>();
  isDraggingZoomContainer: boolean;
  isChildDragging: boolean;
  enableChildDragging = new BehaviorSubject(true);
  enableZooming = new BehaviorSubject(true);
  direction: 'horizontal' | 'vertical' = 'horizontal';
  horizontalPadding = 100;
  verticalPadding = 20;
  groupPadding = 40;
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
    // console.log('update', children);
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

  // delete(option: FlowOptions) {
  //   this.items.delete(option.id);
  //   this.deps.delete(option.id);
  //   this.deps.forEach((v, k) => {
  //     const index = v.indexOf(option.id);
  //     if (index > -1) {
  //       v.splice(index, 1);
  //     }
  //   });
  // }

  get list() {
    return Array.from(this.items.values());
  }

  get zRect() {
    return this.zoomContainer.getBoundingClientRect();
  }
}

interface Arrow {
  d: any;
  deps: string[];
  id: string;
  startDot: number; // Index of the starting dot
  endDot: number; // Index of the ending dot
}
