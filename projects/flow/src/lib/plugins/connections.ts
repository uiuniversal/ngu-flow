import {
  ChildInfo,
  DotOptions,
  FlowNode,
  FlowEdge,
  Arrow,
  Dot,
  ArrowPathFn,
  resolveConnectionMode,
} from '../flow-interface';
import { FlowChildComponent } from '../flow-child.component';
import { FlowComponent } from '../flow.component';
import { BasePlugin } from '../adapters/base/base-plugin';
import { blendCorners } from '../svg';

/**
 * Connections plugin supporting flexible and strict connection modes.
 *
 * Mode Priority (highest to lowest):
 * 1. Edge-level mode (edge.mode)
 * 2. Config-level mode (config.connectionMode)
 * 3. Default ('flexible')
 *
 * Modes:
 * - 'flexible' (default): Arrows adapt their connection points based on node positions
 * - 'strict': Arrows maintain fixed connection points regardless of node movement
 */
export class Connections extends BasePlugin {
  // key = id of the item
  // value = ids of the items that depend on it
  reverseDepsMap = new Map<string, string[]>();

  // key = id of the item
  // value = index of the closest dot
  closestDots = new Map<string, number>();
  arrowFn: ArrowPathFn = blendCorners;

  private direction: 'horizontal' | 'vertical' = 'horizontal';

  override onInit(data: FlowComponent): void {
    this.setData(data);
    this.data.flow.startConnection.subscribe(({ event, fromNode, fromDot }) => {
      console.log('startConnection', fromDot);
      this._startDraggingConnection(event, fromNode, fromDot);
    });
    this.data.flow.endConnection.subscribe(({ event, toNode, toDot }) => {
      console.log('endConnection', toDot);
      this._stopDraggingConnection(event, toNode, toDot);
    });

    // Subscribe to layout updates to refresh connections
    this.data.flow.layoutUpdated.subscribe(() => {
      console.log('Layout updated, refreshing connections');
      this.createArrows();
    });
  }

  override onMouseUp(data: FlowComponent, _event: MouseEvent): void {
    this.setData(data);
    if (this.data.flow.isDraggingConnection) {
      // Reset connection drag if mouseup happens outside a valid target dot
      this.data.flow.isDraggingConnection = false;
      this.data.flow.connectionDrag = null;

      const tempPath = this.getSvgGroup().querySelector('#temp-connection');
      if (tempPath) {
        this.getSvgGroup().removeChild(tempPath);
      }
    }
  }

  override onMouseMove(data: FlowComponent, event: MouseEvent): void {
    if (this.data.flow.isDraggingConnection) {
      event.preventDefault();
      this.setData(data);
      // console.log(
      //   'onMouseMove',
      //   event,
      //   this.data.flowService.isDraggingConnection,
      // );
      const tempPath = this.getSvgGroup().querySelector('#temp-connection');
      if (tempPath) {
        // console.log('tempPath found', tempPath);
        const { fromNode, fromDot } = this.data.flow.connectionDrag!;
        const fromDotElement = this.getSvgGroup().querySelector(
          `#${fromDot.id}`,
        );
        if (fromDotElement) {
          // console.log('fromDotElement found', fromDotElement);
          const fromRect = fromDotElement.getBoundingClientRect();
          const { left, top } = this.data.flow.zRect;
          const startX =
            (fromRect.x + fromRect.width / 2 - this.data.flow.panX - left) /
            this.data.flow.scale;
          const startY =
            (fromRect.y + fromRect.height / 2 - this.data.flow.panY - top) /
            this.data.flow.scale;
          const endX = (event.clientX - left) / this.data.flow.scale;
          const endY = (event.clientY - top) / this.data.flow.scale;

          // console.log('Coordinates:', { startX, startY, endX, endY });

          const tempEndDot: DotOptions = {
            x: endX,
            y: endY,
            id: 'temp',
            dotIndex: -1,
          };

          const d = this.arrowFn(
            {
              ...fromNode,
              x: startX,
              y: startY,
              dotIndex:
                fromDot.id === 'top'
                  ? 0
                  : fromDot.id === 'right'
                    ? 1
                    : fromDot.id === 'bottom'
                      ? 2
                      : 3,
            },
            tempEndDot,
            this.data.flow.config.arrows ? this.data.flow.config.arrowSize : 0,
            this.data.config().strokeWidth || 2,
          );
          tempPath.setAttribute('d', d);
        }
      }
    }
  }

