import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ArrowPathFn, FlowDirection, FlowOptions } from './flow-interface';
import { blendCorners } from './svg';
import { FlowConfig } from './plugins/plugin';

@Injectable()
export class FlowService {
  readonly items = new Map<string, FlowOptions>();
  config = new FlowConfig();
  arrowsChange = new Subject<FlowOptions>();
  parents = new Map<string, string[]>();
  isDraggingZoomContainer!: boolean;
  isChildDragging!: boolean;
  enableChildDragging = new BehaviorSubject(true);
  enableZooming = new BehaviorSubject(true);
  horizontalPadding = 100;
  verticalPadding = 20;
  groupPadding = 40;
  scale = 1;
  panX = 0;
  panY = 0;
  gridSize = 1;
  arrows: Arrow[] = [];
  zoomContainer!: HTMLElement;
  layoutUpdated = new Subject<void>();
  onMouse = new Subject<MouseEvent>();

  arrowFn: ArrowPathFn = blendCorners;

  constructor(private ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() => {
      // mouse move event
      document.addEventListener('mousemove', this.onMouseMove);
    });
  }

  private onMouseMove = (event: MouseEvent) => {
    this.onMouse.next(event);
  };

  update(items: FlowOptions[]) {
    this.items.clear();
    this.parents.clear();
    items.forEach((item) => {
      this.items.set(item.id, item);
      // Build parent mapping from children arrays
      item.children.forEach((childId) => {
        let parentList = this.parents.get(childId);
        if (!parentList) {
          parentList = [];
        }
        parentList.push(item.id);
        this.parents.set(childId, parentList);
      });
    });
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
