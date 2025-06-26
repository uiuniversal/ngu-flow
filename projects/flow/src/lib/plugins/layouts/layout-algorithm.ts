export interface LayoutNode {
  id: string;
  width: number;
  height: number;
  children: string[];
}

export interface LayoutOptions {
  direction: 'horizontal' | 'vertical';
  horizontalSpacing: number;
  verticalSpacing: number;
  gridSize?: number;
}

export interface LayoutPosition {
  x: number;
  y: number;
}

export interface LayoutResult {
  positions: Map<string, LayoutPosition>;
  width?: number;
  height?: number;
}

export interface LayoutAlgorithm {
  name: string;
  layout(
    nodes: LayoutNode[],
    options: LayoutOptions & { treeSpacing?: number; gridSize?: number },
  ): LayoutResult;
}
