import {
  FlowOptions,
  ChildInfo,
  FlowDirection,
  FlowPlugin,
} from '../flow-interface';
import { FlowComponent } from '../flow.component';

export class ArrangementsOld {
  constructor(
    private list: ChildInfo[],
    private direction: 'horizontal' | 'vertical' = 'horizontal',
    public horizontalPadding = 100,
    public verticalPadding = 20,
    public groupPadding = 20
  ) {}

  public autoArrange(): Map<string, FlowOptions> {
    const newItems = new Map<string, FlowOptions>();
    let currentX = 0;
    let currentY = 0;

    // Handle both horizontal and vertical directions
    const baseNodes = this.list.filter(
      (node) => node.position.deps.length === 0
    );

    for (const baseNode of baseNodes) {
      if (this.direction === 'horizontal') {
        this.positionDependents(baseNode, 0, currentY, newItems);
        currentY += baseNode.elRect.height + this.verticalPadding;
      } else {
        // Vertical arrangement
        this.positionDependents(baseNode, 0, currentX, newItems);
        currentX += baseNode.elRect.width + this.verticalPadding;
      }
    }

    return newItems;
  }

  private positionDependents(
    baseNode: ChildInfo,
    baseX: number,
    baseY: number,
    newItems: Map<string, FlowOptions>,
    config: { first: boolean; gp: number; maxDepLength: number } = {
      first: true,
      gp: -this.groupPadding * 2,
      maxDepLength: 0,
    }
  ): { consumedSpace: number; dep: boolean } {
    const dependents = this.list.filter((child) =>
      child.position.deps.includes(baseNode.position.id)
    );

    const isV = this.direction === 'vertical';

    let startY = baseY;
    const { width: w, height: h } = baseNode.elRect;
    let newX = baseX + (isV ? h : w) + this.horizontalPadding;
    const height = isV ? w : h;

    const childC: { first: boolean; gp: number; maxDepLength: number } = {
      first: true,
      gp: 0,
      maxDepLength: 0,
    };
    for (let i = 0; i < dependents.length; i++) {
      const depLast = i === dependents.length - 1;
      childC.first = i === 0;
      const dependent = dependents[i];
      const { consumedSpace, dep } = this.positionDependents(
        dependent,
        newX,
        startY,
        newItems,
        childC
      );

      startY = 0;

      if (childC.maxDepLength > 1 && dep && !depLast) {
        startY += this.groupPadding;
        config.gp += this.groupPadding;
      }
      startY += consumedSpace + (!depLast ? this.verticalPadding : 0);
    }

    // baseY += childC.gp;
    config.maxDepLength = Math.max(config.maxDepLength, childC.maxDepLength);

    let y = 0;
    if (dependents.length > 1) {
      // find the first and last dependent and there y position
      const firstDepId = dependents[0].position.id;
      const lastDepId = dependents[dependents.length - 1].position.id;
      const firstDep = newItems.get(firstDepId)!;
      const lastDep = newItems.get(lastDepId)!;
      // find the center of the first and last dependent
      y = (isV ? firstDep.x + lastDep.x : firstDep.y + lastDep.y) / 2;
    } else {
      y = baseY + (dependents.length ? (startY - baseY) / 2 - height / 2 : 0);

      // TODO: This is not working as expected
      // If there are more than one dependency, We need to center the node based on the parents
      if (baseNode.position.deps.length > 1) {
        const len = baseNode.position.deps.length / 2;
        const halfVerticalPadding = (this.verticalPadding * len) / 2;
        y -= baseNode.elRect.height * len - halfVerticalPadding;
      }
    }
    newItems.set(baseNode.position.id, {
      ...baseNode.position,
      x: isV ? y : baseX,
      y: isV ? baseX : y,
    });
    // add groupPadding if there are more than one dependency
    const groupPad =
      dependents.length > 1 ? this.groupPadding - this.verticalPadding : 0;
    const consumedSpace = startY + (dependents.length ? 0 : height) + groupPad;
    return { consumedSpace, dep: dependents.length > 0 };
  }
}