  public _startDraggingConnection = (
    _event: MouseEvent,
    fromNode: FlowNode,
    fromDot: Dot,
  ) => {
    if (fromDot.type !== 'output') return;

    this.data.flow.isDraggingConnection = true;
    this.data.flow.connectionDrag = { fromNode, fromDot };

    const tempPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    tempPath.setAttribute('id', 'temp-connection');
    tempPath.setAttribute('stroke', 'var(--flow-path-color)');
    tempPath.setAttribute(
      'stroke-width',
      (this.data.config().strokeWidth || 2).toString(),
    );
    tempPath.setAttribute('fill', 'none');
    this.getSvgGroup().appendChild(tempPath);
  };

  public _stopDraggingConnection = (
    _event: MouseEvent,
    toNode: FlowNode,
    toDot: Dot,
  ) => {
    if (!this.data.flow.isDraggingConnection || toDot.type !== 'input') return;

    const { fromNode, fromDot } = this.data.flow.connectionDrag!;
    if (fromNode.id !== toNode.id) {
      const newEdge: FlowEdge = {
        id: `edge-${fromNode.id}-${toNode.id}-${Date.now()}`,
        source: fromNode.id,
        target: toNode.id,
        sourcePort: fromDot.id,
        targetPort: toDot.id,
      };
      // Add edge to FlowService
      this.data.flow.edges.set(newEdge.id, newEdge);
      // Update parent mapping
      this.data.flow.updateEdges(Array.from(this.data.flow.edges.values()));
      // Emit connection created event
      this.data.emitConnectionCreated(newEdge);
      this.data.runPlugin((p) => p.onChange?.(this.data));
    }

    this.data.flow.isDraggingConnection = false;
    this.data.flow.connectionDrag = null;

    const tempPath = this.getSvgGroup().querySelector('#temp-connection');
    if (tempPath) {
      this.getSvgGroup().removeChild(tempPath);
    }
  };

  override onChange(data: FlowComponent): void {
    this.setData(data);
    this.createArrows();
  }

  override beforeUpdate(_data: FlowComponent): void {
    this.closestDots.clear();
  }

  override onNodeChange(data: FlowComponent, node: FlowNode): void {
    this.data = data;
    this.list = data.list;
    const nodeId = node.id;

    // Find all arrows that involve this node (either as source or target)
    const arrowsToUpdate = this.data.flow.arrows.filter((arrow) =>
      arrow.deps.includes(nodeId),
    );

    // Clear the closest dot cache for the connections involving this node.
    arrowsToUpdate.forEach((arrow) => {
      const [from, to] = arrow.deps;
      this.closestDots.delete(`${from}-${to}`);
      this.closestDots.delete(`${to}-${from}`);
    });

    // Update arrow paths - now uses stored dot indices instead of recalculating
    arrowsToUpdate.forEach((arrow) => this.updateArrowPath(arrow));
    this.updateDotVisibility(this.data.oldChildObj());
  }

  override afterUpdate(data: FlowComponent): void {
    this.setData(data);
    // Instead of updating individual arrows using old logic, recreate all arrows
    this.createArrows();
  }

  updateArrowFn(fn: ArrowPathFn) {
    this.arrowFn = fn;
    this.data.flow.arrows.forEach((arrow) => this.updateArrowPath(arrow));
  }

