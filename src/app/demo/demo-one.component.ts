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
  FitToWindow,
  ScrollIntoView,
  Arrangements,
} from '@ngu/flow';
import { EditorComponent } from '../editor.component';
import { ToolbarComponent } from './toolbar.component';
import { DemoService } from './demo.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-demo-one',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FlowComponent,
    FlowChildComponent,
    EditorComponent,
    ToolbarComponent,
    ReactiveFormsModule,
  ],
  template: `
    <div class="flex flex-col items-center justify-center h-[90vh]">
      <app-toolbar
        class="block p-3"
        (fitToWindow)="fitToWindow()"
        (autoArrange)="autoArrange()"
      ></app-toolbar>
      <select [formControl]="selectedNode">
        <label>Select node</label>
        @for (item of list; track item.id) {
          <option [value]="item.id">{{ item.id }}</option>
        }
      </select>
      <ngu-flow
        class="max-w-[90%] max-h-[90%] border bg-gray-100"
        [config]="config"
      >
        @for (item of list; track item.id; let i = $index) {
          <div
            class="card flex items-center justify-center w-[250px] h-[60px] bg-white"
            [flowChild]="item"
          >
            <!-- <app-editor></app-editor> -->

            <div
              class="pointer-events-none flex items-center justify-center w-7 h-7 mr-6 bg-gray-200 rounded-full"
            >
              {{ item.id }}
            </div>
            <button (click)="demoService.addNode(item, list)">Add</button>
            <button (click)="deleteNode(item.id)">Delete</button>
            <!-- <button (click)="startLinking(i)">Link</button> -->
          </div>
        }
      </ngu-flow>
    </div>
  `,
  styles: [
    `
      .card {
        box-shadow: 0 0 5px 0 rgb(142 142 142 / 37%);
        border-radius: 5px;
      }

      button {
        @apply p-1;
      }
    `,
  ],
})
export class DemoOneComponent implements AfterViewInit {
  title = 'angular-flow';
  list: FlowOptions[] = [];
  linkingFrom: number | null = null; // Store the index of the node that we start linking from
  @ViewChild(FlowComponent) flowComponent: FlowComponent;
  demoService = inject(DemoService);
  plugins = {
    scroll: new ScrollIntoView('1'),
    fitWindow: new FitToWindow(true),
    arrange: new Arrangements(),
  };
  config: FlowConfig = {
    arrows: true,
    arrowSize: 20,
    plugins: this.plugins,
  };

  selectedNode = new FormControl<string>('11', { nonNullable: true });

