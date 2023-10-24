import { CommonModule } from '@angular/common';
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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription } from 'rxjs';
import { FlowService } from './flow.service';
import { FlowOptions } from './flow-interface';

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
        --dot-size: 10px;
        --dot-half-size: -5px;
        position: absolute;
        width: var(--dot-size);
        height: var(--dot-size);
        background: red;
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

  @Input('flowChild') position: FlowOptions;

  private positionChange = new Subject<FlowOptions>();
  private mouseMoveSubscription: Subscription;

  constructor(
    public el: ElementRef<HTMLDivElement>,
    private flow: FlowService,
    private ngZone: NgZone
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

    this.flow.layoutUpdated.pipe(takeUntilDestroyed()).subscribe((x) => {
      this.position = this.flow.items.get(this.position.id) as FlowOptions;
      this.positionChange.next(this.position);
    });

    this.positionChange.subscribe((x) => {
      const { left, top } = this.flow.zRect;
      if (!this.position) console.log(this.position);
      this.updatePosition(this.position.x + left, this.position.y + top);
    });
  }

  private onMouseUp = (event: MouseEvent) => {
    event.stopPropagation();
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

  private enableDragging() {
    this.mouseMoveSubscription = this.flow.onMouse.subscribe(this.onMouseMove);
    // mouse up event
    this.el.nativeElement.addEventListener('mouseup', this.onMouseUp);

    // mouse down event
    this.el.nativeElement.addEventListener('mousedown', this.onMouseDown);
  }

  private disableDragging() {
    this.mouseMoveSubscription?.unsubscribe();
    this.el.nativeElement.removeEventListener('mouseup', this.onMouseUp);
    this.el.nativeElement.removeEventListener('mousedown', this.onMouseDown);
  }

  ngOnInit() {
    this.updatePosition(this.position.x, this.position.y);
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(`ngOnChanges ${this.position.id}`, changes);
    // if (changes['position']) {
    //   this.updatePosition(this.position.x, this.position.y);
    // }
  }

  private updatePosition(x: number, y: number) {
    this.el.nativeElement.style.transform = `translate(${x}px, ${y}px)`;
  }

  ngOnDestroy() {
    this.disableDragging();
    // remove the FlowOptions from the flow service
    // this.flow.delete(this.position);
    // console.log('ngOnDestroy', this.position.id);
  }
}
