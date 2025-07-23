import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FlowManager } from '../../core/use-cases/flow-manager';
import { IFlowPresenter, IFlowGateway } from '../../core/use-cases/interfaces';
import {
  FlowNode,
  FlowEdge,
  Dot,
  Arrow,
  FlowConfig,
} from '../../core/entities';

/**
 * Adapter service that acts as a bridge between Angular framework and core business logic.
 * This follows the adapter pattern, delegating business logic to FlowManager.
 */
@Injectable()
export class FlowAdapterService implements IFlowPresenter, IFlowGateway {
  private flowManager: FlowManager;
  private zoomContainer!: HTMLElement;

  // Presenters - Observables for UI updates
  scaleChange = new Subject<void>();
  panChange = new Subject<void>();
  nodePositionChange = new Subject<FlowNode>();
  layoutUpdated = new Subject<void>();
  arrowsChange = new Subject<FlowNode>();

  // UI interaction subjects
  enableChildDragging = new BehaviorSubject(true);
  enableZooming = new BehaviorSubject(true);
  onMouse = new Subject<MouseEvent>();
  startConnection = new Subject<{
    event: MouseEvent;
    fromNode: FlowNode;
    fromDot: Dot;
  }>();
  endConnection = new Subject<{
    event: MouseEvent;
    toNode: FlowNode;
    toDot: Dot;
  }>();

  constructor(private ngZone: NgZone) {
    this.flowManager = new FlowManager();
    this.setupMouseHandling();
  }

