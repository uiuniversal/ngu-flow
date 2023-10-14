import { FlowOptions } from './app.component';
import { ChildInfo, Connections } from './connections';

export class Arrangements {
  newList = new Map<string, FlowOptions>();

  direction: 'horizontal' | 'vertical' = 'horizontal';
  horizontalPadding = 100;
  verticalPadding = 100;
  groupPadding = 0;

  constructor(
    private connections: Connections,
    private list: Record<string, ChildInfo>
  ) {
    // console.count('Arrangements');
    const values = structuredClone(Object.values(list).map((x) => x.position));
    this.newList = this.autoArrange();
    // console.log('list', values);
    // console.log('newList values', structuredClone(Object.values(this.newList)));
  }

  public autoArrange(): Map<string, FlowOptions> {
    const levels = this.determineLevels();
    const newItems = new Map<string, FlowOptions>();
    let currentX = 0;

    if (this.direction === 'horizontal') {
      // Start by positioning the base nodes
      const baseNodes = Object.values(this.list).filter(
        (node) => node.position.deps.length === 0
      );

      for (const baseNode of baseNodes) {
        const consumedHeight = this.positionDependents(
          baseNode,
          currentX - baseNode.elRect.width - this.horizontalPadding,
          0,
          newItems
        );
        const centerY = consumedHeight / 2;
        newItems.set(baseNode.position.id, {
          ...baseNode.position,
          x: currentX,
          y: centerY - baseNode.elRect.height / 2,
        });
        currentX +=
          baseNode.elRect.width + this.horizontalPadding + this.groupPadding;
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
    newItems: Map<string, FlowOptions>
  ): number {
    const dependents = Object.values(this.list).filter((child) =>
      child.position.deps.includes(baseNode.position.id)
    );

    // Sort children by their original Y-coordinate to preserve order
    dependents.sort((a, b) => a.position.y - b.position.y);

    let startY = baseY;
    let newX = baseX + baseNode.elRect.width + this.horizontalPadding;
    const height = baseNode.elRect.height;

    for (let i = 0; i < dependents.length; i++) {
      const dependent = dependents[i];
      const consumedHeight = this.positionDependents(
        dependent,
        newX,
        startY,
        newItems
      );
      startY =
        consumedHeight + (i < dependents.length - 1 ? this.verticalPadding : 0);
    }

    const y =
      baseY + (dependents.length ? (startY - baseY) / 2 - height / 2 : 0);

    newItems.set(baseNode.position.id, {
      ...baseNode.position,
      x: newX,
      y: y,
    });
    return startY + (dependents.length ? 0 : height);
  }

  public determineLevels(): Map<string, number> {
    const levels: Map<string, number> = new Map();
    const processed: Set<string> = new Set();

    const determineNodeLevel = (id: string, lvl: number) => {
      if (!levels.has(id) || levels.get(id)! < lvl) {
        levels.set(id, lvl);
      }
      processed.add(id);

      const deps = this.connections.reverseDepsMap.get(id) || [];
      deps.forEach((depId) => {
        if (!processed.has(depId)) {
          determineNodeLevel(depId, lvl + 1);
        }
      });
    };

    for (const [id, node] of Object.entries(this.list)) {
      if (node.position.deps.length === 0) {
        determineNodeLevel(id, 0);
      }
    }
    return levels;
  }
}
