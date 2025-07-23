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
  FlowNode,
  FlowEdge,
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
  selector: 'app-demo-one-simple',
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
        @for (item of nodes; track item.id) {
          <option [value]="item.id">{{ item.id }}</option>
        }
      </select>
      <ngu-flow
        class="max-w-[90%] max-h-[90%] border bg-gray-100"
        [config]="config"
        [nodes]="nodes"
        [edges]="edges"
      >
        @for (item of nodes; track item.id; let i = $index) {
          <div
            class="card flex items-center justify-center w-[250px] h-[60px] bg-white"
            [flowChild]="item"
          >
            <div
              class="pointer-events-none flex items-center justify-center w-7 h-7 mr-6 bg-gray-200 rounded-full"
            >
              {{ item.id }}
            </div>
            <button (click)="addNode(item)">Add</button>
            <button (click)="deleteNode(item.id)">Delete</button>
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
export class DemoOneSimpleComponent implements AfterViewInit {
  title = 'angular-flow';
  nodes: FlowNode[] = [
    { x: 0, y: 0, id: '1', data: 'Root Node' },
    { x: 300, y: -200, id: '2', data: 'Node 2' },
    { x: 300, y: 0, id: '3', data: 'Node 3' },
    { x: 300, y: 200, id: '4', data: 'Node 4' },
    { x: 600, y: -200, id: '5', data: 'Node 5' },
    { x: 600, y: 0, id: '6', data: 'Node 6' },
    { x: 600, y: 200, id: '7', data: 'Node 7' },
  ];

  edges: FlowEdge[] = [
    { id: 'edge-1-2', source: '1', target: '2' },
    { id: 'edge-1-3', source: '1', target: '3' },
    { id: 'edge-1-4', source: '1', target: '4' },
    { id: 'edge-2-5', source: '2', target: '5' },
    { id: 'edge-3-6', source: '3', target: '6' },
    { id: 'edge-4-7', source: '4', target: '7' },
  ];

  @ViewChild(FlowComponent) flowComponent: FlowComponent;
  demoService = inject(DemoService);
  plugins = {
    scroll: new ScrollIntoView('1'),
    fitWindow: new FitToWindow(true),
    arrange: new Arrangements({
      verticalPadding: 20,
      horizontalPadding: 100,
    }),
  };
  config: FlowConfig = {
    arrows: true,
    arrowSize: 20,
    plugins: this.plugins,
  };

  selectedNode = new FormControl<string>('1', { nonNullable: true });

  constructor() {
    // this.selectedNode.valueChanges.subscribe((id) => {
    //   this.plugins.scroll.focus(id);
    // });
  }

  ngAfterViewInit(): void {
    this.demoService.flow = this.flowComponent;
  }

  fitToWindow() {
    // this.plugins.fitWindow.fitToWindow();
  }

  autoArrange() {
    // this.plugins.arrange.arrange();
  }

  addNode(targetNode: FlowNode) {
    this.demoService.addNode(targetNode, this.nodes, this.edges);
  }

  deleteNode(id: string) {
    const result = this.demoService.deleteNode(id, this.nodes, this.edges);
    this.nodes = result.nodes;
    this.edges = result.edges;
  }
}
