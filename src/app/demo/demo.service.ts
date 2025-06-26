import { Injectable } from '@angular/core';
import { FlowComponent, FlowOptions } from '@ngu/flow';

@Injectable({ providedIn: 'root' })
export class DemoService {
  flow: FlowComponent;

  constructor() {}

  addNode(item: FlowOptions, list: FlowOptions[]) {
    // find the highest id
    const lastId = list.reduce((acc, cur) => Math.max(+cur.id, acc), 0);
    const newNodeId = (lastId + 1).toString();
    const newNode: FlowOptions = {
      x: 40 + list.length * 160,
      y: 40,
      id: newNodeId,
      children: [item.id],
    };
    list.push(newNode);
  }

  deleteNodeI(id: string, list: FlowOptions[]) {
    let removeId = [id];
    if (id && list.length > 0) {
      return list.reduce((acc, item) => {
        const initialLength = item.children.length;
        item.children = item.children.filter((dep) => !removeId.includes(dep));
        if (initialLength > 0 && item.children.length === 0) {
          removeId.push(item.id);
        } else if (
          !removeId.includes(item.id) &&
          (item.children.length === initialLength || item.children.length > 0)
        )
          acc.push(item);
        return acc;
      }, [] as FlowOptions[]);
    }
    return list;
  }
}
