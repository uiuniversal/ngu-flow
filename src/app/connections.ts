import { FlowChildComponent, FlowOptions } from './app.component';

export class Connections {
  // key = id of the item
  // value = ids of the items that depend on it
  reverseDepsMap = new Map<string, string[]>();

  // key = id of the item
  // value = index of the closest dot
  closestDots = new Map<string, number>();

  constructor(private list: FlowOptions[]) {
    this.setReverseDepsMap(list);
    console.count('Connections');
  }

  public getClosestDotsSimplified(
    childObj: Record<string, { dots: DOMRect[] }>,
    item: FlowOptions,
    dep: string
  ): number[] {
    const ids = [...item.deps, ...(this.reverseDepsMap.get(item.id) || [])];
    ids.forEach((x) => this.findClosestDot(x, item, childObj));

    // Create unique keys for each dependency and retrieve the closest dots based on these keys
    const closestDotIndices = ids.map((x) => {
      const uniqueKey = `${item.id}-${x}`;
      return this.closestDots.get(uniqueKey) as number;
    });

    // Remove duplicates
    const uniqueClosestDotIndices = Array.from(new Set(closestDotIndices));

    return dep
      ? [this.closestDots.get(`${item.id}-${dep}`) as number]
      : uniqueClosestDotIndices;
  }

  private findClosestDot(
    depId: string,
    item: FlowOptions,
    childObj: Record<string, { dots: DOMRect[] }>
  ) {
    const uniqueKey1 = `${item.id}-${depId}`;
    const uniqueKey2 = `${depId}-${item.id}`;

    if (this.closestDots.has(uniqueKey1)) return;

    const dep = this.list.find((item) => item.id === depId);
    if (dep) {
      const [closestDotIndex1, closestDotIndex2] =
        this.findClosestConnectionPoints(
          childObj[item.id].dots,
          childObj[dep.id].dots
        );

      this.closestDots.set(uniqueKey1, closestDotIndex1);
      this.closestDots.set(uniqueKey2, closestDotIndex2);
    }
  }

  private computeDistance(dot1: DOMRect, dot2: DOMRect): number {
    const dx = dot1.x - dot2.x;
    const dy = dot1.y - dot2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private findClosestConnectionPoints(
    box1Dots: DOMRect[],
    box2Dots: DOMRect[]
  ): [number, number] {
    let minDistance = Number.MAX_VALUE;
    let indices: [number, number] = [0, 0];
    for (let i = 0; i < box1Dots.length; i++) {
      for (let j = 0; j < box2Dots.length; j++) {
        const distance = this.computeDistance(box1Dots[i], box2Dots[j]);
        if (distance < minDistance) {
          minDistance = distance;
          indices = [i, j];
        }
      }
    }
    return indices;
  }

  updateDotVisibility(childObj: Record<string, FlowChildComponent>) {
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
      });
    });
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

export interface ChildInfo {
  dots: DOMRect[];
  position: FlowOptions;
  el?: HTMLElement;
}
