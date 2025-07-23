# Connection Modes Examples

This document demonstrates the different ways to use connection modes in ngu-flow.

## Priority System

The connection mode is resolved using this priority (highest to lowest):
1. **Edge-level mode** (`edge.mode`)
2. **Config-level mode** (`config.connectionMode`) 
3. **Default** (`'flexible'`)

## Usage Examples

### 1. Global Config-Level Setting

Set all edges to use the same mode by default:

```typescript
import { FlowConfig } from 'ngu-flow';

// All edges will be strict by default
const config: FlowConfig = {
  connectionMode: 'strict',
  // ... other config options
};

// Simple edges without mode property will use config setting
const edges = [
  { id: 'edge1', source: 'node1', target: 'node2' }, // Will be strict
  { id: 'edge2', source: 'node2', target: 'node3' }, // Will be strict
];
```

### 2. Edge-Level Override

Override the global config for specific edges:

```typescript
const config: FlowConfig = {
  connectionMode: 'strict', // Global default
};

const edges = [
  { id: 'edge1', source: 'node1', target: 'node2' }, // Uses config: strict
  { id: 'edge2', source: 'node2', target: 'node3', mode: 'flexible' }, // Override: flexible
  { id: 'edge3', source: 'node3', target: 'node4', mode: 'strict' }, // Override: strict
];
```

### 3. Using Helper Functions

```typescript
import { 
  createFlexibleEdge, 
  createStrictEdge, 
  createConfigAwareEdge,
  FlowConfig 
} from 'ngu-flow';

const config: FlowConfig = {
  connectionMode: 'strict', // Global setting
};

const edges = [
  // These will override the global config:
  createFlexibleEdge('edge1', 'node1', 'node2'), // Always flexible
  createStrictEdge('edge2', 'node2', 'node3'),   // Always strict
  
  // This will follow the global config (strict in this case):
  createConfigAwareEdge('edge3', 'node3', 'node4'), // Uses config: strict
];
```

### 4. Mixed Mode Scenario

Perfect for layouts where some connections should adapt and others should stay fixed:

```typescript
const config: FlowConfig = {
  connectionMode: 'flexible', // Most connections adapt
};

const edges = [
  // Auto-layout connections (flexible by default)
  { id: 'auto1', source: 'node1', target: 'node2' },
  { id: 'auto2', source: 'node2', target: 'node3' },
  
  // Important fixed connections (override to strict)
  { 
    id: 'important', 
    source: 'node1', 
    target: 'node4', 
    mode: 'strict',
    sourcePort: 'output-port',
    targetPort: 'input-port'
  },
];
```

### 5. Dynamic Configuration

Change the mode at runtime:

```typescript
// Update global config
flowComponent.config = {
  ...flowComponent.config,
  connectionMode: 'strict'
};

// Or update specific edges
const updatedEdges = edges.map(edge => ({
  ...edge,
  mode: 'flexible' // Override all to flexible
}));
```

## Mode Behaviors

### Flexible Mode
- ✅ Arrows adapt to optimal connection points when nodes move
- ✅ Dot visibility changes based on current positions
- ✅ Perfect for auto-layout algorithms
- ✅ Great for responsive designs

### Strict Mode  
- ✅ Arrows maintain original connection points
- ✅ Predictable connections regardless of movement
- ✅ Perfect for precise, intentional connections
- ✅ Ideal for custom port connections

## Best Practices

1. **Use config-level** for consistent behavior across your entire flow
2. **Use edge-level overrides** for special cases that need different behavior
3. **Use flexible mode** for auto-generated layouts and dynamic diagrams
4. **Use strict mode** for user-defined connections and fixed layouts
5. **Use helper functions** for clear, readable code