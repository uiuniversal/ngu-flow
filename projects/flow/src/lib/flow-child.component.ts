import {
  Component,
  OnInit,
  OnDestroy,
  viewChildren,
  ElementRef,
  input,
  output,
  NgZone,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject,
  effect,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { FlowService } from './flow.service';
import { FlowNode } from './flow-interface';
import { FlowDotDirective } from './dot.directive';

@Component({
  imports: [FlowDotDirective],
  selector: '[flowChild]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>
    <div
      #dot
      id="top"
      class="dot dot-top"
      [flowDot]="position()"
      [dot]="{ id: 'top', type: 'output' }"
    ></div>
    <div
      #dot
      id="right"
      class="dot dot-right"
      [flowDot]="position()"
      [dot]="{ id: 'right', type: 'output' }"
    ></div>
    <div
      #dot
      id="bottom"
      class="dot dot-bottom"
      [flowDot]="position()"
      [dot]="{ id: 'bottom', type: 'output' }"
    ></div>
    <div
      #dot
      id="left"
      class="dot dot-left"
      [flowDot]="position()"
      [dot]="{ id: 'left', type: 'output' }"
    ></div>`,
  styles: [
    `
      .dot {
        --dot-half-size: calc(var(--dot-size) / 2 * -1);
        position: absolute;
        width: var(--dot-size);
        height: var(--dot-size);
        background: var(--flow-dot-color);
        border-radius: 999px;
      }
      .dot-left {
        top: calc(50% + var(--dot-half-size));
        left: var(--dot-half-size);
      }
      .dot-right {
        top: calc(50% + var(--dot-half-size));
        right: var(--dot-half-size);
      }
      .dot-top {
        left: 50%;
        top: var(--dot-half-size);
      }
      .dot-bottom {
        left: 50%;
        bottom: var(--dot-half-size);
      }
      .invisible {
        visibility: hidden;
      }
    `,
  ],
})
export class FlowChildComponent implements OnInit, OnChanges, OnDestroy {
  public el = inject(ElementRef<HTMLDivElement>);
  private flowService = inject(FlowService);
  private ngZone = inject(NgZone);
  private isDragging = false;
  private offsetX = 0;
  private offsetY = 0;

  dots = viewChildren<ElementRef<HTMLDivElement>>('dot');

  position = input.required<FlowNode>({ alias: 'flowChild' });

  // Output events
  positionChanged = output<FlowNode>();

  private positionChange = new Subject<FlowNode>();
  private mouseMoveSubscription!: Subscription;
  private layoutSubscribe!: Subscription;

  constructor() {
    this.el.nativeElement.style.position = 'absolute';
    this.el.nativeElement.style.transformOrigin = '0, 0';
    // track mouse move outside angular and react to dragging state changes
    effect(() => {
      const isDraggingEnabled = this.flowService.enableChildDragging();
      this.ngZone.runOutsideAngular(() => {
        if (isDraggingEnabled) {
          this.enableDragging();
        } else {
          this.disableDragging();
        }
      });
    });

    this.layoutSubscribe = this.flowService.layoutUpdated.subscribe((_) => {
      const currentPosition = this.flowService.items.get(
        this.position().id,
      ) as FlowNode;
      if (currentPosition) {
        this.positionChange.next(currentPosition);
      }
    });

    this.positionChange.subscribe((updatedPosition) => {
      this.updatePosition(updatedPosition.x, updatedPosition.y);
    });

    // Use effect to react to position changes
    effect(() => {
      const pos = this.position();
      this.updatePosition(pos.x, pos.y);
    });
  }

  private onMouseUp = (event: MouseEvent) => {
    event.stopPropagation();
    if (this.isDragging) {
      // Emit position change event when drag ends
      this.positionChanged.emit(this.position());
    }
    this.isDragging = false;
    this.flowService.isChildDragging = false;
  };

  private onMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDragging = true;
    this.flowService.isChildDragging = true;
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.offsetX = event.clientX - rect.x;
    this.offsetY = event.clientY - rect.y;
  };

  private onMouseMove = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (this.isDragging) {
      event.stopPropagation();
      const zRect = this.flowService.zRect;
      const cx = event.clientX - zRect.left;
      const cy = event.clientY - zRect.top;
      const x =
        Math.round(
          (cx - this.flowService.panX - this.offsetX) /
            (this.flowService.gridSize * this.flowService.scale),
        ) * this.flowService.gridSize;
      const y =
        Math.round(
          (cy - this.flowService.panY - this.offsetY) /
            (this.flowService.gridSize * this.flowService.scale),
        ) * this.flowService.gridSize;

      const currentPosition = this.position();
      this.position().x = x;
      this.position().y = y;
      const updatedPosition: FlowNode = { ...currentPosition, x, y };
      this.positionChange.next(updatedPosition);
      this.flowService.arrowsChange.next(updatedPosition);
    }
  };

  private enableDragging() {
    this.mouseMoveSubscription = this.flowService.onMouse.subscribe(
      this.onMouseMove,
    );
    this.el.nativeElement.addEventListener('mouseup', this.onMouseUp);
    this.el.nativeElement.addEventListener('mousedown', this.onMouseDown);
  }

  private disableDragging() {
    this.mouseMoveSubscription?.unsubscribe();
    this.el.nativeElement.removeEventListener('mouseup', this.onMouseUp);
    this.el.nativeElement.removeEventListener('mousedown', this.onMouseDown);
  }

  ngOnInit() {
    const pos = this.position();
    this.updatePosition(pos.x, pos.y);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    // No longer needed since we use effects for position changes
  }

  private updatePosition(x: number, y: number) {
    this.el.nativeElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  ngOnDestroy() {
    this.disableDragging();
    this.layoutSubscribe.unsubscribe();
    // remove the FlowOptions from the flow service
    // this.flow.delete(this.position);
    // console.log('ngOnDestroy', this.position.id);
  }
}
