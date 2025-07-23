import { FlowNode, FlowEdge, Arrow, FlowConfig, Dot } from '../entities';

/**
 * Core business logic for managing flow diagrams.
 * This is a pure TypeScript class with no framework dependencies.
 */
export class FlowManager {
  private nodes = new Map<string, FlowNode>();
  private edges = new Map<string, FlowEdge>();
  private parents = new Map<string, string[]>();
  private arrows: Arrow[] = [];
  
  // Zoom and pan state
  private scale = 1;
  private panX = 0;
  private panY = 0;
  
  // Dragging state
  private isDraggingZoomContainer = false;
  private isChildDragging = false;
  private isDraggingConnection = false;
  private connectionDrag: { fromNode: FlowNode; fromDot: Dot } | null = null;
  
  // Configuration
  private config: FlowConfig = new FlowConfig();
  
  constructor(config?: Partial<FlowConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Node management
  updateNodes(nodeList: FlowNode[]): void {
    this.nodes.clear();
    nodeList.forEach((node) => {
      this.nodes.set(node.id, node);
    });
  }

  updateEdges(edgeList: FlowEdge[]): void {
    this.edges.clear();
    this.parents.clear();
    edgeList.forEach((edge) => {
      this.edges.set(edge.id, edge);
      // Build parent mapping from edges
      let parentList = this.parents.get(edge.target);
      if (!parentList) {
        parentList = [];
        this.parents.set(edge.target, parentList);
      }
      if (!parentList.includes(edge.source)) {
        parentList.push(edge.source);
      }
    });
  }

  getNode(id: string): FlowNode | undefined {
    return this.nodes.get(id);
  }

  getNodes(): FlowNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): FlowEdge[] {
    return Array.from(this.edges.values());
  }

  getParents(nodeId: string): string[] {
    return this.parents.get(nodeId) || [];
  }

  updateNodePosition(nodeId: string, x: number, y: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }

  // Zoom and pan calculations
  calculateZoom(
    wheelClientX: number,
    wheelClientY: number,
    scaleDirection: number,
    baseScaleAmount = 0.05
  ): { scale: number; panX: number; panY: number } {
    // Make scaleAmount proportional to the current scale
    const scaleAmount = baseScaleAmount * this.scale;
    // Calculate new scale
    const newScale = this.scale + scaleDirection * scaleAmount;
    // Calculate new pan values to keep the zoom point in the same position on the screen
    const newPanX = wheelClientX + ((this.panX - wheelClientX) * newScale) / this.scale;
    const newPanY = wheelClientY + ((this.panY - wheelClientY) * newScale) / this.scale;

    return { scale: newScale, panX: newPanX, panY: newPanY };
  }

  applyZoom(scale: number, panX: number, panY: number): void {
    this.scale = scale;
    this.panX = panX;
    this.panY = panY;
  }

  applyPan(panX: number, panY: number): void {
    this.panX = panX;
    this.panY = panY;
  }

  // State getters
  getScale(): number {
    return this.scale;
  }

  getPanX(): number {
    return this.panX;
  }

  getPanY(): number {
    return this.panY;
  }

  getConfig(): FlowConfig {
    return this.config;
  }

  updateConfig(config: Partial<FlowConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Dragging state management
  setDraggingZoomContainer(isDragging: boolean): void {
    this.isDraggingZoomContainer = isDragging;
  }

  isDraggingZoomContainerActive(): boolean {
    return this.isDraggingZoomContainer;
  }

  setChildDragging(isDragging: boolean): void {
    this.isChildDragging = isDragging;
  }

  isChildDraggingActive(): boolean {
    return this.isChildDragging;
  }

  setConnectionDragging(isDragging: boolean, connectionData?: { fromNode: FlowNode; fromDot: Dot }): void {
    this.isDraggingConnection = isDragging;
    this.connectionDrag = connectionData || null;
  }

  isConnectionDraggingActive(): boolean {
    return this.isDraggingConnection;
  }

  getConnectionDrag(): { fromNode: FlowNode; fromDot: Dot } | null {
    return this.connectionDrag;
  }

  // Arrow management
  setArrows(arrows: Arrow[]): void {
    this.arrows = arrows;
  }

  getArrows(): Arrow[] {
    return this.arrows;
  }

  // Zoom constraints
  canZoom(scaleDirection: number): boolean {
    // if it is zoom out and the scale is less than 0.3, then return false
    if (scaleDirection === -1 && this.scale < 0.3) return false;
    // if it is zoom in and the scale is greater than 2, then return false
    if (scaleDirection === 1 && this.scale > 2) return false;
    return true;
  }
}