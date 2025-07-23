import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  FlowComponent,
  FlowChildComponent,
  FlowConfig,
  FitToWindow,
  ScrollIntoView,
  Arrangements,
  FlowDotDirective,
  FlowNode,
  FlowEdge,
} from '@ngu/flow';
import { EditorComponent } from '../editor.component';
import { ToolbarComponent } from './toolbar.component';
import { DemoService } from './demo.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DagreLayout } from 'projects/flow/src/lib/plugins/layouts/dagre-layout';
import { SnapGrid } from 'projects/flow/src/lib/plugins/snap-grid';

@Component({
  selector: 'app-chain',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FlowComponent,
    FlowChildComponent,
    EditorComponent,
    ToolbarComponent,
    ReactiveFormsModule,
    FlowDotDirective,
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
        @for (item of list(); track item.id) {
          <option [value]="item.id">{{ item.id }}</option>
        }
      </select>
      <ngu-flow
        class="max-w-[90%] max-h-[90%] border bg-gray-100"
        [config]="config"
        [nodes]="list()"
        [edges]="edges()"
      >
        @for (item of list(); track item.id; let i = $index) {
          <div
            class="card w-[250px] bg-white p-4 flex flex-col items-center justify-center gap-2 rounded-2xl relative"
            [flowChild]="item"
          >
            <div
              class="pointer-events-none flex items-center justify-center w-7 h-7 mr-6 bg-gray-200 rounded-full"
            >
              {{ item.id }}
            </div>
            <div class="text-sm font-bold">
              {{ item.data?.name || 'No name' }}
            </div>
            <div class="text-xs text-gray-500">
              {{ item.data?.description || 'No description' }}
            </div>
            @if (item.dots?.length) {
              @for (dot of item.dots; track dot.id) {
                <div class="relative w-full text-center">
                  {{ dot.id }}
                  <div
                    [id]="dot.id"
                    [flowDot]="item"
                    [dot]="dot"
                    class="dot dot-top absolute top-1/2 w-2 h-4 bg-gray-500 rounded-full z-10"
                    [class]="
                      dot.type === 'output' ? '-right-[24px]' : '-left-[24px]'
                    "
                  ></div>
                </div>
              }
            }
            <!-- <button (click)="demoService.addNode(item, list)">Add</button>
            <button (click)="deleteNode(item.id)">Delete</button> -->
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
      }

      ngu-flow {
        --dot-size: 8px;
        --flow-dot-color: #ccc;
        --flow-path-color: #ccc;
      }

      button {
        @apply p-1;
      }
    `,
  ],
})
export class ChainComponent implements AfterViewInit {
  title = 'angular-flow';
  list = signal<FlowNode[]>([]);
  edges = signal<FlowEdge[]>([]);
  linkingFrom: number | null = null; // Store the index of the node that we start linking from
  @ViewChild(FlowComponent) flowComponent: FlowComponent;
  demoService = inject(DemoService);
  plugins = {
    scroll: new ScrollIntoView('1'),
    fitWindow: new FitToWindow(true),
    arrange: new Arrangements({
      layoutAlgorithm: new DagreLayout(),
      verticalPadding: 100,
      horizontalPadding: 100,
    }),
    snapGrid: new SnapGrid(),
  };
  config: FlowConfig = {
    arrows: true,
    arrowSize: 15,
    plugins: this.plugins,
    // childDragging: false,
    // zooming: false,
  };

  selectedNode = new FormControl<string>('11', { nonNullable: true });

  constructor() {
    // this.list = structuredClone(FLOW_LIST);
    const list2: FlowNode[] = [
      { x: 0, y: 0, id: '1', data: 'E' }, // children: ['2', '5', '6', '29', '30'] },
      { x: 1, y: 1, id: '2', data: 'T' }, // children: ['3'] },
      { x: 2, y: 2, id: '3', data: 'F' }, // children: ['4'] },
      { x: 3, y: 3, id: '4', data: 'IDENT : a' }, // children: [] },
      { x: 0, y: 1.5, id: '5', data: '+' }, // children: [] },
      { x: 0, y: 2, id: '6', data: 'T' }, // children: ['7', '18', '19'] },
      { x: 1, y: 3, id: '7', data: 'F' }, // children: ['8', '9', '17'] },
      { x: 2, y: 4, id: '8', data: '(' }, // children: [] },
      { x: 3, y: 4, id: '9', data: 'E' }, // children: ['10', '13', '14'] },
      { x: 4, y: 5, id: '10', data: 'T' }, // children: ['11'] },
      { x: 5, y: 6, id: '11', data: 'F' }, // children: ['12'] },
      { x: 6, y: 7, id: '12', data: 'IDENT : b' }, // children: [] },
      { x: 4, y: 5.5, id: '13', data: '*' }, // children: [] },
      { x: 4, y: 6, id: '14', data: 'T' }, // children: ['15'] },
      { x: 5, y: 7, id: '15', data: 'F' }, // children: ['16'] },
      { x: 6, y: 8, id: '16', data: 'IDENT : c' }, // children: [] },
      { x: 2, y: 4.5, id: '17', data: ')' }, // children: [] },
      { x: 1, y: 3.5, id: '18', data: '*' }, // children: [] },
      { x: 1, y: 4, id: '19', data: 'F' }, // children: ['20', '21', '28'] },
      { x: 2, y: 5, id: '20', data: '(' }, // children: [] },
      { x: 3, y: 5, id: '21', data: 'E' }, // children: ['22', '25', '26'] },
      { x: 4, y: 6, id: '22', data: 'T' }, // children: ['23'] },
      { x: 5, y: 7, id: '23', data: 'F' }, // children: ['24'] },
      { x: 6, y: 8, id: '24', data: 'IDENT : d' }, // children: [] },
      { x: 4, y: 6.5, id: '25', data: '+' }, // children: [] },
      { x: 4, y: 7, id: '26', data: 'F' }, // children: ['27'] },
      { x: 5, y: 8, id: '27', data: 'IDENT : e' }, // children: [] },
      { x: 2, y: 5.5, id: '28', data: ')' }, // children: [] },
      { x: 0, y: 2.5, id: '29', data: '+' }, // children: [] },
      { x: 0, y: 3, id: '30', data: 'T' }, // children: ['31', '33'] },
      { x: 1, y: 4, id: '31', data: 'F' }, // children: ['32'] },
      { x: 2, y: 5, id: '32', data: 'IDENT : q' }, // children: [] },
      { x: 1, y: 4.5, id: '33', data: 'T' }, // children: ['34'] },
      { x: 2, y: 5.5, id: '34', data: 'F' }, // children: ['35', '36', '44'] },
      { x: 3, y: 6.5, id: '35', data: '(' }, // children: [] },
      { x: 4, y: 6.5, id: '36', data: 'E' }, // children: ['37', '40', '41'] },
      { x: 5, y: 7.5, id: '37', data: 'T' }, // children: ['38'] },
      { x: 6, y: 8.5, id: '38', data: 'F' }, // children: ['39'] },
      { x: 7, y: 9.5, id: '39', data: 'IDENT : b' }, // children: [] },
      { x: 5, y: 8, id: '40', data: '*' }, // children: [] },
      { x: 5, y: 8.5, id: '41', data: 'T' }, // children: ['42'] },
      { x: 6, y: 9.5, id: '42', data: 'F' }, // children: ['43'] },
      { x: 7, y: 10.5, id: '43', data: 'IDENT : a' }, // children: [] },
      { x: 3, y: 7, id: '44', data: ')' }, // children: [] },
    ];
    const listEdges2: FlowEdge[] = [
      { id: 'edge-1-2', source: '1', target: '2' },
      { id: 'edge-1-5', source: '1', target: '5' },
      { id: 'edge-1-6', source: '1', target: '6' },
      { id: 'edge-1-29', source: '1', target: '29' },
      { id: 'edge-1-30', source: '1', target: '30' },
      { id: 'edge-2-3', source: '2', target: '3' },
      { id: 'edge-3-4', source: '3', target: '4' },
      { id: 'edge-6-7', source: '6', target: '7' },
      { id: 'edge-6-18', source: '6', target: '18' },
      { id: 'edge-6-19', source: '6', target: '19' },
      { id: 'edge-7-8', source: '7', target: '8' },
      { id: 'edge-7-9', source: '7', target: '9' },
      { id: 'edge-7-17', source: '7', target: '17' },
      { id: 'edge-9-10', source: '9', target: '10' },
      { id: 'edge-9-13', source: '9', target: '13' },
      { id: 'edge-9-14', source: '9', target: '14' },
      { id: 'edge-10-11', source: '10', target: '11' },
      { id: 'edge-11-12', source: '11', target: '12' },
      { id: 'edge-14-15', source: '14', target: '15' },
      { id: 'edge-15-16', source: '15', target: '16' },
      { id: 'edge-19-20', source: '19', target: '20' },
      { id: 'edge-29-21', source: '19', target: '21' },
      { id: 'edge-19-28', source: '19', target: '28' },
      { id: 'edge-21-22', source: '21', target: '22' },
      { id: 'edge-21-25', source: '21', target: '25' },
      { id: 'edge-21-26', source: '21', target: '26' },
      { id: 'edge-22-23', source: '22', target: '23' },
      { id: 'edge-23-24', source: '23', target: '24' },
      { id: 'edge-26-27', source: '26', target: '27' },
      { id: 'edge-30-31', source: '30', target: '31' },
      { id: 'edge-30-33', source: '30', target: '33' },
      { id: 'edge-31-32', source: '31', target: '32' },
      { id: 'edge-33-34', source: '33', target: '34' },
      { id: 'edge-34-35', source: '34', target: '35' },
      { id: 'edge-34-36', source: '34', target: '36' },
      { id: 'edge-34-44', source: '34', target: '44' },
      { id: 'edge-36-37', source: '36', target: '37' },
      { id: 'edge-36-40', source: '36', target: '39' },
      { id: 'edge-36-41', source: '36', target: '41' },
      { id: 'edge-37-38', source: '37', target: '38' },
      { id: 'edge-38-39', source: '38', target: '39' },
      { id: 'edge-41-42', source: '41', target: '42' },
      { id: 'edge-42-43', source: '42', target: '43' },
    ];
    const list: FlowNode[] = [
      {
        id: '1',
        x: 0,
        y: 0,
        dots: [
          { id: 'output-1', type: 'output' },
          { id: 'output-1-1', type: 'output' },
        ],
      },
      {
        id: '2',
        x: 0,
        y: 0,
        dots: [
          { id: 'input-2', type: 'input' },
          { id: 'input-2-1', type: 'input' },
          { id: 'output-2', type: 'output' },
        ],
        data: {
          description:
            'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptatum delectus assumenda, dolor rem voluptates libero ullam accusantium hic neque molestiae.',
        },
      },
      {
        id: '3',
        x: 0,
        y: 0,
        dots: [
          { id: 'input-3', type: 'input' },
          { id: 'output-3', type: 'output' },
        ],
      },
      {
        id: '4',
        x: 0,
        y: 0,
        dots: [
          { id: 'input-4', type: 'input' },
          { id: 'output-4', type: 'output' },
        ],
      },
      {
        id: '5',
        x: 0,
        y: 0,
        dots: [
          { id: 'input-5', type: 'input' },
          { id: 'output-5', type: 'output' },
        ],
      },
    ];
    const edges: FlowEdge[] = [
      {
        id: 'edge-5-4',
        source: '1',
        target: '5',
        sourcePort: 'output-1-1',
        targetPort: 'input-5',
      },
      {
        id: 'edge-1-2',
        source: '1',
        target: '2',
        sourcePort: 'output-1',
        targetPort: 'input-2',
      },
      {
        id: 'edge-1-3',
        source: '1',
        target: '3',
        sourcePort: 'output-1-1',
        targetPort: 'input-3',
      },
      {
        id: 'edge-3-4',
        source: '3',
        target: '4',
        sourcePort: 'output-3',
        targetPort: 'input-4',
      },
    ];
    this.list.set(list);
    this.edges.set(edges);
    // const list1: FlowOptions[] = [
    //   {
    //     id: 'start-node',
    //     x: 50,
    //     y: 150,
    //     children: [],
    //     dots: [{ id: 'start-output', type: 'output' }],
    //     connections: [{ childId: 'process-node', dotId: 'start-output' }],
    //   },
    //   {
    //     id: 'process-node',
    //     x: 300,
    //     y: 150,
    //     children: [],
    //     dots: [
    //       { id: 'process-input', type: 'input' },
    //       { id: 'process-output', type: 'output' },
    //     ],
    //     connections: [{ childId: 'end-node', dotId: 'process-output' }],
    //   },
    //   {
    //     id: 'end-node',
    //     x: 550,
    //     y: 150,
    //     children: [],
    //     dots: [{ id: 'end-input', type: 'input' }],
    //     connections: [],
    //   },
    //   {
    //     id: 'default-node',
    //     x: 300,
    //     y: 300,
    //     children: [],
    //     connections: [],
    //   },
    // ];

    // const list: (FlowOptions & { node: any })[] = [
    //   {
    //     id: '01963b2a-4d7f-7b8c-9e1d-2f3a4b5c6d7e',
    //     x: 0,
    //     y: 134,
    //     children: [
    //       // 'vector_store_files',
    //       // '01963b2a-4d7f-7b8c-9e1d-3f4a5b6c7d8e',
    //     ],
    //     connections: [
    //       { childId: 'vector_store_files', dotId: 'my-custom-dot-1' },
    //       { childId: '01963b2a-4d7f-7b8c-9e1d-3f4a5b6c7d8e' },
    //     ],
    //     node: {
    //       id: '01963b2a-4d7f-7b8c-9e1d-2f3a4b5c6d7e',
    //       type: 'trigger_chat',
    //       name: 'User Message Trigger',
    //       description: 'Processes user message input to start the chain',
    //       enabled: true,
    //     },
    //   },
    //   {
    //     id: 'vector_store_files',
    //     x: 248,
    //     y: 0,
    //     children: ['01963b2a-4d7f-7b8c-9e1d-3f4a5b6c7d8e'],
    //     node: {
    //       id: 'vector_store_files',
    //       type: 'vector',
    //       name: 'Store File Content',
    //       description:
    //         'Parses and stores uploaded file content in vector database for context',
    //       enabled: true,
    //     },
    //   },
    //   {
    //     id: '01963b2a-4d7f-7b8c-9e1d-3f4a5b6c7d8e',
    //     x: 248,
    //     y: 248,
    //     children: ['01963b2a-4d7f-7b8c-9e1d-4f5a6b7c8d9e'],
    //     node: {
    //       id: '01963b2a-4d7f-7b8c-9e1d-3f4a5b6c7d8e',
    //       type: 'memory',
    //       name: 'Load Conversation History',
    //       description:
    //         'Retrieves conversation history and adds it to chain state',
    //       enabled: true,
    //     },
    //   },
    //   {
    //     id: '01963b2a-4d7f-7b8c-9e1d-4f5a6b7c8d9e',
    //     x: 497,
    //     y: 248,
    //     children: ['01963b2a-4d7f-7b8c-9e1d-5f6a7b8c9d0e'],
    //     node: {
    //       id: '01963b2a-4d7f-7b8c-9e1d-4f5a6b7c8d9e',
    //       type: 'llm_call',
    //       name: 'Generate Search Question',
    //       description:
    //         'Generates a standalone search question from conversation context',
    //       enabled: true,
    //     },
    //   },
    //   {
    //     id: '01963b2a-4d7f-7b8c-9e1d-5f6a7b8c9d0e',
    //     x: 745,
    //     y: 258,
    //     children: ['01963b2a-4d7f-7b8c-9e1d-6f7a8b9c0d1e'],
    //     node: {
    //       id: '01963b2a-4d7f-7b8c-9e1d-5f6a7b8c9d0e',
    //       type: 'vector',
    //       name: 'Retrieve Knowledge',
    //       description:
    //         'Retrieves relevant context using configurable vector system',
    //       enabled: true,
    //     },
    //   },
    //   {
    //     id: '01963b2a-4d7f-7b8c-9e1d-6f7a8b9c0d1e',
    //     x: 994,
    //     y: 258,
    //     children: [],
    //     node: {
    //       id: '01963b2a-4d7f-7b8c-9e1d-6f7a8b9c0d1e',
    //       type: 'llm_call',
    //       name: 'Generate Final Response',
    //       description:
    //         'Generates the final response using retrieved context, conversation history, and tools',
    //       enabled: true,
    //     },
    //   },
    // ];

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
    const { nodes, edges } = this.demoService.deleteNode(
      id,
      this.list(),
      this.edges(),
    );
    this.list.set(nodes);
    this.edges.set(edges);
  }

  startLinking(index: number) {
    if (this.linkingFrom === null) {
      this.linkingFrom = index;
    } else {
      // Complete the linking
      if (this.linkingFrom !== index) {
        const fromNode = this.list()[this.linkingFrom];
        const toNode = this.list()[index];
        // fromNode.children.push(toNode.id);
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
