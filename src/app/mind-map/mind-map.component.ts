import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  signal,
  TemplateRef,
  viewChild,
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
import { FormsModule } from '@angular/forms';
import { DemoService } from '../demo/demo.service';
import { provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideZoomIn, lucideZoomOut } from '@ng-icons/lucide';
import { convertMermaidToNodeMap, NodeMap } from './mermaid';

@Component({
  selector: 'app-demo-one',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    FlowComponent,
    FlowChildComponent,
    // Button,
    // Icon,
    // ContextMenu,
    // Menu,
    // List,
    // Key,
    // Input,
    // Heading,
    // ColorInput,
    // AccessibleGroup,
    // AccessibleItem,
  ],
  viewProviders: [
    provideIcons({ lucideZoomIn, lucideZoomOut, lucideRefreshCw }),
  ],
  template: `
    <!-- <div class="flex h-screen relative">
      <div class="flex flex-col w-1/4 p-b4">
        <h4 meeHeader="sm">Mermaid</h4>
        <textarea
          meeInput
          class="flex w-full mb-b4 min-h-72"
          [(ngModel)]="mermaidString"
        ></textarea>
        <button meeButton (click)="updateListFromMermaid()">Update</button>
      </div>
      <div
        class="flex flex-col flex-1 items-center justify-center h-screen relative"
      >
        <div
          class="flex absolute top-b2 right-b2 bg-foreground z-10 shadow-md rounded-base p-b"
        >
          <button meeButton variant="ghost" class="small">
            <mee-icon name="lucideZoomIn" (click)="flowComponent().zoomIn()" />
          </button>
          <button meeButton variant="ghost" class="small">
            <mee-icon
              name="lucideZoomOut"
              (click)="flowComponent().zoomOut()"
            />
          </button>
          <button meeButton variant="ghost" class="small">
            <mee-icon name="lucideRefreshCw" (click)="fitToWindow()" />
          </button>
        </div>
        <ngu-flow
          class="border bg-dots"
          [config]="config"
          meeAccessibleGroup
          ayId="ngu-flow"
        >
          @for (item of list(); track item.id; let i = $index) {
            <button
              #node
              meeAccessibleItem
              ayId="ngu-flow"
              class="card flex items-center justify-center px-b4 py-b2 bg-foreground dark text-text rounded-lg focus:ring-2 focus:ring-primary"
              [flowChild]="item"
              [meeContextMenu]="optionsMenu"
              (ctxOpen)="selectedItem = node; selectedNode = item"
              (keydown)="handleKeydown($event, item)"
              [style.backgroundColor]="item.color"
            >
              {{ item.title || 'New Node' }}
            </button>
          }
        </ngu-flow>
        <mee-menu #optionsMenu>
          <button meeList class="w-44">
            Add Child <mee-key meeKey="Tab" />
          </button>
          <button meeList class="w-44">
            Add Sibling <mee-key meeKey="Enter" />
          </button>
          <button meeList class="w-44">
            Delete <mee-key meeKey="Delete" />
          </button>
          <button meeList class="w-44">
            Edit Title <mee-key meeKey="Shift+Enter" />
          </button>
          <button meeList class="w-44">Add Details</button>
          <button meeList class="w-44">Collapse</button>
          <button meeList class="w-44">Collapse Others</button>
          <button
            meeList
            class="w-44"
            (click)="openColorPicker(colorPickerTemplate)"
          >
            Change Color
          </button>
          <button meeList class="w-44">Mark as Done</button>
        </mee-menu>
        <ng-template #colorPickerTemplate>
          <mee-color-input
            [value]="selectedNode!.color"
            (valueChange)="colorChange($event)"
            [presetColors]="presetColors"
          />
        </ng-template>
      </div>
    </div> -->
  `,
  styles: [
    `
      .card {
        box-shadow: 0 0 5px 0 rgb(142 142 142 / 37%);
      }

      ngu-flow {
        --flow-dot-color: transparent;
        --flow-path-color: #555555;
        --dot-size: 1px;
      }

      .bg-dots {
        background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E");
      }
    `,
  ],
})
export class MindMapComponent {
  readonly demoService = inject(DemoService);
  readonly flowComponent = viewChild.required(FlowComponent);
  // readonly popover = popoverPortal();
  readonly presetColors = [
    '#000000',
    '#93c5fd',
    '#86efac',
    '#fde68a',
    '#fca5a5',
    '#c4b5fd',
    '#fbcfe8',
    '#5eead4',
    '#fdba74',
    '#a5b4fc',
    '#d6b4a7',
    '#cbd5e1',
  ];
  mermaidString = signal(`flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
  `);
  list = signal(FLOW_LIST);
  linkingFrom: number | null = null; // Store the index of the node that we start linking from
  plugins = {
    scroll: new ScrollIntoView('1'),
    fitWindow: new FitToWindow(false),
    arrange: new Arrangements(),
  };
  config: FlowConfig = {
    arrows: true,
    arrowSize: 2,
    plugins: this.plugins,
    direction: 'vertical',
  };

