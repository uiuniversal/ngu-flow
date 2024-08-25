import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  Inject,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { FlowService } from './flow.service';
import { FlowOptions } from './flow-interface';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: '[flowChild]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>
    <div #dot class="dot dot-top"></div>
    <div #dot class="dot dot-right"></div>
    <div #dot class="dot dot-bottom"></div>
    <div #dot class="dot dot-left"></div>`,
  styles: [
    `
      :host:hover .dot {
        visibility: visible !important;
      }
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
  private isDragging = false;
  private offsetX = 0;
  private offsetY = 0;

  @ViewChildren('dot') dots: QueryList<ElementRef<HTMLDivElement>>;

  @Input() flowChild: FlowOptions;

  private positionChange = new Subject<FlowOptions>();
  private mouseMoveSubscription: Subscription;
  private layoutSubscribe: Subscription;

  constructor(
    public el: ElementRef<HTMLDivElement>,
    private flow: FlowService,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.el.nativeElement.style.position = 'absolute';
    this.el.nativeElement.style.transformOrigin = '0, 0';
    // track mouse move outside angular
    this.ngZone.runOutsideAngular(() => {
      this.flow.enableChildDragging.subscribe((x) => {
        if (x) {
          this.enableDragging();
        } else {
          this.disableDragging();
        }
      });
    });

    this.layoutSubscribe = this.flow.layoutUpdated.subscribe((x) => {
      this.flowChild = this.flow.items.get(this.flowChild.id) as FlowOptions;
      this.positionChange.next(this.flowChild);
    });

    this.positionChange.subscribe((x) => {
      this.updatePosition(this.flowChild.x, this.flowChild.y);
    });
  }

  private onMouseUp = (event: MouseEvent) => {
    event.stopPropagation();
    this.document.removeEventListener('mousemove', this.onMouseMove);
    this.el.nativeElement.removeEventListener('mouseup', this.onMouseUp);
    this.toggleUserSelect(false);
    console.log('onMouseUp');
    this.isDragging = false;
    this.flow.isChildDragging = false;
  };

  private onMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDragging = true;
    this.flow.isChildDragging = true;
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.offsetX = event.clientX - rect.x;
    this.offsetY = event.clientY - rect.y;
    this.document.addEventListener('mousemove', this.onMouseMove);
    this.document.addEventListener('mouseup', this.onMouseUp);
    this.toggleUserSelect(true);
  };

  private onMouseMove = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (this.isDragging) {
      event.stopPropagation();
      const zRect = this.flow.zRect;
      const cx = event.clientX - zRect.left;
      const cy = event.clientY - zRect.top;
      const x =
        Math.round(
          (cx - this.flow.panX - this.offsetX) /
            (this.flow.gridSize * this.flow.scale),
        ) * this.flow.gridSize;
      const y =
        Math.round(
          (cy - this.flow.panY - this.offsetY) /
            (this.flow.gridSize * this.flow.scale),
        ) * this.flow.gridSize;

      this.flowChild.x = x;
      this.flowChild.y = y;
      this.positionChange.next(this.flowChild);
      this.flow.arrowsChange.next(this.flowChild);
    }
  };

  private toggleUserSelect(active = true) {
    const value = active ? 'none' : '';
    this.document.body.style.userSelect = value;
    this.document.body.style.webkitUserSelect = value;
  }

  private enableDragging() {
    this.el.nativeElement.addEventListener('mousedown', this.onMouseDown);
  }

  private disableDragging() {
    // this.mouseMoveSubscription?.unsubscribe();
    // this.el.nativeElement.removeEventListener('mouseup', this.onMouseUp);
    this.el.nativeElement.removeEventListener('mousedown', this.onMouseDown);
  }

  ngOnInit() {
    this.updatePosition(this.flowChild.x, this.flowChild.y);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log(`ngOnChanges ${this.position.id}`, changes);
    // if (changes['position']) {
    //   this.updatePosition(this.position.x, this.position.y);
    // }
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
