import {
  LayoutAlgorithm,
  LayoutNode,
  LayoutOptions,
  LayoutResult,
} from './layout-algorithm';

export class SimpleTreeLayout implements LayoutAlgorithm {
  name = 'simple-tree';
  private positions = new Map<string, { x: number; y: number }>();
  private nodeMap = new Map<string, LayoutNode>();
  private gridSize = 1;

  layout(
    nodes: LayoutNode[],
    options: LayoutOptions & { gridSize?: number },
  ): LayoutResult {
    this.positions.clear();
    this.nodeMap.clear();
    this.gridSize = options.gridSize || 1;
    // Build node map
    nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
    });

    // Find root nodes (nodes without parents)
    const hasParent = new Set<string>();
    nodes.forEach((node) => {
      node.children.forEach((childId) => {
        hasParent.add(childId);
      });
    });

    const roots = nodes.filter((node) => !hasParent.has(node.id));

    // Arrange each tree
    const isHorizontal = options.direction === 'horizontal';
    let currentOffset = 0;

    roots.forEach((root) => {
      const startX = isHorizontal ? currentOffset : 0;
      const startY = isHorizontal ? 0 : currentOffset;

      this.arrangeNode(root.id, startX, startY, options);

      const treeNodes = this.getTreeNodes(root.id);
      const bounds = this.getTreeBounds(treeNodes);

      if (isHorizontal) {
        const offsetX = startX - bounds.minX;
        if (offsetX !== 0) {
          this.offsetTree(treeNodes, offsetX, 0);
        }
        currentOffset = startX + bounds.width;
      } else {
        const offsetY = startY - bounds.minY;
        if (offsetY !== 0) {
          this.offsetTree(treeNodes, 0, offsetY);
        }
        currentOffset = startY + bounds.height;
      }
    });

    return { positions: this.positions };
  }

  private offsetTree(nodes: LayoutNode[], offsetX: number, offsetY: number) {
    nodes.forEach((node) => {
      const pos = this.positions.get(node.id);
      if (pos) {
        this.positions.set(node.id, { x: pos.x + offsetX, y: pos.y + offsetY });
      }
    });
  }

  private getTreeNodes(rootId: string): LayoutNode[] {
    const treeNodes: LayoutNode[] = [];
    const queue: string[] = [rootId];
    const visited = new Set<string>([rootId]);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = this.nodeMap.get(nodeId);
      if (node) {
        treeNodes.push(node);
        node.children.forEach((childId) => {
          if (!visited.has(childId)) {
            visited.add(childId);
            queue.push(childId);
          }
        });
      }
    }
    return treeNodes;
  }

  private getTreeBounds(nodes: LayoutNode[]): {
    width: number;
    height: number;
    minX: number;
    minY: number;
  } {
    if (nodes.length === 0) {
      return { width: 0, height: 0, minX: 0, minY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const pos = this.positions.get(node.id);
      const n = this.nodeMap.get(node.id);
      if (pos && n) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + n.width);
        maxY = Math.max(maxY, pos.y + n.height);
      }
    });

    if (minX === Infinity) {
      return { width: 0, height: 0, minX: 0, minY: 0 };
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY,
    };
  }

  private arrangeNode(
    nodeId: string,
    x: number,
    y: number,
    options: LayoutOptions,
  ): { x: number; y: number } {
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      return { x, y };
    }

    const children = node.children;
    const isHorizontal = options.direction === 'horizontal';

    let currentX = x;
    let currentY = y;

    if (children.length > 0) {
      const childrenX = isHorizontal
        ? currentX + node.width + options.horizontalSpacing
        : currentX;
      const childrenY = !isHorizontal
        ? currentY + node.height + options.verticalSpacing
        : currentY;

      let nextX = childrenX;
      let nextY = childrenY;
      let maxChildX = 0;
      let maxChildY = 0;

      let firstChild:
        | { x: number; y: number; width: number; height: number }
        | undefined;
      let lastChild:
        | { x: number; y: number; width: number; height: number }
        | undefined;

      children.forEach((childId, index) => {
        const childEndPos = this.arrangeNode(childId, nextX, nextY, options);
        const childNode = this.nodeMap.get(childId)!;
        const childPos = this.positions.get(childId)!;

        if (index === 0) {
          firstChild = {
            ...childPos,
            width: childNode.width,
            height: childNode.height,
          };
        }
        if (index === children.length - 1) {
          lastChild = {
            ...childPos,
            width: childNode.width,
            height: childNode.height,
          };
        }

        if (isHorizontal) {
          nextY = childEndPos.y + options.verticalSpacing;
          maxChildX = Math.max(maxChildX, childEndPos.x);
        } else {
          nextX = childEndPos.x + options.horizontalSpacing;
          maxChildY = Math.max(maxChildY, childEndPos.y);
        }
      });

      if (firstChild && lastChild) {
        if (isHorizontal) {
          const topEdge = firstChild.y;
          const bottomEdge = lastChild.y + lastChild.height;
          currentY = topEdge + (bottomEdge - topEdge) / 2 - node.height / 2;
        } else {
          const leftEdge = firstChild.x;
          const rightEdge = lastChild.x + lastChild.width;
          currentX = leftEdge + (rightEdge - leftEdge) / 2 - node.width / 2;
        }
      }

      const snappedX = Math.round(currentX / this.gridSize) * this.gridSize;
      const snappedY = Math.round(currentY / this.gridSize) * this.gridSize;
      this.positions.set(nodeId, { x: snappedX, y: snappedY });

      if (isHorizontal) {
        return { x: maxChildX, y: nextY - options.verticalSpacing };
      } else {
        return { x: nextX - options.horizontalSpacing, y: maxChildY };
      }
    }

    const snappedX = Math.round(currentX / this.gridSize) * this.gridSize;
    const snappedY = Math.round(currentY / this.gridSize) * this.gridSize;
    this.positions.set(nodeId, { x: snappedX, y: snappedY });

    return { x: currentX + node.width, y: currentY + node.height };
  }
}