  selectedNode?: NodeMap;
  selectedItem?: FlowChildComponent;
  injector = inject(Injector);

  constructor() {
    effect(() => {
      this.demoService.flow = this.flowComponent();
      this.fitToWindow();
    });
  }

  handleKeydown(event: KeyboardEvent, item: FlowOptions) {
    // if tab and shift, then create a child node for the item
    if (event.key === 'Tab' && event.shiftKey) {
      this.list.update((list) => [
        ...list,
        new NodeMap({
          x: 0,
          y: 0,
          id: crypto.randomUUID(),
          children: [item.id],
        }),
      ]);
    }
  }

  openColorPicker(template: TemplateRef<any>) {
    const targetElement = this.selectedItem!.el.nativeElement;
    // this.popover.open(template, {
    //   target: targetElement,
    //   position: 'bottom',
    // });
  }

  colorChange(color: string) {
    this.selectedNode!.color = color;
    this.list.update((list) => [...list]);
  }

  fitToWindow() {
    this.plugins.fitWindow.fitToWindow();
  }

  autoArrange() {
    this.plugins.arrange.arrange();
  }

  deleteNode(id: string) {
    this.list = this.demoService.deleteNodeI(id, this.list()) as any;
  }

  startLinking(index: number) {
    if (this.linkingFrom === null) {
      this.linkingFrom = index;
    } else {
      // Complete the linking
      if (this.linkingFrom !== index) {
        this.list.update((list) => {
          const fromNode = list[this.linkingFrom!];
          const toNode = list[index];
          fromNode.children.push(toNode.id);
          return [...list];
        });
      }
      this.linkingFrom = null;
    }
  }

  // Add a method to update the list with the new NodeMap array
  updateListFromMermaid() {
    const newList = convertMermaidToNodeMap(this.mermaidString());
    this.list.set(newList);
    afterNextRender(
      () => {
        this.fitToWindow(); // Adjust the view to fit the new nodes
      },
      { injector: this.injector },
    );
  }
}

export const FLOW_LIST: NodeMap[] = [
  new NodeMap({ x: 0, y: 0, id: '1', children: [] }),
  new NodeMap({ x: 300, y: -400, id: '2', children: ['1'] }),
  new NodeMap({ x: 300, y: -200, id: '3', children: ['1'] }),
  new NodeMap({ x: 300, y: 0, id: '4', children: ['1'] }),
  new NodeMap({ x: 300, y: 200, id: '5', children: ['1'] }),
  new NodeMap({ x: 300, y: 400, id: '6', children: ['1'] }),
  new NodeMap({ x: 600, y: -500, id: '7', children: ['2'] }),
  new NodeMap({ x: 600, y: -400, id: '8', children: ['2'] }),
  new NodeMap({ x: 600, y: -200, id: '9', children: ['3'] }),
  new NodeMap({ x: 600, y: -100, id: '10', children: ['3'] }),
  new NodeMap({ x: 600, y: 0, id: '11', children: ['4'] }),
  new NodeMap({ x: 600, y: 100, id: '12', children: ['4'] }),
  new NodeMap({ x: 600, y: 200, id: '13', children: ['5'] }),
  new NodeMap({ x: 600, y: 300, id: '14', children: ['5'] }),
  new NodeMap({ x: 600, y: 400, id: '15', children: ['6'] }),
  new NodeMap({ x: 600, y: 500, id: '16', children: ['6'] }),
  new NodeMap({ x: 900, y: -500, id: '17', children: ['7'] }),
  new NodeMap({ x: 900, y: -400, id: '18', children: ['8'] }),
  new NodeMap({ x: 900, y: -200, id: '19', children: ['9'] }),
  new NodeMap({ x: 900, y: -100, id: '20', children: ['10'] }),
  new NodeMap({ x: 900, y: 0, id: '21', children: ['11'] }),
  new NodeMap({ x: 900, y: 100, id: '22', children: ['12'] }),
  new NodeMap({ x: 900, y: 200, id: '23', children: ['13'] }),
  new NodeMap({ x: 900, y: 300, id: '24', children: ['14'] }),
  new NodeMap({ x: 900, y: 400, id: '25', children: ['15'] }),
  new NodeMap({ x: 900, y: 500, id: '26', children: ['16'] }),
];
