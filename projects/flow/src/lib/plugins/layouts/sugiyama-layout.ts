import { LayoutAlgorithm, LayoutNode, LayoutOptions, LayoutResult } from './layout-algorithm';

interface GraphNode extends LayoutNode {
  layer: number;
  position: number;
  parents: string[];
}

export class SugiyamaLayout implements LayoutAlgorithm {
  name = 'sugiyama';
  private gridSize = 1;

  layout(nodes: LayoutNode[], options: LayoutOptions & { gridSize?: number }): LayoutResult {
    const nodeMap = new Map<string, GraphNode>();
    const positions = new Map<string, { x: number; y: number }>();
    this.gridSize = options.gridSize || 1;

    // Build graph structure
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        width: node.width || 150,
        height: node.height || 50,
        layer: -1,
        position: 0,
        parents: []
      });
    });

    nodes.forEach(node => {
      node.children.forEach(childId => {
        const child = nodeMap.get(childId);
        if (child) {
          child.parents.push(node.id);
        }
      });
    });

    // Phase 1: Assign layers
    this.assignLayers(nodeMap);

    // Phase 2: Create dummy nodes to break long edges
    this.createDummyNodes(nodeMap);

    // Phase 3: Order nodes within layers
    const layers = this.orderNodesInLayers(nodeMap);

    // Phase 4: Assign coordinates
    this.assignCoordinates(layers, nodeMap, positions, options);

    // Filter out dummy nodes from the final result
    const finalPositions = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => {
      if (positions.has(node.id)) {
        finalPositions.set(node.id, positions.get(node.id)!);
      }
    });

    return { positions: finalPositions };
  }

  private assignLayers(nodeMap: Map<string, GraphNode>): void {
    const visited = new Set<string>();
    const visit = (nodeId: string): number => {
      if (visited.has(nodeId)) {
        return nodeMap.get(nodeId)!.layer;
      }
      visited.add(nodeId);

      const node = nodeMap.get(nodeId)!;
      let maxParentLayer = -1;
      node.parents.forEach(parentId => {
        maxParentLayer = Math.max(maxParentLayer, visit(parentId));
      });

      node.layer = maxParentLayer + 1;
      return node.layer;
    };

    nodeMap.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    });
  }

  private createDummyNodes(nodeMap: Map<string, GraphNode>): void {
    const edgesToRemove: { u: string; v: string }[] = [];
    const edgesToAdd: { u: string; v: string }[] = [];

    nodeMap.forEach(parent => {
      parent.children.forEach(childId => {
        const child = nodeMap.get(childId)!;
        if (child.layer > parent.layer + 1) {
          edgesToRemove.push({ u: parent.id, v: child.id });
          let lastNodeId = parent.id;
          for (let i = parent.layer + 1; i < child.layer; i++) {
            const dummyId = `dummy-${parent.id}-${child.id}-${i}`;
            const dummyNode: GraphNode = {
              id: dummyId,
              children: [],
              parents: [],
              layer: i,
              position: 0,
              width: 0,
              height: 5,
            };
            nodeMap.set(dummyId, dummyNode);
            edgesToAdd.push({ u: lastNodeId, v: dummyId });
            lastNodeId = dummyId;
          }
          edgesToAdd.push({ u: lastNodeId, v: child.id });
        }
      });
    });

    edgesToRemove.forEach(edge => {
      const parent = nodeMap.get(edge.u)!;
      parent.children = parent.children.filter(c => c !== edge.v);
      const child = nodeMap.get(edge.v)!;
      child.parents = child.parents.filter(p => p !== edge.u);
    });

    edgesToAdd.forEach(edge => {
      const parent = nodeMap.get(edge.u)!;
      const child = nodeMap.get(edge.v)!;
      parent.children.push(edge.v);
      child.parents.push(edge.u);
    });
  }

  private orderNodesInLayers(nodeMap: Map<string, GraphNode>): Map<number, GraphNode[]> {
    const layers = new Map<number, GraphNode[]>();
    nodeMap.forEach(node => {
      if (!layers.has(node.layer)) {
        layers.set(node.layer, []);
      }
      layers.get(node.layer)!.push(node);
    });

    const sortedLayers = new Map([...layers.entries()].sort((a, b) => a[0] - b[0]));

    for (let iter = 0; iter < 10; iter++) {
      sortedLayers.forEach((layerNodes, layerIndex) => {
        if (layerIndex === 0) return;

        const barycenters = new Map<string, number>();
        layerNodes.forEach(node => {
          let sum = 0;
          let count = 0;
          node.parents.forEach(parentId => {
            const parent = nodeMap.get(parentId)!;
            const parentLayer = sortedLayers.get(parent.layer)!;
            sum += parentLayer.findIndex(p => p.id === parentId);
            count++;
          });
          barycenters.set(node.id, count > 0 ? sum / count : layerNodes.length);
        });

        layerNodes.sort((a, b) => barycenters.get(a.id)! - barycenters.get(b.id)!);
      });
    }

    return sortedLayers;
  }

  private assignCoordinates(
    layers: Map<number, GraphNode[]>,
    nodeMap: Map<string, GraphNode>,
    positions: Map<string, { x: number; y: number }>,
    options: LayoutOptions
  ): void {
    const isHorizontal = options.direction === 'horizontal';
    const primarySpacing = isHorizontal ? options.horizontalSpacing : options.verticalSpacing;
    const secondarySpacing = isHorizontal ? options.verticalSpacing : options.horizontalSpacing;

    const layerPrimarySizes = new Map<number, number>();
    layers.forEach((layerNodes, layerIndex) => {
      let maxDim = 0;
      layerNodes.forEach(node => {
        maxDim = Math.max(maxDim, isHorizontal ? node.width : node.height);
      });
      layerPrimarySizes.set(layerIndex, maxDim);
    });

    const layerPrimaryCoords = new Map<number, number>();
    let currentPrimaryPos = 0;
    const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
    sortedLayerKeys.forEach((layerIndex, i) => {
      if (i > 0) {
        currentPrimaryPos += (layerPrimarySizes.get(sortedLayerKeys[i - 1]) || 0) + primarySpacing;
      }
      layerPrimaryCoords.set(layerIndex, currentPrimaryPos);
    });

    layers.forEach((layerNodes, layerIndex) => {
      const primaryCoord = layerPrimaryCoords.get(layerIndex)!;
      let currentSecondaryPos = 0;
      layerNodes.forEach((node, i) => {
        if (i > 0) {
          const prevNode = layerNodes[i - 1];
          currentSecondaryPos += (isHorizontal ? prevNode.height : prevNode.width) + secondarySpacing;
        }
        if (isHorizontal) {
          positions.set(node.id, { x: primaryCoord, y: currentSecondaryPos });
        } else {
          positions.set(node.id, { x: currentSecondaryPos, y: primaryCoord });
        }
      });
    });

    for (let i = 0; i < 4; i++) {
      this.alignNodes(layers, positions, isHorizontal);
      this.compactSecondary(layers, positions, isHorizontal, secondarySpacing, nodeMap);
    }

    this.centerParents(layers, positions, isHorizontal, nodeMap);
    this.compactSecondary(layers, positions, isHorizontal, secondarySpacing, nodeMap);

    this.centerGraph(positions, isHorizontal, nodeMap);
    positions.forEach(pos => {
      pos.x = Math.round(pos.x / this.gridSize) * this.gridSize;
      pos.y = Math.round(pos.y / this.gridSize) * this.gridSize;
    });
  }

  private centerParents(
    layers: Map<number, GraphNode[]>,
    positions: Map<string, { x: number, y: number }>,
    isHorizontal: boolean,
    nodeMap: Map<string, GraphNode>
  ) {
    const sortedLayers = Array.from(layers.keys()).sort((a, b) => b - a);
    sortedLayers.forEach(layerIndex => {
      const layerNodes = layers.get(layerIndex)!;
      layerNodes.forEach(parent => {
        if (parent.children.length > 0) {
          let minChildPos = Infinity;
          let maxChildPos = -Infinity;

          parent.children.forEach(childId => {
            const childNode = nodeMap.get(childId);
            const childPos = positions.get(childId);
            if (childNode && childPos) {
              const secondaryPos = isHorizontal ? childPos.y : childPos.x;
              const secondarySize = isHorizontal ? childNode.height : childNode.width;
              minChildPos = Math.min(minChildPos, secondaryPos);
              maxChildPos = Math.max(maxChildPos, secondaryPos + secondarySize);
            }
          });

          if (minChildPos !== Infinity) {
            const childrenCenter = minChildPos + (maxChildPos - minChildPos) / 2;
            const parentPos = positions.get(parent.id)!;
            const parentSize = isHorizontal ? parent.height : parent.width;
            const desiredPos = childrenCenter - parentSize / 2;

            if (isHorizontal) {
              parentPos.y = desiredPos;
            } else {
              parentPos.x = desiredPos;
            }
          }
        }
      });
    });
  }

  private median(numbers: number[]): number {
    const sorted = numbers.slice().sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  }

  private alignNodes(
    layers: Map<number, GraphNode[]>,
    positions: Map<string, { x: number; y: number }>,
    isHorizontal: boolean
  ) {
    Array.from(layers.keys()).sort((a, b) => a - b).forEach(layerIndex => {
      layers.get(layerIndex)!.forEach(node => {
        const connectedPositions = [...node.parents, ...node.children].map(id => {
          const pos = positions.get(id);
          return pos ? (isHorizontal ? pos.y : pos.x) : 0;
        }).filter(p => p !== 0);

        if (connectedPositions.length > 0) {
          const median = this.median(connectedPositions);
          const currentPos = positions.get(node.id)!;
          if (isHorizontal) currentPos.y = median; else currentPos.x = median;
        }
      });
    });
  }

  private compactSecondary(
    layers: Map<number, GraphNode[]>,
    positions: Map<string, { x: number, y: number }>,
    isHorizontal: boolean,
    secondarySpacing: number,
    nodeMap: Map<string, GraphNode>
  ) {
    layers.forEach(layerNodes => {
      layerNodes.sort((a, b) => {
        const posA = positions.get(a.id)!;
        const posB = positions.get(b.id)!;
        return (isHorizontal ? posA.y : posA.x) - (isHorizontal ? posB.y : posB.x);
      });

      for (let i = 1; i < layerNodes.length; i++) {
        const node = layerNodes[i];
        const prevNode = layerNodes[i - 1];
        const pos = positions.get(node.id)!;
        const prevPos = positions.get(prevNode.id)!;
        const prevNodeSize = isHorizontal ? prevNode.height : prevNode.width;
        const requiredPos = (isHorizontal ? prevPos.y : prevPos.x) + prevNodeSize + secondarySpacing;
        const currentPos = isHorizontal ? pos.y : pos.x;

        if (currentPos < requiredPos) {
          if (isHorizontal) {
            pos.y = requiredPos;
          } else {
            pos.x = requiredPos;
          }
        }
      }
    });
  }

  private centerGraph(
    positions: Map<string, { x: number; y: number }>,
    isHorizontal: boolean,
    nodeMap: Map<string, GraphNode>
  ) {
    let minSecondary = Infinity, maxSecondary = -Infinity;
    positions.forEach((pos, nodeId) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      const secondaryDim = isHorizontal ? node.height : node.width;
      const secondaryPos = isHorizontal ? pos.y : pos.x;
      minSecondary = Math.min(minSecondary, secondaryPos);
      maxSecondary = Math.max(maxSecondary, secondaryPos + secondaryDim);
    });

    if (minSecondary === Infinity) return;
    const offset = minSecondary + (maxSecondary - minSecondary) / 2;
    positions.forEach(pos => {
      if (isHorizontal) pos.y -= offset; else pos.x -= offset;
    });
  }
}

