import { FlowOptions, ChildInfo } from '../flow-interface';
import { Connections } from './connections';
import { Subject, BehaviorSubject } from 'rxjs';

describe('Connections', () => {
  let connections: Connections;

  function t(position: FlowOptions, width = 200, height = 200): ChildInfo {
    return { position, elRect: { width, height } as DOMRect };
  }

  it('should return the proper index _findClosestConnectionPoints', () => {
    let list = [
      t({ x: 0, y: 0, id: '1', children: [] }),
      t({ x: 300, y: 150, id: '5', children: ['1'] }),
    ];

    check(list, [1, 3]);
    list.reverse();
    check(list, [3, 1]);

    list = [
      t({ x: 300, y: -150, id: '2', children: ['1'] }),
      t({ x: 600, y: -300, id: '3', children: ['2'] }),
    ];
    check(list, [1, 3]);

    list = [
      t({ x: 46, y: -470, id: '3', children: ['2'] }),
      t({ x: 300, y: -150, id: '2', children: ['1'] }),
    ];
    check(list, [1, 3]);

    list = [
      t({ x: 300, y: -150, id: '2', children: ['1'] }),
      t({ x: 450, y: -422, id: '3', children: ['2'] }),
    ];
    check(list, [1, 3]);

    function check(list: ChildInfo[], expected: [number, number]) {
      connections = new Connections();
      const mockFlowComponent = {
        list,
        flow: {
          config: { direction: 'horizontal', arrows: true, arrowSize: 20, strokeWidth: 2, plugins: {} },
          startConnection: new Subject(),
          endConnection: new Subject(),
          isDraggingConnection: false,
          connectionDrag: null,
          zoomContainer: document.createElement('div'),
          panX: 0,
          panY: 0,
          scale: 1,
          items: new Map(),
          arrowsChange: new Subject(),
          parents: new Map(),
          isDraggingZoomContainer: false,
          isChildDragging: false,
          enableChildDragging: new BehaviorSubject(true),
          enableZooming: new BehaviorSubject(true),
          gridSize: 1,
          arrows: [],
          layoutUpdated: new Subject(),
          onMouse: new Subject(),
          arrowFn: (() => {}) as any,
          update: (items: FlowOptions[]) => {
            mockFlowComponent.flow.parents.clear();
            items.forEach((item) => {
              item.children.forEach((childId) => {
                let parentList = mockFlowComponent.flow.parents.get(childId);
                if (!parentList) {
                  parentList = [];
                }
                parentList.push(item.id);
                mockFlowComponent.flow.parents.set(childId, parentList);
              });
            });
          },
          get zRect() { return { x: 0, y: 0, width: 1000, height: 1000, top: 0, left: 0, right: 1000, bottom: 1000 }; },
        },
        g: { nativeElement: document.createElementNS('http://www.w3.org/2000/svg', 'g') },
        config: { strokeWidth: 2 },
        children: { toArray: () => [] },
        runPlugin: () => {},
        getChildInfo: () => {},
        oldChildObj: () => {},
      } as any;
      connections.onInit(mockFlowComponent);
      const actual = connections._findClosestConnectionPoints(list[0], list[1]);
      expect(actual).toEqual(expected);
    }
  });

  it('should calc the closest dot', () => {
    let list: ChildInfo[] = [
      t({ x: 0, y: 0, id: '1', children: [] }),
      t({ x: 300, y: 40, id: '2', children: ['1'] }),
    ];

    check(list, 0, '2', [1, 3]);
    check(list, 1, '1', [3, 1]);

    list = [
      t({ x: 40, y: 40, id: '1', children: [] }),
      t({ x: 173.203125, y: -33, id: '2', children: ['1'] }),
    ];
    check(list, 0, '2', [1, 3]);

    list = [
      t({ x: 40, y: 40, id: '1', children: [] }),
      t({ x: 142.203125, y: -33, id: '2', children: ['1'] }),
    ];
    check(list, 0, '2', [1, 3]);

    function check(
      list: ChildInfo[],
      index: number,
      dep: string,
      expected: [number, number]
    ) {
      connections = new Connections();
      const mockFlowComponent = {
        list,
        flow: {
          config: { direction: 'horizontal', arrows: true, arrowSize: 20, strokeWidth: 2, plugins: {} },
          startConnection: new Subject(),
          endConnection: new Subject(),
          isDraggingConnection: false,
          connectionDrag: null,
          zoomContainer: document.createElement('div'),
          panX: 0,
          panY: 0,
          scale: 1,
          items: new Map(),
          arrowsChange: new Subject(),
          parents: new Map(),
          isDraggingZoomContainer: false,
          isChildDragging: false,
          enableChildDragging: new BehaviorSubject(true),
          enableZooming: new BehaviorSubject(true),
          gridSize: 1,
          arrows: [],
          layoutUpdated: new Subject(),
          onMouse: new Subject(),
          arrowFn: (() => {}) as any,
          update: (items: FlowOptions[]) => {
            mockFlowComponent.flow.parents.clear();
            items.forEach((item) => {
              item.children.forEach((childId) => {
                let parentList = mockFlowComponent.flow.parents.get(childId);
                if (!parentList) {
                  parentList = [];
                }
                parentList.push(item.id);
                mockFlowComponent.flow.parents.set(childId, parentList);
              });
            });
          },
          get zRect() { return { x: 0, y: 0, width: 1000, height: 1000, top: 0, left: 0, right: 1000, bottom: 1000 }; },
        },
        g: { nativeElement: document.createElementNS('http://www.w3.org/2000/svg', 'g') },
        config: { strokeWidth: 2 },
        children: { toArray: () => [] },
        runPlugin: () => {},
        getChildInfo: () => {},
        oldChildObj: () => {},
      } as any;
      connections.onInit(mockFlowComponent);
      mockFlowComponent.flow.update(list.map((c) => c.position));
      const actual = connections.getClosestDotsSimplified(list[index], dep);
      expect(actual).toEqual(expected);
    }
  });
});
