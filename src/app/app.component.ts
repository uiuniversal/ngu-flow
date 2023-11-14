import { Component, ViewChild } from '@angular/core';
import { NgForOf } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FlowComponent, FlowChildComponent, FlowOptions } from 'flow';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgForOf,
    RouterOutlet,
    ReactiveFormsModule,
    FlowComponent,
    FlowChildComponent,
  ],
  template: `
    <div class="flex items-center gap-3">
      <button (click)="trigger()">Arrange</button>
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
      <button (click)="fitToWindow()">Fit to window</button>

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
    </div>

    <div class="flex items-center justify-center h-[700px]">
      <app-flow class="max-w-[90%] max-h-[90%] border">
        <div
          class="card"
          [flowChild]="item"
          *ngFor="let item of list; let i = index"
        >
          <!-- <span style="pointer-events: none;"> testing </span> -->
          <span style="pointer-events: none;">
            {{ item.id }}
          </span>
          <button (click)="addNode(item)">Add</button>
          <button (click)="deleteNode(item.id)">Delete</button>
          <button (click)="startLinking(i)">Link</button>
        </div>
      </app-flow>
    </div>
  `,
  styles: [
    `
      .card {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 400px;
        height: 395px;
        box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.3);
        border-radius: 5px;
        background-color: white;
      }

      .doting {
        --scale: 2;
        left: 318px;
        top: 263px;
        width: calc(5px + (5px * var(--scale)));
        height: calc(5px + (5px * var(--scale)));
        position: fixed;
        background: blue;
        z-index: 124;
        pointer-events: none;
      }

      button {
        @apply p-1;
      }
    `,
  ],
})
export class AppComponent {
  title = 'angular-flow';
  list: FlowOptions[] = [];
  zooming = true;
  childDragging = true;
  direction = new FormControl<'horizontal' | 'vertical'>('horizontal');
  linkingFrom: number | null = null; // Store the index of the node that we start linking from
  @ViewChild(FlowComponent) flowComponent: FlowComponent;

