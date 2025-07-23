import * as dagre from '@dagrejs/dagre';
import {
  LayoutAlgorithm,
  LayoutNode,
  LayoutOptions,
  LayoutResult,
} from './layout-algorithm';

export class DagreLayout implements LayoutAlgorithm {
  name = 'dagre';

  layout(nodes: LayoutNode[], options: LayoutOptions): LayoutResult {
    const g = new dagre.graphlib.Graph();
    const isHorizontal = options.direction === 'horizontal';
    g.setGraph({
      rankdir: isHorizontal ? 'LR' : 'TB',
      ranksep: isHorizontal
        ? options.horizontalSpacing
        : options.verticalSpacing,
      nodesep: isHorizontal
        ? options.verticalSpacing
        : options.horizontalSpacing,
    });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      g.setNode(node.id, { width: node.width, height: node.height });
      node.children.forEach((childId) => {
        g.setEdge(node.id, childId);
      });
    });

    dagre.layout(g);

    const positions = new Map<string, { x: number; y: number }>();
    g.nodes().forEach((nodeId) => {
      const node = g.node(nodeId);
      if (!node) {
        return;
      }
      positions.set(nodeId, { x: node.x, y: node.y });
    });

    return { positions };
  }
}
