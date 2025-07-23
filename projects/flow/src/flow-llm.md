# `ngu-flow`: A Guide to Creating Flow Diagrams

This guide provides a concise overview of `ngu-flow` for building production-ready flow diagrams in Angular, with a focus on core concepts and practical examples.

## 1. Basic Setup

Start by importing `FlowComponent` and `FlowChildComponent`. The `ngu-flow` component acts as a canvas for your diagram.

```typescript
// app.component.ts
import { Component } from "@angular/core";
import { FlowComponent, FlowChildComponent, FlowNode, FlowEdge } from "@ngu/flow";

@Component({
  standalone: true,
  imports: [FlowComponent, FlowChildComponent],
  template: `
    <ngu-flow [nodes]="nodes" [edges]="edges" class="flow-canvas">
      @for (node of nodes; track node.id) {
        <div [flowChild]="node" class="node-style">
          {{ node.id }}
        </div>
      }
    </ngu-flow>
  `,
  styles: `
    .flow-canvas { min-height: 90vh; background: #f3f3f3; }
    .node-style {
      border: 1px solid #999; width: 120px; height: 60px;
      background: white; display: flex; align-items: center; justify-content: center;
    }
  `,
})
export class AppComponent {
  nodes: FlowNode[] = [
    { id: "Node 1", x: 50, y: 50 },
    { id: "Node 2", x: 250, y: 150 },
  ];

  edges: FlowEdge[] = [
    { id: 'edge-1', source: 'Node 1', target: 'Node 2' }
  ];
}
```

## 2. Core Concepts

*   **`FlowNode`**: The data model for a node, requiring `id`, `x`, and `y` coordinates.
*   **`FlowEdge`**: Defines a connection between nodes via `source` and `target` IDs.
*   **Connection Modes**: Edges can be `flexible` (the default, lines adjust dynamically) or `strict` (lines are fixed to connection points). This can be set globally in the config or on a per-edge basis:
    ```typescript
    const edge: FlowEdge = { id: 'e1', source: 'a', target: 'b', mode: 'strict' };
    ```

## 3. Custom Connection Points (Dots)

For precise connections, you can define custom dots on your nodes.

**1. Define dots in your `FlowNode` data:**

```typescript
const node: FlowNode = {
  id: 'node-1',
  x: 10, y: 10,
  dots: [
    { id: 'node-1-in', type: 'input' },
    { id: 'node-1-out', type: 'output' }
  ]
};
```

**2. Add the dots to your node template using the `flowDot` directive:**

Note: The `id` of the dot element **must match** the `id` in your `dots` array.

```html
<div [flowChild]="node" class="custom-node">
  <div class="node-content">...</div>

  <!-- Custom Input Dot -->
  <div id="node-1-in" class="dot input-dot" [flowDot]="node" [dot]="{ id: 'node-1-in', type: 'input' }"></div>

  <!-- Custom Output Dot -->
  <div id="node-1-out" class="dot output-dot" [flowDot]="node" [dot]="{ id: 'node-1-out', type: 'output' }"></div>
</div>
```

**3. Connect edges using `sourcePort` and `targetPort`:**

These properties must match the `id` of the dots you defined.

```typescript
const edge: FlowEdge = {
  id: 'edge-1',
  source: 'node-1',
  target: 'node-2',
  sourcePort: 'node-1-out',  // Connects from the 'node-1-out' dot
  targetPort: 'node-2-in'    // Connects to the 'node-2-in' dot
};
```

## 4. Plugins

Extend functionality with plugins by adding them to a `FlowConfig` object.

*   **`Arrangements`**: Automatically arranges nodes. You can provide a layout algorithm like `SimpleTreeLayout` (default) or `DagreLayout`.
*   **`SnapGrid`**: Adds a visual grid and enables snap-to-grid functionality.
*   **`FitToWindow`**: Fits the diagram to the viewport, useful for initial rendering.

```typescript
import {
  FlowConfig,
  Arrangements,
  SnapGrid,
  FitToWindow,
  DagreLayout
} from '@ngu/flow';

// 1. Instantiate the plugins you need
const arrangements = new Arrangements();
// arrangements.setLayoutAlgorithm(new DagreLayout()); // Optional: for complex graphs

const snapGrid = new SnapGrid({ size: 20, visible: true });
const fitToWindow = new FitToWindow(true); // true = run on initial load

// 2. Add them to the config object
this.config: FlowConfig = {
  plugins: {
    arrangements,
    snapGrid,
    fitToWindow
  }
};

// 3. Pass the config to the component
// <ngu-flow [config]="config" ...></ngu-flow>
```

This revised guide provides a more direct path to understanding and using `ngu-flow`'s key features.