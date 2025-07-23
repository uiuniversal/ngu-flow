import { ChildInfo, FlowOptions } from '../flow-interface';
import { Arrangements } from './arrangements';
import { FlowService } from '../flow.service';
import { Subject, BehaviorSubject } from 'rxjs';
import { FlowComponent } from '../flow.component';

export const FLOW_LIST = [
  { x: 40, y: 40, id: '1', children: [] },
  { x: 200, y: 40, id: '2', children: ['1'] },
  { x: 360, y: 40, id: '3', children: ['2'] },
  { x: 520, y: 40, id: '4', children: ['2'] },
  { x: 40, y: 200, id: '5', children: ['1'] },
  { x: 200, y: 200, id: '6', children: ['5'] },
  { x: 360, y: 200, id: '7', children: ['5'] },
  { x: 600, y: 760, id: '8', children: ['6', '7'] },
];

describe('Arrangements', () => {
  let arrangements: Arrangements;

  it('should be created', () => {
    const childObj: ChildInfo[] = FLOW_LIST.map((x) => ({
      position: { ...x, children: x.children || [] },
      elRect: {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        right: 100,
        bottom: 50,
      } as DOMRect,
    }));

    const arrangements = new Arrangements();
    arrangements.onInit({
      list: childObj,
      flow: {
        config: {
          direction: 'horizontal',
          verticalPadding: 10,
          groupPadding: 10,
          arrows: true,
          arrowSize: 20,
          plugins: {},
        },
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
        get zRect() {
          return {
            x: 0,
            y: 0,
            width: 1000,
            height: 1000,
            top: 0,
            left: 0,
            right: 1000,
            bottom: 1000,
          };
        },
        onMouseMove: (() => {}) as any,
        update: (() => {}) as any,
      } as any,
    } as FlowComponent);
    const expected = {
      '1': { x: 650, y: 130, id: '1', children: [] },
      '2': { x: 450, y: 60, id: '2', children: ['1'] },
      '3': { x: 250, y: 25, id: '3', children: ['2'] },
      '4': { x: 250, y: 95, id: '4', children: ['2'] },
      '5': { x: 450, y: 200, id: '5', children: ['1'] },
      '6': { x: 250, y: 165, id: '6', children: ['5'] },
      '7': { x: 250, y: 235, id: '7', children: ['5'] },
      '8': { x: 50, y: 200, id: '8', children: ['6', '7'] },
    };
    const actual = Object.fromEntries(arrangements._autoArrange());
    expect(actual).toEqual(expected);
  });
});
