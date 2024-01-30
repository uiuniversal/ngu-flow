import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DemoService } from './demo.service';
import {
  FlowDirection,
  flowPath,
  bezierPath,
  blendCorners,
  blendCorners1,
} from '@ngu/flow';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<div class="flex items-center gap-3">
    <button (click)="trigger()">Auto Arrange</button>
    <label for="zoomingId">
      <input
        id="zoomingId"
        type="checkbox"
        [checked]="zooming"
        (click)="zoomingFn()"
      />zooming
    </label>
    <label for="childDraggingId">
      <input
        id="childDraggingId"
        type="checkbox"
        [checked]="childDragging"
        (click)="childDraggingFn()"
      />Child Dragging
    </label>
    <label for="animatePath">
      <input
        id="animatePath"
        type="checkbox"
        [checked]="animatePath"
        (click)="animatePathFn()"
      />Animate
    </label>
    <button (click)="fitToWindow()">Fit to window</button>

    <!-- Arrow Types -->
    <label for="arrowType">
      <select id="arrowType" [formControl]="arrowType">
        @for (fn of arrowFns; track fn; let i = $index) {
        <option [value]="i">Arrow {{ i }}</option>
        }
      </select>
    </label>

    <!-- radio group for horizontal or vertical -->
    <label for="direction">
      <input
        id="direction"
        type="radio"
        [value]="'horizontal'"
        [formControl]="direction"
      />Horizontal
    </label>
    <label for="direction1">
      <input
        id="direction1"
        type="radio"
        [value]="'vertical'"
        [formControl]="direction"
      />Vertical
    </label>
  </div>`,
})
export class ToolbarComponent implements OnInit {
  zooming = true;
  childDragging = true;
  animatePath = false;
  direction = new FormControl<FlowDirection>('horizontal');
  demoService = inject(DemoService);

  arrowType = new FormControl<number>(0);

  arrowFns = [blendCorners, blendCorners1, flowPath, bezierPath];

  constructor() {
    this.direction.valueChanges.subscribe((val) => {
      this.demoService.flow.updateDirection(this.direction.value!);
    });
    this.arrowType.valueChanges.subscribe((val) => {
      this.demoService.flow.updateArrowFn(this.arrowFns[val!]);
    });
  }

  ngOnInit() {}

  fitToWindow() {
    this.demoService.flow.fitToWindow();
  }

  trigger() {
    // Your trigger logic here
    this.demoService.flow.arrangeChildren();
    this.demoService.flow.updateArrows();
  }

  childDraggingFn() {
    this.childDragging = !this.childDragging;
    this.demoService.flow.updateChildDragging(this.childDragging);
  }

  zoomingFn() {
    this.zooming = !this.zooming;
    this.demoService.flow.updateZooming(this.zooming);
  }

  animatePathFn() {
    this.animatePath = !this.animatePath;
    this.demoService.flow.el.nativeElement.classList.toggle('animate-path');
  }
}