  private updateArrowPath(arrow: Arrow) {
    const gElement: SVGGElement = this.getSvgGroup();
    const childObj = this.data.getChildInfo();
    const [from, to] = arrow.deps;
    const fromItem = childObj[from];
    const toItem = childObj[to];

    if (fromItem && toItem) {
      let startDotIndex = arrow.startDot;
      let endDotIndex = arrow.endDot;

      // If in flexible mode and no custom ports, recalculate optimal dots
      if (arrow.mode === 'flexible' && !arrow.output && !arrow.input) {
        const dx = toItem.position.x - fromItem.position.x;
        const dy = toItem.position.y - fromItem.position.y;

        // Recalculate optimal connection points based on current positions
        if (Math.abs(dx) > Math.abs(dy)) {
          startDotIndex = dx > 0 ? 1 : 3; // right or left
          endDotIndex = dx > 0 ? 3 : 1; // left or right (opposite)
        } else {
          startDotIndex = dy > 0 ? 2 : 0; // bottom or top
          endDotIndex = dy > 0 ? 0 : 2; // top or bottom (opposite)
        }

        // Update arrow's stored dot indices for consistency
        arrow.startDot = startDotIndex;
        arrow.endDot = endDotIndex;
      }

      const startDot = this.getDotByIndex(
        childObj,
        fromItem.position,
        startDotIndex,
        this.data.flow.scale,
        this.data.flow.panX,
        this.data.flow.panY,
        arrow.output,
      );
      const endDot = this.getDotByIndex(
        childObj,
        toItem.position,
        endDotIndex,
        this.data.flow.scale,
        this.data.flow.panX,
        this.data.flow.panY,
        arrow.input,
      );

      // Draw arrow from start (source) to end (target)
      arrow.d = this.arrowFn(
        startDot,
        endDot,
        this.data.flow.config.arrows ? this.data.flow.config.arrowSize : 0,
        this.data.config().strokeWidth || 2,
      );
    }

    // Update the SVG paths
    const pathElement = gElement.querySelector(
      `#${arrow.id}`,
    ) as SVGPathElement;
    if (pathElement) {
      pathElement.setAttribute('d', arrow.d);
    }
  }