  constructor() {
    // this.list = [
    //   { x: 240, y: 160, id: '1', deps: [] },
    //   { x: 560, y: 20, id: '2', deps: ['1'] },
    //   { x: 560, y: 300, id: '3', deps: ['1'] },
    //   { x: 860, y: 20, id: '4', deps: ['2'] },
    //   { x: 860, y: 300, id: '5', deps: ['3'] },
    //   { x: 240, y: 460, id: '6', deps: ['1'] },
    // ];
    // this.list = structuredClone(FLOW_LIST);
    this.list = [
      { x: 300, y: -400, id: '1', deps: [] },
      { x: 300, y: -400, id: '2', deps: ['1'] },
      { x: 300, y: -400, id: '3', deps: ['2'] },
      { x: 300, y: -200, id: '4', deps: ['2'] },
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
    // find the highest id
    const lastId = this.list.reduce((acc, cur) => Math.max(+cur.id, acc), 0);
    const newNodeId = (lastId + 1).toString();
    const newNode: FlowOptions = {
      x: 40 + this.list.length * 160,
      y: 40,
      id: newNodeId,
      deps: [item.id],
    };
    this.list.push(newNode);
  }

  deleteNode(id: string) {
    this.list = structuredClone(this.deleteNodeI(id, this.list));
  }

  deleteNodeI(id: string, list: FlowOptions[]) {
    if (id && list.length > 0) {
      const index = list.findIndex((x) => x.id == id);
      const deletedNode = list.splice(index, 1)[0];
      // Remove dependencies of the deleted node
      return list.reduce((acc, item) => {
        const initialLength = item.deps.length;
        item.deps = item.deps.filter((dep) => dep !== deletedNode.id);
        if (item.deps.length === initialLength || item.deps.length > 0)
          acc.push(item);
        return acc;
      }, [] as FlowOptions[]);
    }
    return list;
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

  fitToWindow() {
    this.flowComponent.fitToWindow();
  }

  trigger() {
    // Your trigger logic here
    this.flowComponent.arrangeChildren();
    this.flowComponent.updateArrows();
  }

  childDraggingFn() {
    this.childDragging = !this.childDragging;
    this.flowComponent.updateChildDragging(this.childDragging);
  }

  zoomingFn() {
    this.zooming = !this.zooming;
    this.flowComponent.updateZooming(this.zooming);
  }
}

export const FLOW_LIST = [
  // { x: 0, y: 380, id: '1', deps: [] },
  // { x: 0, y: 380, id: '2', deps: ['1'] },
  // { x: 0, y: 380, id: '3', deps: ['1'] },

  { x: 0, y: 0, id: '1', deps: [] }, // Base node

  // First set of direct children of the base node
  { x: 300, y: -400, id: '2', deps: ['1'] },
  { x: 300, y: -200, id: '3', deps: ['1'] },
  { x: 300, y: 0, id: '4', deps: ['1'] },
  { x: 300, y: 200, id: '5', deps: ['1'] },
  { x: 300, y: 400, id: '6', deps: ['1'] },

  // Children for the second node
  { x: 600, y: -500, id: '7', deps: ['2'] },
  { x: 600, y: -400, id: '8', deps: ['2'] },

  // Children for the third node
  { x: 600, y: -200, id: '9', deps: ['3'] },
  { x: 600, y: -100, id: '10', deps: ['3'] },

  // Children for the fourth node
  { x: 600, y: 0, id: '11', deps: ['4'] },
  { x: 600, y: 100, id: '12', deps: ['4'] },

  // Children for the fifth node
  { x: 600, y: 200, id: '13', deps: ['5'] },
  { x: 600, y: 300, id: '14', deps: ['5'] },

  // Children for the sixth node
  { x: 600, y: 400, id: '15', deps: ['6'] },
  { x: 600, y: 500, id: '16', deps: ['6'] },

  // Further branching for some of the children nodes
  { x: 900, y: -500, id: '17', deps: ['7'] },
  { x: 900, y: -400, id: '18', deps: ['8'] },
  { x: 900, y: -200, id: '19', deps: ['9'] },
  { x: 900, y: -100, id: '20', deps: ['10'] },
  { x: 900, y: 0, id: '21', deps: ['11'] },
  { x: 900, y: 100, id: '22', deps: ['12'] },
  { x: 900, y: 200, id: '23', deps: ['13'] },
  { x: 900, y: 300, id: '24', deps: ['14'] },
  { x: 900, y: 400, id: '25', deps: ['15'] },
  { x: 900, y: 500, id: '26', deps: ['16'] },

  // And so on... you can continue this pattern to get to 40 nodes.

  // { x: 0, y: 380, id: '1', deps: [] },
  // { x: 300, y: 110, id: '2', deps: ['1'] },
  // { x: 600, y: 0, id: '3', deps: ['2'] },
  // { x: 600, y: 220, id: '4', deps: ['2'] },
  // { x: 300, y: 650, id: '5', deps: ['1'] },
  // { x: 600, y: 540, id: '6', deps: ['5'] },
  // { x: 600, y: 760, id: '7', deps: ['5'] },
  // { x: 600, y: 760, id: '8', deps: ['6', '7'] },

  // { x: 40, y: 40, id: '1', deps: [] },
  // { x: 200, y: 40, id: '2', deps: ['1'] },
  // { x: 360, y: 40, id: '3', deps: ['2'] },
  // { x: 520, y: 40, id: '4', deps: ['2'] },
  // { x: 40, y: 200, id: '5', deps: ['1'] },
  // { x: 200, y: 200, id: '6', deps: ['5'] },
  // { x: 360, y: 200, id: '11', deps: ['5'] },
  // { x: 360, y: 200, id: '7', deps: ['5'] },
  // { x: 360, y: 200, id: '8', deps: ['4'] },
  // { x: 360, y: 200, id: '9', deps: ['6'] },
  // { x: 360, y: 200, id: '10', deps: ['11'] },
  // { x: 360, y: 200, id: '9', deps: ['4'] },
  // { x: 520, y: 200, id: '8', deps: ['6', '7'] },

  // { x: 40, y: 40, id: '1', deps: [] },
  // { x: 200, y: 40, id: '2', deps: ['1'] },
  // { x: 360, y: 40, id: '3', deps: ['1'] },
  // { x: 520, y: 40, id: '4', deps: ['2'] },
  // { x: 40, y: 200, id: '5', deps: ['2'] },
  // { x: 40, y: 200, id: '6', deps: ['2'] },

  // { x: 200, y: 200, id: '6', deps: ['5'] },
  // { x: 360, y: 200, id: '7', deps: ['5'] },
  // { x: 520, y: 200, id: '8', deps: ['6', '7'] },
  // { x: 200, y: 360, id: '9', deps: ['6'] },
  // { x: 360, y: 360, id: '10', deps: ['7'] },
  // { x: 520, y: 360, id: '11', deps: ['8'] },
  // { x: 200, y: 520, id: '12', deps: ['9'] },
  // { x: 360, y: 520, id: '13', deps: ['10'] },
  // { x: 520, y: 520, id: '14', deps: ['11'] },
  // { x: 360, y: 680, id: '15', deps: ['12', '13', '14'] },

  // { x: 40, y: 40, id: '1', deps: [] },
  // { x: 200, y: 40, id: '2', deps: ['1'] },
  // { x: 360, y: 40, id: '3', deps: ['2'] },
  // { x: 520, y: 40, id: '4', deps: ['2'] },
  // { x: 40, y: 200, id: '5', deps: ['1'] },
  // { x: 200, y: 200, id: '6', deps: ['5'] },
  // { x: 360, y: 200, id: '7', deps: ['5'] },
  // { x: 360, y: 200, id: '8', deps: ['5'] },
  // { x: 360, y: 200, id: '10', deps: ['5'] },
  // { x: 360, y: 200, id: '9', deps: ['6', '7', '8', '10'] },

  // new deps

  // { x: 600, y: 0, id: '3', deps: ['2'] },
  // { x: 900, y: 70, id: '8', deps: ['4'] },
  // { x: 600, y: 70, id: '4', deps: ['2'] },
  // { x: 300, y: 35, id: '2', deps: ['1'] },
  // { x: 1200, y: 190, id: '17', deps: ['9'] },
  // { x: 1200, y: 260, id: '18', deps: ['9'] },
  // { x: 1200, y: 330, id: '19', deps: ['9'] },
  // { x: 1200, y: 400, id: '20', deps: ['9'] },
  // { x: 900, y: 295, id: '9', deps: ['6'] },
  // { x: 600, y: 295, id: '6', deps: ['5'] },
  // { x: 1200, y: 470, id: '13', deps: ['10'] },
  // { x: 1200, y: 540, id: '14', deps: ['10'] },
  // { x: 1200, y: 610, id: '15', deps: ['10'] },
  // { x: 1200, y: 680, id: '16', deps: ['10'] },
  // { x: 900, y: 575, id: '10', deps: ['11'] },
  // { x: 600, y: 575, id: '11', deps: ['5'] },
  // { x: 900, y: 750, id: '12', deps: ['7'] },
  // { x: 600, y: 750, id: '7', deps: ['5'] },
  // { x: 300, y: 470, id: '5', deps: ['1'] },
  // { x: 0, y: 350, id: '1', deps: [] },

  // multi stage
  // { x: 40, y: 40, id: '1', deps: [] },
  // { x: 40, y: 40, id: '2', deps: ['1'] },
  // // { x: 40, y: 40, id: '3', deps: ['2'] },
  // // { x: 40, y: 40, id: '4', deps: ['3'] },
  // // { x: 40, y: 40, id: '5', deps: ['4'] },
  // { x: 40, y: 40, id: '6', deps: ['1'] },
  // // { x: 40, y: 40, id: '7', deps: ['6'] },
  // // { x: 40, y: 40, id: '8', deps: ['7'] },
  // // { x: 40, y: 40, id: '9', deps: ['8'] },
  // { x: 40, y: 40, id: '10', deps: ['1'] },
  // { x: 40, y: 40, id: '11', deps: ['1'] },
  // // { x: 40, y: 40, id: '12', deps: ['11'] },
  // // { x: 40, y: 40, id: '13', deps: ['12'] },
  // // { x: 40, y: 40, id: '14', deps: ['1'] },
  // // { x: 40, y: 40, id: '15', deps: ['14'] },
  // // { x: 40, y: 40, id: '16', deps: ['15'] },
  // // { x: 40, y: 40, id: '17', deps: ['16'] },
  // { x: 40, y: 40, id: '19', deps: ['2', '6', '10', '11'] },
];
