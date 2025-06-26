import { LayoutAlgorithm, LayoutNode, LayoutOptions, LayoutResult } from './layout-algorithm';

/**
 * Simple debug layout for testing - arranges nodes in a grid
 */
export class DebugLayout implements LayoutAlgorithm {
  name = 'debug';
  private gridSize = 1;

  layout(nodes: LayoutNode[], options: LayoutOptions): LayoutResult {
    const positions = new Map<string, { x: number; y: number }>();
    const isHorizontal = options.direction === 'horizontal';
    this.gridSize = options.gridSize || 1;
    
    // Build parent map
    const parentMap = new Map<string, string[]>();
    nodes.forEach(node => {
      node.children.forEach(childId => {
        if (!parentMap.has(childId)) {
          parentMap.set(childId, []);
        }
        parentMap.get(childId)!.push(node.id);
      });
    });
    
    // Find roots (nodes with no parents)
    const roots = nodes.filter(node => !parentMap.has(node.id));
    
    // Simple BFS to assign layers
    const layers = new Map<string, number>();
    const queue: {id: string, layer: number}[] = roots.map(r => ({id: r.id, layer: 0}));
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const {id, layer} = queue.shift()!;
      if (visited.has(id)) continue;
      
      visited.add(id);
      layers.set(id, layer);
      
      const node = nodes.find(n => n.id === id);
      if (node) {
        node.children.forEach(childId => {
          if (!visited.has(childId)) {
            queue.push({id: childId, layer: layer + 1});
          }
        });
      }
    }
    
    // Group nodes by layer
    const layerGroups = new Map<number, string[]>();
    layers.forEach((layer, nodeId) => {
      if (!layerGroups.has(layer)) {
        layerGroups.set(layer, []);
      }
      layerGroups.get(layer)!.push(nodeId);
    });
    
    // Assign positions
    layerGroups.forEach((nodeIds, layer) => {
      nodeIds.forEach((nodeId, index) => {
        const node = nodes.find(n => n.id === nodeId);
        const width = node?.width || 150;
        const height = node?.height || 50;
        
        let x, y;
        if (isHorizontal) {
          x = layer * options.horizontalSpacing;
          y = index * (height + options.verticalSpacing);
        } else {
          x = index * (width + options.horizontalSpacing);
          y = layer * options.verticalSpacing;
        }
        
        // Snap to grid
        x = Math.round(x / this.gridSize) * this.gridSize;
        y = Math.round(y / this.gridSize) * this.gridSize;
        
        positions.set(nodeId, { x, y });
      });
    });
    
    return { positions };
  }
}