import { FlowOptions, ChildInfo, FlowDirection } from '../flow-interface';
import { FlowComponent } from '../flow.component';
import { FlowPlugin } from './plugin';

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
    for (const item of this.list) {
      ROOT_DATA.set(
        item.position.id,
        new ArrangeNode(item.position, item.elRect),
      );
      item.position.deps.forEach((dep) => {
        let d = ROOT_DEPS.get(dep) || [];
        d.push(item.position.id);
        ROOT_DEPS.set(dep, d);
      });

      if (item.position.deps.length === 0) {
        this.root.push(item.position.id);
      }
    }

    for (const id of this.root) {
      const node = ROOT_DATA.get(id)!;
      node.arrange(0, 0, this.direction);
    }

    const newItems = new Map<string, FlowOptions>();

    for (const item of this.list) {
      newItems.set(item.position.id, item.position);
    }
    return newItems;
  }
}

interface Coordinates {
  x: number;
  y: number;
}

export class ArrangeNode {
  constructor(
    public position: FlowOptions,
    public elRect: DOMRect,
  ) {}

  get deps() {
    return ROOT_DEPS.get(this.position.id) || [];
  }

  // we need to recursively call this method to get all the dependents of the node
  // and then we need to position them
  arrange(sx: number, sy: number, direction: FlowDirection): Coordinates {
    const dependents = ROOT_DEPS.get(this.position.id) || [];
    let startX = sx;
    let startY = sy;
    let len = dependents.length;

    if (len) {
      if (direction === 'horizontal') {
        startX += this.elRect.width + HORIZONTAL_PADDING;
      } else {
        startY += this.elRect.height + HORIZONTAL_PADDING;
      }
      let first: Coordinates = { x: 0, y: 0 };
      let last: Coordinates = { x: 0, y: 0 };
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
        sy = first.y + (last.y - first.y) / 2;
      } else {
        startX -= VERTICAL_PADDING + this.elRect.width;
        sx = first.x + (last.x - first.x) / 2;
      }
    }
    this.position.x = sx;
    this.position.y = sy;

    return direction === 'horizontal'
      ? { x: startX, y: startY + this.elRect.height }
      : { x: startX + this.elRect.width, y: startY };
  }
}
