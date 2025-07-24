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
  FlowConfig,
  FitToWindow,
  Arrangements,
} from '@ngu/flow';
import { DemoService } from './demo.service';
import { SnapGrid } from 'projects/flow/src/lib/plugins/snap-grid';

@Component({
  selector: 'app-demo-simple',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlowComponent, FlowChildComponent],
  template: `
    <div class="flex flex-col items-center justify-center h-[90vh]">
      <div class="p-3">
        <button (click)="fitToWindow()">Fit to Window</button>
        <button (click)="autoArrange()">Auto Arrange</button>
      </div>
      <ngu-flow
        class="max-w-[90%] max-h-[90%] border bg-gray-100"
        [config]="config"
        [nodes]="result.nodes"
        [edges]="result.edges"
      >
        @for (item of result.nodes; track item.id) {
          <div
            class="card flex items-center justify-center w-[150px] h-[50px] bg-white"
            [flowChild]="item"
          >
            <span>{{ item.data }}</span>
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
        padding: 8px 16px;
        margin: 4px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `,
  ],
})
export class DemoSimpleComponent implements AfterViewInit {
  result1 = {
    nodes: [
      { x: 0, y: 0, id: '5', data: 'Start' },
      { x: 0, y: 0, id: '2', data: 'Process' },
      { x: 0, y: 0, id: '3', data: 'End' },
      { x: 0, y: 0, id: '4', data: 'Branch' },
    ],

    edges: [
      { id: 'edge-1-2', source: '5', target: '2' },
      { id: 'edge-2-3', source: '2', target: '3' },
      { id: 'edge-2-4', source: '2', target: '4' },
    ],
  };
  result = {
    nodes: [
      {
        id: '1',
        x: 0,
        y: 0,
        data: 'User Message Trigger',
      },
      {
        id: '2',
        x: 0,
        y: 0,
        data: 'Store File Content',
      },
      {
        id: '3',
        x: 0,
        y: 0,
        data: 'Load Conversation History',
      },
      {
        id: '4',
        x: 0,
        y: 0,
        data: 'Generate Search Question',
      },
      {
        id: '5',
        x: 0,
        y: 0,
        data: '123',
      },
      {
        id: '6',
        x: 0,
        y: 0,
        data: 'Retrieve Knowledge',
      },
      {
        id: '7',
        x: 0,
        y: 0,
        data: 'Web Search',
      },
    ],
    edges: [
      {
        id: '1-2',
        source: '1',
        target: '2',
      },
      {
        id: '1-3',
        source: '1',
        target: '3',
      },
      {
        id: '2-3',
        source: '2',
        target: '3',
      },
      {
        id: '3-4',
        source: '3',
        target: '4',
      },
      {
        id: '6-5',
        source: '6',
        target: '5',
      },
      {
        id: '4-6',
        source: '4',
        target: '6',
      },
      {
        id: '7-5',
        source: '7',
        target: '5',
      },
    ],
  };

  @ViewChild(FlowComponent) flowComponent!: FlowComponent;
  demoService = inject(DemoService);

  plugins = {
    snapGrid: new SnapGrid(),
    fitWindow: new FitToWindow(true),
    arrange: new Arrangements(),
  };

  config: FlowConfig = {
    arrows: true,
    arrowSize: 20,
    plugins: this.plugins,
    connectionMode: 'strict',
  };

  ngAfterViewInit(): void {
    this.demoService.flow = this.flowComponent;
  }

  fitToWindow() {
    // this.plugins.fitWindow.fitToWindow();
  }

  autoArrange() {
    this.plugins.arrange.arrange();
  }
}
