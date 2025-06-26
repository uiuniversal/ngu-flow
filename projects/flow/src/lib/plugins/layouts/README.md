# Layout Algorithms

This directory contains modular layout algorithms for the flow graph component.

## Available Algorithms

### SugiyamaLayout
A standard DAG (Directed Acyclic Graph) layout algorithm that:
- Assigns nodes to layers using topological sorting
- Minimizes edge crossings between layers
- Centers parents over their children
- Produces clean, hierarchical layouts

### SimpleTreeLayout
A basic tree layout algorithm that:
- Positions nodes recursively
- Centers parents over children
- Suitable for simple tree structures

## Usage

```typescript
import { Arrangements, SugiyamaLayout, SimpleTreeLayout } from '@app/graph';

// Create arrangements plugin with default Sugiyama layout
const arrangements = new Arrangements();

// Switch to simple tree layout
arrangements.setLayoutAlgorithm(new SimpleTreeLayout());

// Switch back to Sugiyama layout
arrangements.setLayoutAlgorithm(new SugiyamaLayout());
```

## Creating Custom Layout Algorithms

Implement the `LayoutAlgorithm` interface:

```typescript
import { LayoutAlgorithm, LayoutNode, LayoutOptions, LayoutResult } from './layout-algorithm';

export class MyCustomLayout implements LayoutAlgorithm {
  name = 'my-custom-layout';

  layout(nodes: LayoutNode[], options: LayoutOptions): LayoutResult {
    const positions = new Map<string, { x: number; y: number }>();
    
    // Your layout logic here
    
    return { positions };
  }
}
```

Then use it:

```typescript
arrangements.setLayoutAlgorithm(new MyCustomLayout());
```