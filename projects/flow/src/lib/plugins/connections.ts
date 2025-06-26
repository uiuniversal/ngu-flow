import { ChildInfo, DotOptions, FlowOptions } from '../flow-interface';
import { FlowChildComponent } from '../flow-child.component';
import { FlowComponent } from '../flow.component';
import { FlowPlugin } from './plugin';
import { Arrow } from '../flow.service';

export class Connections implements FlowPlugin {
  // key = id of the item
  // value = ids of the items that depend on it
  reverseDepsMap = new Map<string, string[]>();

  // key = id of the item
  // value = index of the closest dot
  closestDots = new Map<string, number>();

  data!: FlowComponent;
  private list!: ChildInfo[];
  private direction: 'horizontal' | 'vertical' = 'horizontal';

  onInit(data: FlowComponent): void {
    this.setData(data);
  }

  onChange(data: FlowComponent): void {
    this.setData(data);
    this.createArrows();
  }

  beforeUpdate(data: FlowComponent): void {
    this.closestDots.clear();
  }

  onNodeChange(data: FlowComponent, node: FlowOptions): void {
    this.data = data;
    this.list = data.list;
    const nodeId = node.id;

    const arrowsToUpdate = this.data.flow.arrows.filter((arrow) =>
      arrow.deps.includes(nodeId),
    );

    // Clear the closest dot cache for the connections involving this node.
    arrowsToUpdate.forEach((arrow) => {
      const [from, to] = arrow.deps;
      this.closestDots.delete(`${from}-${to}`);
      this.closestDots.delete(`${to}-${from}`);
    });

    arrowsToUpdate.forEach((arrow) => this.updateArrowPath(arrow));
    this.updateDotVisibility(this.data.oldChildObj());
  }

  afterUpdate(data: FlowComponent): void {
    this.setData(data);
    this.data.flow.arrows.forEach((arrow) => this.updateArrowPath(arrow));
    this.updateDotVisibility(this.data.oldChildObj());
  }

  private updateArrowPath(arrow: Arrow) {
    const gElement: SVGGElement = this.data.g.nativeElement;
    const childObj = this.data.getChildInfo();
    const [from, to] = arrow.deps;
    const fromItem = childObj[from];
    const toItem = childObj[to];

    if (fromItem && toItem) {
      const [endDotIndex, startDotIndex] = this.getClosestDotsSimplified(
        toItem,
        from,
      );

      const startDot = this.getDotByIndex(
        childObj,
        fromItem.position,
        startDotIndex,
        this.data.flow.scale,
        this.data.flow.panX,
        this.data.flow.panY,
      );
      const endDot = this.getDotByIndex(
        childObj,
        toItem.position,
        endDotIndex,
        this.data.flow.scale,
        this.data.flow.panX,
        this.data.flow.panY,
      );

      // Draw arrow from start (parent) to end (child)
      arrow.d = this.data.flow.arrowFn(
        startDot,
        endDot,
        this.data.flow.config.arrows ? this.data.flow.config.arrowSize : 0,
        2,
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
    if (!this.data.g) {
      return;
    }
    console.log('createArrows');
    // Clear existing arrows
    this.data.flow.arrows = [];
    const gElement: SVGGElement = this.data.g.nativeElement;
    // Remove existing paths
    while (gElement.firstChild) {
      gElement.removeChild(gElement.firstChild);
    }
    // Calculate new arrows - now iterating through parents to connect to children
    this.list.forEach((parent) => {
      parent.position.children.forEach((childId) => {
        const child = this.list.find((c) => c.position.id === childId);
        if (child) {
          const arrow: Arrow = {
            d: `M${parent.position.x},${parent.position.y} L${child.position.x},${child.position.y}`,
            deps: [parent.position.id, child.position.id],
            startDot: 0,
            endDot: 0,
            id: `arrow${parent.position.id}-to-${child.position.id}`,
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
            this.data.config.strokeWidth!.toString(),
          );
          pathElement.setAttribute('fill', 'none');
          if (this.data.config.arrows) {
            pathElement.setAttribute('marker-end', 'url(#arrowhead)');
          }

          // Append path to <g> element
          gElement.appendChild(pathElement);

          this.data.flow.arrows.push(arrow);
        }
      });
    });
  }

  private setData(data: FlowComponent) {
    this.data = data;
    this.list = data.list;
    this.direction = data.flow.config.direction!;
    this.setReverseDepsMap(this.list.map((x) => x.position));
  }

  public getClosestDotsSimplified(
    item: ChildInfo,
    dep: string,
  ): [number, number] {
    const parents = this.data.flow.parents.get(item.position.id) || [];
    const ids = [...item.position.children, ...parents];
    ids.forEach((x) => this.findClosestDot(x, item));
    // ids.forEach((x) => this.findClosestDot(x, item, childObj));
    // Remove duplicates
    // const uniqueClosestDotIndices = Array.from(new Set(closestDotIndices));

    return [
      this.closestDots.get(`${item.position.id}-${dep}`) as number,
      this.closestDots.get(`${dep}-${item.position.id}`) as number,
    ];
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
    // correct the parent based on the children
    if (!parent.position.children.includes(child.position.id)) {
      const _t = child;
      child = parent;
      parent = _t;
      swapped = true;
    }

    const childDirection = this.getDirection(child, parent, isV);

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

  private getDirection(
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
    // Object.keys(childObj).forEach((id) => {
    for (const id in childObj) {
      const child = childObj[id];
      const dots = child.dots.toArray();

      // dots.forEach((dot, index) => {
      for (let index = 0; index < dots.length; index++) {
        const dot = dots[index];
        // Check if the current dot is the closest for any dependency
        const isClosestForAnyDep = Array.from(this.closestDots.keys()).some(
          (key) => key.startsWith(id) && this.closestDots.get(key) === index,
        );

        dot.nativeElement.style.visibility = isClosestForAnyDep
          ? 'visible'
          : 'hidden';
      }
    }
  }

  private getDotByIndex(
    childObj: Record<string, ChildInfo>,
    item: FlowOptions,
    dotIndex: number,
    scale: number,
    panX: number,
    panY: number,
  ): DotOptions {
    const child = childObj[item.id];
    const childDots = child.dots as DOMRect[];
    // Make sure the dot index is within bounds
    if (dotIndex < 0 || dotIndex >= childDots.length) {
      throw new Error(`Invalid dot index: ${dotIndex}`);
    }

    const rect = childDots[dotIndex];
    const { left, top } = this.data.flow.zRect;
    const x = (rect.x + rect.width / 2 - panX - left) / scale;
    const y = (rect.y + rect.height / 2 - panY - top) / scale;

    return { ...item, x, y, dotIndex };
  }

  private setReverseDepsMap(list: FlowOptions[]) {
    // Build reverse dependency map from children arrays
    list.forEach((parent) => {
      parent.children.forEach((childId) => {
        if (!this.reverseDepsMap.has(childId)) {
          this.reverseDepsMap.set(childId, []);
        }
        this.reverseDepsMap.get(childId)!.push(parent.id);
      });
    });
  }
}
