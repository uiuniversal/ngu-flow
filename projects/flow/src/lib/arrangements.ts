import { FlowOptions, ChildInfo } from './flow-interface';

export class Arrangements {
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
        this.positionDependents(baseNode, currentX, 0, newItems);
        currentX += baseNode.elRect.width + this.horizontalPadding;
      } else {
        // Vertical arrangement
        this.positionDependents(baseNode, 0, currentY, newItems);
        currentY += baseNode.elRect.height + this.horizontalPadding;
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
