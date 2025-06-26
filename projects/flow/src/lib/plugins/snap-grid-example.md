# Snap Grid Plugin Usage

The Snap Grid plugin provides visual grid lines/dots and snapping functionality for manual node arrangement.

## Basic Usage

```typescript
import { FlowComponent, SnapGrid } from '@app/graph';

// Create snap grid with default settings
const snapGrid = new SnapGrid();

// Or customize the grid
const snapGrid = new SnapGrid({
  size: 20,           // Grid cell size in pixels
  visible: true,      // Show visual grid
  snapEnabled: true,  // Enable snapping
  style: 'dots',      // 'dots' or 'lines'
  color: '#e0e0e0',   // Grid color
  opacity: 0.5        // Grid opacity
});

// Add to flow config
const flowConfig = {
  plugins: {
    snapGrid: snapGrid
  }
};
```

## Dynamic Control

```typescript
// Change grid size
snapGrid.setSize(30);

// Toggle grid visibility
snapGrid.setVisible(false);

// Toggle snapping
snapGrid.setSnapEnabled(false);

// Change grid style
snapGrid.setStyle('lines');
```

## Features

1. **Visual Grid**: Shows dots or lines at grid intersections
2. **Snap to Grid**: Nodes automatically snap to nearest grid point when dragging
3. **Zoom Support**: Grid scales and pans with the canvas
4. **Customizable**: Adjust size, color, opacity, and style

## Grid Styles

- **dots**: Small circles at grid intersections (default)
- **lines**: Grid lines forming squares