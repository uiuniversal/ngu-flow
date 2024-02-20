import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import {
  FlowComponent,
  FlowChildComponent,
  FlowOptions,
  FlowConfig,
  ScrollIntoView,
  FitToWindow,
  Arrangements,
} from '@ngu/flow';
import { EditorComponent } from '../editor.component';
import { ToolbarComponent } from './toolbar.component';
import { DemoService } from './demo.service';

@Component({
  selector: 'app-demo-two',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FlowComponent,
    FlowChildComponent,
    EditorComponent,
    ToolbarComponent,
  ],
  template: `
    <div class="flex flex-col items-center justify-center h-[700px]">
      <app-toolbar
        class="block p-3"
        (fitToWindow)="fitToWindow()"
        (autoArrange)="autoArrange()"
      ></app-toolbar>
      <ngu-flow
        class="max-w-[90%] max-h-[90%] border bg-gray-100"
        [config]="config"
      >
        @for (item of list; track item.id; let i = $index) {
        <div
          class="card flex flex-col w-[250px] bg-white rounded-2xl"
          [flowChild]="item"
        >
          <div class="bg-slate-100 border-b">
            <div
              class="pointer-events-none flex items-center justify-center w-7 h-7 mr-6"
            >
              {{ item.id }}
            </div>
          </div>
          <p class="p-4">
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. In alias
            porro ratione quis dolore laboriosam eveniet vel hic beatae eaque
            iste, neque quos, odit, explicabo nulla corporis iusto asperiores
            sequi!
          </p>
          <div class="p-4 flex gap-2">
            <button
              (click)="demoService.addNode(item, list)"
              class="text-green-500"
            >
              Add
            </button>
            <button (click)="deleteNode(item.id)" class="text-red-400">
              Delete
            </button>
          </div>
        </div>
        }
      </ngu-flow>
    </div>
  `,
  styles: [
    `
      .card {
        box-shadow: 0 0 5px 0 rgb(142 142 142 / 37%);
      }
      ngu-flow {
        --flow-dot-color: gray;
        --flow-path-color: gray;
        --dot-size: 1px;
      }

      button {
        @apply p-1;
      }
    `,
  ],
})
export class DemoTwoComponent implements AfterViewInit {
  title = 'angular-flow';
  list: FlowOptions[] = [];
  linkingFrom: number | null = null; // Store the index of the node that we start linking from
  @ViewChild(FlowComponent) flowComponent: FlowComponent;
  demoService = inject(DemoService);
  plugins = {
    scroll: new ScrollIntoView('1'),
    fitWindow: new FitToWindow(false),
    arrange: new Arrangements(),
  };
  config: FlowConfig = {
    Arrows: true,
    ArrowSize: 20,
    Plugins: this.plugins,
  };

  constructor() {
    this.list = [
      { x: 40, y: 40, id: '1', deps: [] },
      { x: 40, y: 40, id: '2', deps: ['1'] },
      { x: 40, y: 40, id: '3', deps: ['2'] },
      { x: 40, y: 40, id: '4', deps: ['1'] },
      { x: 40, y: 40, id: '5', deps: ['3'] },
      { x: 40, y: 40, id: '6', deps: ['2'] },
      { x: 40, y: 40, id: '7', deps: ['4'] },
      { x: 40, y: 40, id: '9', deps: ['7'] },
    ];
    // generate a random list of nodes with random dependencies min 100 nodes
    // this.list = [
    //   { x: 40, y: 40, id: '1', deps: [] },
    //   { x: 40, y: 40, id: '2', deps: ['1'] },
    //   { x: 40, y: 40, id: '3', deps: ['1'] },
    //   { x: 40, y: 40, id: '4', deps: ['2'] },
    //   { x: 40, y: 40, id: '5', deps: ['2'] },
    //   { x: 40, y: 40, id: '6', deps: ['3'] },
    //   { x: 40, y: 40, id: '7', deps: ['3'] },
    //   { x: 40, y: 40, id: '8', deps: ['4'] },
    //   { x: 40, y: 40, id: '9', deps: ['4'] },
    //   { x: 40, y: 40, id: '10', deps: ['8'] },
    //   { x: 40, y: 40, id: '11', deps: ['8'] },
    //   { x: 40, y: 40, id: '12', deps: ['8'] },
    //   { x: 40, y: 40, id: '13', deps: ['9'] },
    //   { x: 40, y: 40, id: '14', deps: ['9'] },
    //   { x: 40, y: 40, id: '15', deps: ['9'] },
    //   { x: 40, y: 40, id: '16', deps: ['9'] },
    //   { x: 40, y: 40, id: '17', deps: ['10'] },
    //   { x: 40, y: 40, id: '18', deps: ['10'] },
    //   { x: 40, y: 40, id: '19', deps: ['10'] },
    //   { x: 40, y: 40, id: '20', deps: ['11'] },
    //   { x: 40, y: 40, id: '21', deps: ['11'] },
    //   { x: 40, y: 40, id: '22', deps: ['11'] },
    //   { x: 40, y: 40, id: '23', deps: ['12'] },
    //   { x: 40, y: 40, id: '24', deps: ['12'] },
    //   { x: 40, y: 40, id: '25', deps: ['12'] },
    //   { x: 40, y: 40, id: '26', deps: ['12'] },
    //   { x: 40, y: 40, id: '27', deps: ['12'] },
    //   { x: 40, y: 40, id: '28', deps: ['12'] },
    //   { x: 40, y: 40, id: '29', deps: ['12'] },
    //   { x: 40, y: 40, id: '30', deps: ['12'] },
    //   { x: 40, y: 40, id: '31', deps: ['12'] },
    //   { x: 40, y: 40, id: '32', deps: ['12'] },
    //   { x: 40, y: 40, id: '33', deps: ['12'] },
    // ];
  }

  ngAfterViewInit(): void {
    this.demoService.flow = this.flowComponent;
  }

  fitToWindow() {
    this.plugins.fitWindow.fitToWindow();
  }

  autoArrange() {
    this.plugins.arrange.arrange();
  }

  deleteNode(id: string) {
    this.list = structuredClone(this.demoService.deleteNodeI(id, this.list));
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
}