const ROOT_DATA = new Map<string, ArrangeNode>();
const ROOT_DEPS = new Map<string, string[]>();
const HORIZONTAL_PADDING = 100;
const VERTICAL_PADDING = 20;

export class Arrangements implements FlowPlugin {
  root: string[] = [];
  data: FlowComponent;
  private list: ChildInfo[];
  private direction: FlowDirection = 'vertical';
  public horizontalPadding = 100;
  public verticalPadding = 20;
  public groupPadding = 20;

  constructor() {}

  onInit(data: FlowComponent): void {
    this.data = data;
  }

  beforeUpdate(data: FlowComponent): void {
    this.data = data;
    this.runArrange();
  }

  private runArrange() {
    const newList = this._autoArrange();
    this.data.flow.update([...newList.values()]);
    this.data.flow.layoutUpdated.next();
  }

  arrange() {
    this.runArrange();
    this.data.updateArrows();
  }

  public _autoArrange(): Map<string, FlowOptions> {
    this.list = this.data.list;
    this.direction = this.data.flow.direction;
    this.horizontalPadding = this.data.flow.horizontalPadding;
    this.verticalPadding = this.data.flow.verticalPadding;
    this.groupPadding = this.data.flow.groupPadding;

    ROOT_DATA.clear();
    ROOT_DEPS.clear();
    this.list.forEach((item) => {
      ROOT_DATA.set(
        item.position.id,
        new ArrangeNode(item.position, item.elRect)
      );
      item.position.deps.forEach((dep) => {
        let d = ROOT_DEPS.get(dep) || [];
        d.push(item.position.id);
        ROOT_DEPS.set(dep, d);
      });

      if (item.position.deps.length === 0) {
        this.root.push(item.position.id);
      }
    });

    this.root.forEach((id) => {
      const node = ROOT_DATA.get(id)!;
      node.arrange(0, 0, this.direction);
    });

    const newItems = new Map<string, FlowOptions>();

    for (const item of this.list) {
      newItems.set(item.position.id, item.position);
    }
    console.log([...newItems.values()]);
    return newItems;
  }
}

interface Coordinates {
  x: number;
  y: number;
}

export class ArrangeNode {
  constructor(public position: FlowOptions, public elRect: DOMRect) {}

  get deps() {
    return ROOT_DEPS.get(this.position.id) || [];
  }

  // we need to recursively call this method to get all the dependents of the node
  // and then we need to position them
  arrange(x = 0, y = 0, direction: FlowDirection): Coordinates {
    const dependents = ROOT_DEPS.get(this.position.id) || [];
    let startX = x;
    let startY = y;
    let len = dependents.length;

    if (len) {
      if (direction === 'horizontal') {
        startX += this.elRect.width + HORIZONTAL_PADDING;
      } else {
        startY += this.elRect.height + HORIZONTAL_PADDING;
      }
      let first, last: Coordinates;
      for (let i = 0; i < len; i++) {
        const dep = dependents[i];
        const dependent = ROOT_DATA.get(dep)!;
        const { x, y } = dependent.arrange(startX, startY, direction);
        // capture the first and last dependent
        if (i === 0) first = dependent.position;
        if (i === len - 1) last = dependent.position;

        if (direction === 'horizontal') {
          startY = y + VERTICAL_PADDING;
        } else {
          startX = x + VERTICAL_PADDING;
        }
      }
      if (direction === 'horizontal') {
        startY -= VERTICAL_PADDING + this.elRect.height;
        y = first!.y + (last!.y - first!.y) / 2;
      } else {
        startX -= VERTICAL_PADDING + this.elRect.width;
        x = first!.x + (last!.x - first!.x) / 2;
      }
    }
    this.position.x = x;
    this.position.y = y;

    return direction === 'horizontal'
      ? { x: startX, y: startY + this.elRect.height }
      : { x: startX + this.elRect.width, y: startY };
  }
}
