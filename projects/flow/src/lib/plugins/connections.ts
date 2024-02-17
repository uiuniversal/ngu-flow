import {
  ChildInfo,
  DotOptions,
  FlowOptions,
  FlowPlugin,
} from '../flow-interface';
import { FlowChildComponent } from '../flow-child.component';
import { FlowComponent } from '../flow.component';

export class Connections implements FlowPlugin {
  // key = id of the item
  // value = ids of the items that depend on it
  reverseDepsMap = new Map<string, string[]>();

  // key = id of the item
  // value = index of the closest dot
  closestDots = new Map<string, number>();

  data: FlowComponent;
  private list: ChildInfo[];
  private direction: 'horizontal' | 'vertical' = 'horizontal';

  onInit(data: FlowComponent): void {
    this.setData(data);
  }

  afterUpdate(data: FlowComponent): void {
    this.setData(data);

    const gElement: SVGGElement = this.data.g.nativeElement;
    const childObj = this.data.getChildInfo();
    // Calculate new arrows
    this.data.flow.arrows.forEach((arrow) => {
      const [from, to] = arrow.deps;
      const fromItem = childObj[from];
      const toItem = childObj[to];
      if (fromItem && toItem) {
        const [endDotIndex, startDotIndex] = this.getClosestDotsSimplified(
          toItem,
          from
        );

        const startDot = this.getDotByIndex(
          childObj,
          fromItem.position,
          startDotIndex,
          this.data.flow.scale,
          this.data.flow.panX,
          this.data.flow.panY
        );
        const endDot = this.getDotByIndex(
          childObj,
          toItem.position,
          endDotIndex,
          this.data.flow.scale,
          this.data.flow.panX,
          this.data.flow.panY
        );

        // we need to reverse the path because the arrow head is at the end
        arrow.d = this.data.flow.arrowFn(
          endDot,
          startDot,
          this.data.flow.config.ArrowSize,
          2
        );
      }

      // Update the SVG paths
      this.data.flow.arrows.forEach((arrow) => {
        const pathElement = gElement.querySelector(
          `#${arrow.id}`
        ) as SVGPathElement;
        if (pathElement) {
          pathElement.setAttribute('d', arrow.d);
        }
      });
    });

    this.updateDotVisibility(this.data.oldChildObj());
  }

  private setData(data: FlowComponent) {
    this.data = data;
    this.list = data.list;
    this.direction = data.flow.direction;
    this.setReverseDepsMap(this.list.map((x) => x.position));
  }

  public getClosestDotsSimplified(
    item: ChildInfo,
    dep: string
  ): [number, number] {
    const ids = [
      ...item.position.deps,
      ...(this.reverseDepsMap.get(item.position.id) || []),
    ];
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
    item: ChildInfo
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
    child: ChildInfo
  ): [number, number] {
    // sides dot index order: [top, right, bottom, left]
    const thresholdDistance = 10; // Example distance threshold. Adjust as needed.
    let swapped = false;
    const isV = this.direction === 'vertical';
    // correct the parent based on the deps
    if (!child.position.deps.includes(parent.position.id)) {
      const _t = child;
      child = parent;
      parent = _t;
      swapped = true;
    }

    const childDirection: 'right' | 'left' | 'bottom' | 'top' = (() => {
      // consider width and height of the child
      const { width, height } = child.elRect;
      const { x, y } = child.position;
      const { x: px, y: py } = parent.position;

      if (!isV) {
        if (x + width < px) return 'left';
        if (x - width > px) return 'right';
        if (y + height < py) return 'top';
        if (y - height > py) return 'bottom';
      } else {
        if (y + height < py) return 'top';
        if (y - height > py) return 'bottom';
        if (x + width < px) return 'left';
        if (x - width > px) return 'right';
      }
      return 'right';
    })();

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

    // console.log(
    //   `parentIndex ${parent.position.id}-${child.position.id}:`,
    //   `${parent.position.id}-${parentIndex}`,
    //   `${child.position.id}-${childIndex}`,
    //   [structuredClone(parent), structuredClone(child)]
    // );

    return swapped ? [childIndex, parentIndex] : [parentIndex, childIndex];
  }

  private updateDotVisibility(childObj: Record<string, FlowChildComponent>) {
    Object.keys(childObj).forEach((id) => {
      const child = childObj[id];
      const position = child.position;
      const dots = child.dots.toArray();

      dots.forEach((dot, index) => {
        // Check if the current dot is the closest for any dependency
        const isClosestForAnyDep = Array.from(this.closestDots.keys()).some(
          (key) => key.startsWith(id) && this.closestDots.get(key) === index
        );

        dot.nativeElement.style.visibility = isClosestForAnyDep
          ? 'visible'
          : 'hidden';
        // dot.nativeElement.style.visibility = 'hidden';
      });
    });
  }

  private getDotByIndex(
    childObj: Record<string, ChildInfo>,
    item: FlowOptions,
    dotIndex: number,
    scale: number,
    panX: number,
    panY: number
  ): DotOptions {
    const child = childObj[item.id];
    const childDots = child.dots as DOMRect[];
    // Make sure the dot index is within bounds
    if (dotIndex < 0 || dotIndex >= childDots.length) {
      throw new Error(`Invalid dot index: ${dotIndex}`);
    }

    const rect = childDots[dotIndex];
    const { left, top } = this.data.flow.zRect;
    // const rect = dotEl.nativeElement.getBoundingClientRect();
    const x = (rect.x + rect.width / 2 - panX - left) / scale;
    const y = (rect.y + rect.height / 2 - panY - top) / scale;

    return { ...item, x, y, dotIndex };
  }

  private setReverseDepsMap(list: FlowOptions[]) {
    list.forEach((item) => {
      item.deps.forEach((depId) => {
        if (!this.reverseDepsMap.has(depId)) {
          this.reverseDepsMap.set(depId, []);
        }
        this.reverseDepsMap.get(depId)!.push(item.id);
      });
    });
  }
}
