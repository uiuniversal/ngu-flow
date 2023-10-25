import { FlowOptions } from './flow-interface';
import { ChildInfo } from './connections';

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

    if (this.direction === 'horizontal') {
      // Start by positioning the base nodes
      const baseNodes = this.list.filter(
        (node) => node.position.deps.length === 0
      );

      let level = 0;

      for (const baseNode of baseNodes) {
        const consumedHeight = this.positionDependents(
          baseNode,
          0,
          0,
          newItems
        );
        // const centerY = consumedHeight / 2;
        // newItems.set(baseNode.position.id, {
        //   ...baseNode.position,
        //   x: currentX,
        //   y: centerY - baseNode.elRect.height / 2,
        // });
        currentX += baseNode.elRect.width + this.horizontalPadding;
      }
    } else {
      // direction === 'vertical'
      // let currentY = 0;
      // for (const level in levelsMap) {
      //   const itemsInLevel = levelsMap[level];
      //   let currentX = 0;
      //   // Sort items within the level by their current x position
      //   itemsInLevel.sort((a, b) => a.position.x - b.position.x);
      //   for (const node of itemsInLevel) {
      //     const newNode: FlowOptions = {
      //       ...node.position,
      //       x: currentX,
      //       y: currentY,
      //     };
      //     currentX += node.elRect.width + this.horizontalPadding;
      //     newItems.set(node.position.id, newNode);
      //   }
      //   const maxHeightItem = itemsInLevel.reduce((max, item) => {
      //     return item.elRect.height > max.elRect.height ? item : max;
      //   }, itemsInLevel[0]);
      //   currentY +=
      //     maxHeightItem.elRect.height +
      //     this.verticalPadding +
      //     this.groupPadding;
      // }
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
  ): { consumedHeight: number; dep: boolean } {
    const dependents = this.list.filter((child) =>
      child.position.deps.includes(baseNode.position.id)
    );

    let startY = baseY;
    let newX = baseX + baseNode.elRect.width + this.horizontalPadding;
    const height = baseNode.elRect.height;

    const childC: { first: boolean; gp: number; maxDepLength: number } = {
      first: true,
      gp: 0,
      maxDepLength: 0,
    };
    for (let i = 0; i < dependents.length; i++) {
      const depLast = i === dependents.length - 1;
      childC.first = i === 0;
      const dependent = dependents[i];
      const { consumedHeight, dep } = this.positionDependents(
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
      startY += consumedHeight + (!depLast ? this.verticalPadding : 0);
    }

    // baseY += childC.gp;
    config.maxDepLength = Math.max(config.maxDepLength, childC.maxDepLength);

    let y = 0;
    if (dependents.length > 1) {
      // find the first and last dependent and there y position
      const firstDep = dependents[0];
      const lastDep = dependents[dependents.length - 1];
      const firstDepY = newItems.get(firstDep.position.id)!.y;
      const lastDepY = newItems.get(lastDep.position.id)!.y;
      // find the center of the first and last dependent
      y = (firstDepY + lastDepY) / 2;
    } else {
      y = baseY + (dependents.length ? (startY - baseY) / 2 - height / 2 : 0);

      // If there are more than one dependency, We need to center the node based on the parents
      if (baseNode.position.deps.length > 1) {
        const len = baseNode.position.deps.length - 1;
        const halfVerticalPadding = (this.verticalPadding * len) / 2;
        y -= baseNode.elRect.height * len - halfVerticalPadding;
      }
    }
    newItems.set(baseNode.position.id, {
      ...baseNode.position,
      x: baseX,
      y: y,
    });
    // add groupPadding if there are more than one dependency
    const groupPad =
      dependents.length > 1 ? this.groupPadding - this.verticalPadding : 0;
    const consumedHeight = startY + (dependents.length ? 0 : height) + groupPad;
    return { consumedHeight, dep: dependents.length > 0 };
  }
}