  constructor() {
    // this.list = structuredClone(FLOW_LIST);
    this.list = [
      { x: 0, y: 0, id: '1', data: 'E', children: ['2', '5', '6', '29', '30'] },
      { x: 1, y: 1, id: '2', data: 'T', children: ['3'] },
      { x: 2, y: 2, id: '3', data: 'F', children: ['4'] },
      { x: 3, y: 3, id: '4', data: 'IDENT : a', children: [] },
      { x: 0, y: 1.5, id: '5', data: '+', children: [] },
      { x: 0, y: 2, id: '6', data: 'T', children: ['7', '18', '19'] },
      { x: 1, y: 3, id: '7', data: 'F', children: ['8', '9', '17'] },
      { x: 2, y: 4, id: '8', data: '(', children: [] },
      { x: 3, y: 4, id: '9', data: 'E', children: ['10', '13', '14'] },
      { x: 4, y: 5, id: '10', data: 'T', children: ['11'] },
      { x: 5, y: 6, id: '11', data: 'F', children: ['12'] },
      { x: 6, y: 7, id: '12', data: 'IDENT : b', children: [] },
      { x: 4, y: 5.5, id: '13', data: '*', children: [] },
      { x: 4, y: 6, id: '14', data: 'T', children: ['15'] },
      { x: 5, y: 7, id: '15', data: 'F', children: ['16'] },
      { x: 6, y: 8, id: '16', data: 'IDENT : c', children: [] },
      { x: 2, y: 4.5, id: '17', data: ')', children: [] },
      { x: 1, y: 3.5, id: '18', data: '*', children: [] },
      { x: 1, y: 4, id: '19', data: 'F', children: ['20', '21', '28'] },
      { x: 2, y: 5, id: '20', data: '(', children: [] },
      { x: 3, y: 5, id: '21', data: 'E', children: ['22', '25', '26'] },
      { x: 4, y: 6, id: '22', data: 'T', children: ['23'] },
      { x: 5, y: 7, id: '23', data: 'F', children: ['24'] },
      { x: 6, y: 8, id: '24', data: 'IDENT : d', children: [] },
      { x: 4, y: 6.5, id: '25', data: '+', children: [] },
      { x: 4, y: 7, id: '26', data: 'F', children: ['27'] },
      { x: 5, y: 8, id: '27', data: 'IDENT : e', children: [] },
      { x: 2, y: 5.5, id: '28', data: ')', children: [] },
      { x: 0, y: 2.5, id: '29', data: '+', children: [] },
      { x: 0, y: 3, id: '30', data: 'T', children: ['31', '33'] },
      { x: 1, y: 4, id: '31', data: 'F', children: ['32'] },
      { x: 2, y: 5, id: '32', data: 'IDENT : q', children: [] },
      { x: 1, y: 4.5, id: '33', data: 'T', children: ['34'] },
      { x: 2, y: 5.5, id: '34', data: 'F', children: ['35', '36', '44'] },
      { x: 3, y: 6.5, id: '35', data: '(', children: [] },
      { x: 4, y: 6.5, id: '36', data: 'E', children: ['37', '40', '41'] },
      { x: 5, y: 7.5, id: '37', data: 'T', children: ['38'] },
      { x: 6, y: 8.5, id: '38', data: 'F', children: ['39'] },
      { x: 7, y: 9.5, id: '39', data: 'IDENT : b', children: [] },
      { x: 5, y: 8, id: '40', data: '*', children: [] },
      { x: 5, y: 8.5, id: '41', data: 'T', children: ['42'] },
      { x: 6, y: 9.5, id: '42', data: 'F', children: ['43'] },
      { x: 7, y: 10.5, id: '43', data: 'IDENT : a', children: [] },
      { x: 3, y: 7, id: '44', data: ')', children: [] },
    ];
    this.selectedNode.valueChanges.subscribe((id) => {
      this.plugins.scroll.focus(id);
    });
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
        fromNode.children.push(toNode.id);
      }
      this.linkingFrom = null;
    }
  }
}

export const FLOW_LIST = [
  // { x: 0, y: 380, id: '1', deps: [] },
  // { x: 0, y: 380, id: '2', deps: ['1'] },
  // { x: 0, y: 380, id: '3', deps: ['1'] },

  { x: 0, y: 0, id: '1', children: ['2', '3', '4', '5', '6'] }, // Base node

  // First set of direct children of the base node
  { x: 300, y: -400, id: '2', children: ['7', '8'] },
  { x: 300, y: -200, id: '3', children: ['9', '10'] },
  { x: 300, y: 0, id: '4', children: ['11', '12'] },
  { x: 300, y: 200, id: '5', children: ['13', '14'] },
  { x: 300, y: 400, id: '6', children: ['15', '16'] },

  // Children for the second node
  { x: 600, y: -500, id: '7', children: ['17'] },
  { x: 600, y: -400, id: '8', children: ['18'] },

  // Children for the third node
  { x: 600, y: -200, id: '9', children: ['19'] },
  { x: 600, y: -100, id: '10', children: ['20'] },

  // Children for the fourth node
  { x: 600, y: 0, id: '11', children: ['21'] },
  { x: 600, y: 100, id: '12', children: ['22'] },

  // Children for the fifth node
  { x: 600, y: 200, id: '13', children: ['23'] },
  { x: 600, y: 300, id: '14', children: ['24'] },

  // Children for the sixth node
  { x: 600, y: 400, id: '15', children: ['25'] },
  { x: 600, y: 500, id: '16', children: ['26'] },

  // Further branching for some of the children nodes
  { x: 900, y: -500, id: '17', children: [] },
  { x: 900, y: -400, id: '18', children: [] },
  { x: 900, y: -200, id: '19', children: [] },
  { x: 900, y: -100, id: '20', children: [] },
  { x: 900, y: 0, id: '21', children: [] },
  { x: 900, y: 100, id: '22', children: [] },
  { x: 900, y: 200, id: '23', children: [] },
  { x: 900, y: 300, id: '24', children: [] },
  { x: 900, y: 400, id: '25', children: [] },
  { x: 900, y: 500, id: '26', children: [] },

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