  private setupMouseHandling(): void {
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onMouseMove);
    });
  }

  private onMouseMove = (event: MouseEvent) => {
    this.onMouse.next(event);

    if (this.flowManager.isConnectionDraggingActive()) {
      this.handleConnectionDrag(event);
    }
  };

  private handleConnectionDrag(event: MouseEvent): void {
    const tempPath = this.zoomContainer.querySelector('#temp-connection');
    if (tempPath) {
      const connectionDrag = this.flowManager.getConnectionDrag();
      if (connectionDrag) {
        const { fromNode, fromDot } = connectionDrag;
        const fromDotElement = this.zoomContainer.querySelector(
          `#${fromDot.id}`,
        );
        if (fromDotElement) {
          const fromRect = fromDotElement.getBoundingClientRect();
          const { left, top } = this.getZoomContainerRect();
          const startX =
            (fromRect.x +
              fromRect.width / 2 -
              this.flowManager.getPanX() -
              left) /
            this.flowManager.getScale();
          const startY =
            (fromRect.y +
              fromRect.height / 2 -
              this.flowManager.getPanY() -
              top) /
            this.flowManager.getScale();
          const endX =
            (event.clientX - this.flowManager.getPanX() - left) /
            this.flowManager.getScale();
          const endY =
            (event.clientY - this.flowManager.getPanY() - top) /
            this.flowManager.getScale();

          const d = `M${startX},${startY} L${endX},${endY}`;
          tempPath.setAttribute('d', d);
        }
      }
    }
  }

  // Delegates to FlowManager
  updateNodes(nodes: FlowNode[]): void {
    this.flowManager.updateNodes(nodes);
    this.onNodesChange();
  }

  updateEdges(edges: FlowEdge[]): void {
    this.flowManager.updateEdges(edges);
  }

  updateNodePosition(nodeId: string, x: number, y: number): void {
    this.flowManager.updateNodePosition(nodeId, x, y);
    const node = this.flowManager.getNode(nodeId);
    if (node) {
      this.onNodePositionChange(node);
    }
  }

  // Zoom and pan handling
  handleWheel(event: WheelEvent, clientX: number, clientY: number): void {
    if (!this.flowManager.getConfig().zooming || !this.enableZooming.value)
      return;
    if (
      this.flowManager.isDraggingZoomContainerActive() ||
      this.flowManager.isChildDraggingActive()
    )
      return;

    event.stopPropagation();
    event.preventDefault();

    const scaleDirection = event.deltaY < 0 ? 1 : -1;
    if (!this.flowManager.canZoom(scaleDirection)) return;

    const { left, top } = this.getZoomContainerRect();
    const zoomResult = this.flowManager.calculateZoom(
      clientX - left,
      clientY - top,
      scaleDirection,
    );

    this.flowManager.applyZoom(
      zoomResult.scale,
      zoomResult.panX,
      zoomResult.panY,
    );
    this.updateZoomContainerTransform(
      zoomResult.scale,
      zoomResult.panX,
      zoomResult.panY,
    );
    this.onScaleChange();
    this.onPanChange();
  }

  handlePanStart(initialX: number, initialY: number): void {
    this.flowManager.setDraggingZoomContainer(true);
  }

  handlePan(
    clientX: number,
    clientY: number,
    initialX: number,
    initialY: number,
  ): void {
    if (this.flowManager.isDraggingZoomContainerActive()) {
      const panX = clientX - initialX;
      const panY = clientY - initialY;
      this.flowManager.applyPan(panX, panY);
      this.updateZoomContainerTransform(
        this.flowManager.getScale(),
        panX,
        panY,
      );
      this.onPanChange();
    }
  }

  handlePanEnd(): void {
    this.flowManager.setDraggingZoomContainer(false);
  }

  // Dragging state management
  setChildDragging(isDragging: boolean): void {
    this.flowManager.setChildDragging(isDragging);
  }

  setConnectionDragging(
    isDragging: boolean,
    connectionData?: { fromNode: FlowNode; fromDot: Dot },
  ): void {
    this.flowManager.setConnectionDragging(isDragging, connectionData);
  }

  // Getters for current state
  getNodes(): FlowNode[] {
    return this.flowManager.getNodes();
  }

  getEdges(): FlowEdge[] {
    return this.flowManager.getEdges();
  }

  getNode(id: string): FlowNode | undefined {
    return this.flowManager.getNode(id);
  }

  getParents(nodeId: string): string[] {
    return this.flowManager.getParents(nodeId);
  }

  getScale(): number {
    return this.flowManager.getScale();
  }

  getPanX(): number {
    return this.flowManager.getPanX();
  }

  getPanY(): number {
    return this.flowManager.getPanY();
  }

  getConfig(): FlowConfig {
    return this.flowManager.getConfig();
  }

  updateConfig(config: Partial<FlowConfig>): void {
    this.flowManager.updateConfig(config);
  }

  getArrows(): Arrow[] {
    return this.flowManager.getArrows();
  }

  setArrows(arrows: Arrow[]): void {
    this.flowManager.setArrows(arrows);
  }

  // Framework-specific methods
  setZoomContainer(element: HTMLElement): void {
    this.zoomContainer = element;
  }

  // IFlowPresenter implementation
  onScaleChange(): void {
    this.scaleChange.next();
  }

  onPanChange(): void {
    this.panChange.next();
  }

  onNodesChange(): void {
    // Notify that nodes have changed
  }

  onNodePositionChange(node: FlowNode): void {
    this.nodePositionChange.next(node);
    this.arrowsChange.next(node);
  }

  onLayoutUpdate(): void {
    this.layoutUpdated.next();
  }

  // IFlowGateway implementation
  getZoomContainerRect(): DOMRect {
    return this.zoomContainer.getBoundingClientRect();
  }

  updateZoomContainerTransform(
    scale: number,
    panX: number,
    panY: number,
  ): void {
    // Store the transform values, actual DOM update is handled by component
    this.flowManager.applyZoom(scale, panX, panY);
  }

  // Compatibility getters for current usage
  get items(): Map<string, FlowNode> {
    const map = new Map<string, FlowNode>();
    this.getNodes().forEach((node) => map.set(node.id, node));
    return map;
  }

  get edges(): Map<string, FlowEdge> {
    const map = new Map<string, FlowEdge>();
    this.getEdges().forEach((edge) => map.set(edge.id, edge));
    return map;
  }

  get config(): FlowConfig {
    return this.getConfig();
  }

  set config(config: FlowConfig) {
    this.updateConfig(config);
  }

  get isDraggingZoomContainer(): boolean {
    return this.flowManager.isDraggingZoomContainerActive();
  }

  set isDraggingZoomContainer(value: boolean) {
    this.flowManager.setDraggingZoomContainer(value);
  }

  get isChildDragging(): boolean {
    return this.flowManager.isChildDraggingActive();
  }

  set isChildDragging(value: boolean) {
    this.flowManager.setChildDragging(value);
  }

  get isDraggingConnection(): boolean {
    return this.flowManager.isConnectionDraggingActive();
  }

  set isDraggingConnection(value: boolean) {
    this.flowManager.setConnectionDragging(value);
  }

  get connectionDrag(): { fromNode: FlowNode; fromDot: Dot } | null {
    return this.flowManager.getConnectionDrag();
  }

  set connectionDrag(value: { fromNode: FlowNode; fromDot: Dot } | null) {
    this.flowManager.setConnectionDragging(!!value, value || undefined);
  }

  get scale(): number {
    return this.getScale();
  }

  set scale(value: number) {
    this.flowManager.applyZoom(value, this.getPanX(), this.getPanY());
  }

  get panX(): number {
    return this.getPanX();
  }

  set panX(value: number) {
    this.flowManager.applyPan(value, this.getPanY());
  }

  get panY(): number {
    return this.getPanY();
  }

  set panY(value: number) {
    this.flowManager.applyPan(this.getPanX(), value);
  }

  get gridSize(): number {
    return this.getConfig().gridSize || 1;
  }

  set gridSize(value: number) {
    this.updateConfig({ gridSize: value });
  }

  get arrows(): Arrow[] {
    return this.getArrows();
  }

  set arrows(value: Arrow[]) {
    this.setArrows(value);
  }

  get zRect(): DOMRect {
    return this.getZoomContainerRect();
  }

  // Legacy compatibility methods
  update(items: FlowNode[]): void {
    this.updateNodes(items);
  }

  get parents(): Map<string, string[]> {
    const map = new Map<string, string[]>();
    this.getNodes().forEach((node) => {
      const nodeParents = this.getParents(node.id);
      if (nodeParents.length > 0) {
        map.set(node.id, nodeParents);
      }
    });
    return map;
  }
}