  createArrows() {
    console.log('connections createArrows');

    if (!this.data.g) {
      return;
    }
    // Clear existing arrows
    this.data.flow.arrows = [];
    const gElement: SVGGElement = this.getSvgGroup();
    // Remove existing paths
    while (gElement.firstChild) {
      gElement.removeChild(gElement.firstChild);
    }

    // Create arrows from edges
    const edges = Array.from(this.data.flow.edges.values());
    if (!edges || edges.length === 0) {
      console.warn('No edges to create arrows for');
      return;
    }
    edges.forEach((edge) => {
      const sourceNode = this.list.find((n) => n.position.id === edge.source);
      const targetNode = this.list.find((n) => n.position.id === edge.target);

      if (sourceNode && targetNode) {
        let startDot: DotOptions;
        let endDot: DotOptions;
        let sourceDotIndex = 0;
        let targetDotIndex = 0;

        if (edge.sourcePort && edge.targetPort) {
          // Use custom dots with specific IDs
          // First, find the actual dot indices for the custom dots
          const childObj = this.data.oldChildObj();
          const sourceChild = childObj[sourceNode.position.id];
          const targetChild = childObj[targetNode.position.id];

          // Find the index of the custom dots by their IDs
          const sourceDots = sourceChild?.dots() || [] || [];
          const targetDots = targetChild?.dots() || [] || [];

          sourceDotIndex = sourceDots.findIndex(
            (dot) => dot.nativeElement.id === edge.sourcePort,
          );
          targetDotIndex = targetDots.findIndex(
            (dot) => dot.nativeElement.id === edge.targetPort,
          );

          // If custom dots not found, use directional logic as fallback
          if (sourceDotIndex === -1 || targetDotIndex === -1) {
            console.warn(
              `Custom dots not found! sourcePort: ${edge.sourcePort} (index: ${sourceDotIndex}), targetPort: ${edge.targetPort} (index: ${targetDotIndex})`,
            );

            // Fall back to directional logic
            const dx = targetNode.position.x - sourceNode.position.x;
            const dy = targetNode.position.y - sourceNode.position.y;

            if (sourceDotIndex === -1) {
              sourceDotIndex =
                Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
            }
            if (targetDotIndex === -1) {
              targetDotIndex =
                Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 0 : 2;
            }
          }

          startDot = this.getDotByIndex(
            this.data.getChildInfo(),
            sourceNode.position,
            sourceDotIndex,
            this.data.flow.scale,
            this.data.flow.panX,
            this.data.flow.panY,
            edge.sourcePort,
          );
          endDot = this.getDotByIndex(
            this.data.getChildInfo(),
            targetNode.position,
            targetDotIndex,
            this.data.flow.scale,
            this.data.flow.panX,
            this.data.flow.panY,
            edge.targetPort,
          );
        } else {
          // Use simple directional logic for default dots
          // Determine direction based on position
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;

          // Source dot: point towards target
          if (Math.abs(dx) > Math.abs(dy)) {
            sourceDotIndex = dx > 0 ? 1 : 3; // right or left
          } else {
            sourceDotIndex = dy > 0 ? 2 : 0; // bottom or top
          }

          // Target dot: point towards source (opposite)
          if (Math.abs(dx) > Math.abs(dy)) {
            targetDotIndex = dx > 0 ? 3 : 1; // left or right (opposite)
          } else {
            targetDotIndex = dy > 0 ? 0 : 2; // top or bottom (opposite)
          }

          startDot = this.getDotByIndex(
            this.data.getChildInfo(),
            sourceNode.position,
            sourceDotIndex,
            this.data.flow.scale,
            this.data.flow.panX,
            this.data.flow.panY,
          );
          endDot = this.getDotByIndex(
            this.data.getChildInfo(),
            targetNode.position,
            targetDotIndex,
            this.data.flow.scale,
            this.data.flow.panX,
            this.data.flow.panY,
          );
        }

        const arrow: Arrow = {
          d: this.arrowFn(
            startDot,
            endDot,
            this.data.flow.config.arrows ? this.data.flow.config.arrowSize : 0,
            this.data.config().strokeWidth || 2,
          ),
          deps: [edge.source, edge.target],
          id: edge.id,
          output: edge.sourcePort || undefined, // Leave undefined for default dots to avoid ID conflicts
          input: edge.targetPort || undefined, // Leave undefined for default dots to avoid ID conflicts
          startDot: sourceDotIndex,
          endDot: targetDotIndex,
          mode: resolveConnectionMode(edge, this.data.flow.getConfig()), // Use priority resolver
        };

        // Create path element and set attributes
        const pathElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path',
        );
        pathElement.setAttribute('d', arrow.d);
        pathElement.setAttribute('id', arrow.id);
        pathElement.setAttribute('stroke', 'var(--flow-path-color)');
        pathElement.setAttribute(
          'stroke-width',
          (this.data.config().strokeWidth || 2).toString(),
        );
        pathElement.setAttribute('fill', 'none');
        if (this.data.config().arrows) {
          pathElement.setAttribute('marker-end', 'url(#arrowhead)');
        }

        // Append path to <g> element
        gElement.appendChild(pathElement);
        this.data.flow.arrows.push(arrow);
      }
    });

    // Update dot visibility after creating arrows
    this.updateDotVisibility(this.data.oldChildObj());
  }

  protected override setData(data: FlowComponent) {
    super.setData(data);
    this.direction = this.getDirection(); // Use BasePlugin's getDirection method
    this.setReverseDepsMap(this.list.map((x) => x.position));
  }

  public getClosestDotsSimplified(
    item: ChildInfo,
    dep: string,
  ): [number, number] {
    const parents = this.data.flow.parents.get(item.position.id) || [];
    const edges = Array.from(this.data.flow.edges.values());
    const children = edges
      .filter((edge) => edge.source === item.position.id)
      .map((edge) => edge.target);
    const ids = [...parents, ...children];
    ids.forEach((x) => this.findClosestDot(x, item));
    // ids.forEach((x) => this.findClosestDot(x, item, childObj));
    // Remove duplicates
    // const uniqueClosestDotIndices = Array.from(new Set(closestDotIndices));

    const targetDotIndex =
      this.closestDots.get(`${item.position.id}-${dep}`) ?? 1; // default to right
    const sourceDotIndex =
      this.closestDots.get(`${dep}-${item.position.id}`) ?? 3; // default to left

    return [targetDotIndex, sourceDotIndex];
    // return dep
    //   ? [this.closestDots.get(`${item.id}-${dep}`) as number, this.closestDots.get(`${dep}-${item.id}`) as number]
    //   : closestDotIndices;
  }

  private findClosestDot(
    depId: string,
    item: ChildInfo,
    // childObj: Record<string, { dots: DOMRect[] }>
  ) {
    const uniqueKey1 = `${item.position.id}-${depId}`;
    const uniqueKey2 = `${depId}-${item.position.id}`;

    if (this.closestDots.has(uniqueKey1)) return;

    const dep = this.list.find((item) => item.position.id === depId);
    if (dep) {
      const [closestDotIndex1, closestDotIndex2] =
        this._findClosestConnectionPoints(item, dep);

      this.closestDots.set(uniqueKey1, closestDotIndex1);
      this.closestDots.set(uniqueKey2, closestDotIndex2);
    }
  }

  public _findClosestConnectionPoints(
    parent: ChildInfo,
    child: ChildInfo,
  ): [number, number] {
    // sides dot index order: [top, right, bottom, left]
    let swapped = false;
    const isV = this.direction === 'vertical';
    // Check if we need to swap based on actual connection direction
    const edges = Array.from(this.data.flow.edges.values());
    const hasEdgeFromParentToChild = edges.some(
      (edge) =>
        edge.source === parent.position.id && edge.target === child.position.id,
    );
    const hasEdgeFromChildToParent = edges.some(
      (edge) =>
        edge.source === child.position.id && edge.target === parent.position.id,
    );

    if (!hasEdgeFromParentToChild && hasEdgeFromChildToParent) {
      const _t = child;
      child = parent;
      parent = _t;
      swapped = true;
    }

    const childDirection = this.getNodeDirection(child, parent, isV);

    const parentIndex = (() => {
      if (childDirection === 'right') return 1;
      if (childDirection === 'left') return 3;
      if (childDirection === 'bottom') return 2;
      return 0;
    })();
    const childIndex = (() => {
      if (childDirection === 'right') return 3;
      if (childDirection === 'left') return 1;
      if (childDirection === 'bottom') return 0;
      return 2;
    })();

    return swapped ? [childIndex, parentIndex] : [parentIndex, childIndex];
  }

  private getNodeDirection(
    child: ChildInfo,
    parent: ChildInfo,
    isV: boolean,
  ): 'right' | 'left' | 'bottom' | 'top' {
    if (isV) {
      return parent.position.y < child.position.y ? 'bottom' : 'top';
    } else {
      return parent.position.x < child.position.x ? 'right' : 'left';
    }
  }

  private updateDotVisibility(childObj: Record<string, FlowChildComponent>) {
    for (const id in childObj) {
      const child = childObj[id];
      const dots = child.dots();

      for (let index = 0; index < dots.length; index++) {
        const dot = dots[index];

        // Check if this dot is used in any edge (for custom dots)
        const dotId = dot.nativeElement.id;
        const edges = Array.from(this.data.flow.edges.values());
        const isUsedInEdge = edges.some(
          (edge) => edge.sourcePort === dotId || edge.targetPort === dotId,
        );

        // Check if this dot is used for default connections (consider mode)
        const isUsedForDefaultConnection = edges.some((edge) => {
          if (edge.sourcePort || edge.targetPort) {
            // Skip custom dot edges
            return false;
          }

          const sourceNode = this.list.find(
            (n) => n.position.id === edge.source,
          );
          const targetNode = this.list.find(
            (n) => n.position.id === edge.target,
          );

          if (!sourceNode || !targetNode) return false;

          const mode = resolveConnectionMode(edge, this.data.flow.getConfig());
          let sourceDotIndex, targetDotIndex;

          if (mode === 'flexible') {
            // For flexible mode, use current optimal dots based on positions
            const dx = targetNode.position.x - sourceNode.position.x;
            const dy = targetNode.position.y - sourceNode.position.y;

            // Source dot: point towards target
            if (Math.abs(dx) > Math.abs(dy)) {
              sourceDotIndex = dx > 0 ? 1 : 3; // right or left
            } else {
              sourceDotIndex = dy > 0 ? 2 : 0; // bottom or top
            }

            // Target dot: point towards source (opposite)
            if (Math.abs(dx) > Math.abs(dy)) {
              targetDotIndex = dx > 0 ? 3 : 1; // left or right (opposite)
            } else {
              targetDotIndex = dy > 0 ? 0 : 2; // top or bottom (opposite)
            }
          } else {
            // For strict mode, use the stored arrow dot indices
            const arrow = this.data.flow.arrows.find((a) => a.id === edge.id);
            if (arrow) {
              sourceDotIndex = arrow.startDot;
              targetDotIndex = arrow.endDot;
            } else {
              // Fallback to original calculation if arrow not found
              const dx = targetNode.position.x - sourceNode.position.x;
              const dy = targetNode.position.y - sourceNode.position.y;
              sourceDotIndex =
                Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
              targetDotIndex =
                Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 0 : 2;
            }
          }

          // Check if this dot is used as source or target
          return (
            (edge.source === id && index === sourceDotIndex) ||
            (edge.target === id && index === targetDotIndex)
          );
        });

        // Show dot if it's used in an edge or for default connections
        dot.nativeElement.style.visibility =
          isUsedInEdge || isUsedForDefaultConnection ? 'visible' : 'hidden';
      }
    }
  }

  private getDotByIndex(
    _childObj: Record<string, ChildInfo>,
    item: FlowNode,
    dotIndex: number,
    scale: number,
    panX: number,
    panY: number,
    dotId?: string,
  ): DotOptions {
    let rect: DOMRect;

    if (dotId) {
      // Always get fresh position for custom dots
      const dotElement = document.querySelector(`#${dotId}`);
      if (dotElement) {
        rect = dotElement.getBoundingClientRect();
      } else {
        // Fallback: get fresh dot positions from DOM
        const childComponent = this.data.oldChildObj()[item.id];
        if (childComponent && childComponent.dots) {
          const dots = childComponent.dots();
          if (dotIndex >= 0 && dotIndex < dots.length) {
            rect = dots[dotIndex].nativeElement.getBoundingClientRect();
          } else {
            throw new Error(`Invalid dot index: ${dotIndex}`);
          }
        } else {
          throw new Error(`Child component not found for item: ${item.id}`);
        }
      }
    } else {
      // Always get fresh dot positions from DOM for default dots
      const childComponent = this.data.oldChildObj()[item.id];
      if (childComponent && childComponent.dots) {
        const dots = childComponent.dots();
        if (dotIndex >= 0 && dotIndex < dots.length) {
          rect = dots[dotIndex].nativeElement.getBoundingClientRect();
        } else {
          throw new Error(`Invalid dot index: ${dotIndex}`);
        }
      } else {
        throw new Error(`Child component not found for item: ${item.id}`);
      }
    }

    const { left, top } = this.data.flow.zRect;
    const x = (rect.x + rect.width / 2 - panX - left) / scale;
    const y = (rect.y + rect.height / 2 - panY - top) / scale;

    return { ...item, x, y, dotIndex };
  }

  private setReverseDepsMap(_list: FlowNode[]) {
    // This method is no longer needed as we use edges
  }
}
