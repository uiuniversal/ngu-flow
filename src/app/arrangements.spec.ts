import { FlowOptions } from './app.component';
import { Arrangements } from './arrangements';
import { ChildInfo, Connections } from './connections';

export const FLOW_LIST = [
  { x: 40, y: 40, id: '1', deps: [] },
  { x: 200, y: 40, id: '2', deps: ['1'] },
  { x: 360, y: 40, id: '3', deps: ['2'] },
  { x: 520, y: 40, id: '4', deps: ['2'] },
  { x: 40, y: 200, id: '5', deps: ['1'] },
  { x: 200, y: 200, id: '6', deps: ['5'] },
  { x: 360, y: 200, id: '7', deps: ['5'] },
  { x: 520, y: 200, id: '8', deps: ['6', '7'] },
];

describe('Arrangements', () => {
  let arrangements: Arrangements;

  it('should be created', () => {
    const list: ChildInfo[] = FLOW_LIST.map((x) => ({
      position: x,
      elRect: {
        x: x.x + 59.796875,
        y: x.y + 75,
        width: 200,
        height: 200,
        top: x.y + 75,
        right: x.x + 209.796875,
        bottom: x.y + 275,
        left: x.x + 59.796875,
        toJSON: () => {},
      },
    }));
    const connections = new Connections(list);
    const childObj: Record<string, ChildInfo> = {
      '1': {
        position: {
          x: 40,
          y: 40,
          id: '1',
          deps: [],
        },
        elRect: {
          x: 99.796875,
          y: 115,
          width: 150,
          height: 200,
          top: 115,
          right: 249.796875,
          bottom: 315,
          left: 99.796875,
          toJSON: () => {},
        },
      },
      '2': {
        position: {
          x: 200,
          y: 40,
          id: '2',
          deps: ['1'],
        },
        elRect: {
          x: 259.796875,
          y: 115,
          width: 150,
          height: 200,
          top: 115,
          right: 409.796875,
          bottom: 315,
          left: 259.796875,
          toJSON: () => {},
        },
      },
      '3': {
        position: {
          x: 360,
          y: 40,
          id: '3',
          deps: ['2'],
        },
        elRect: {
          x: 419.796875,
          y: 115,
          width: 150,
          height: 200,
          top: 115,
          right: 569.796875,
          bottom: 315,
          left: 419.796875,
          toJSON: () => {},
        },
      },
      '4': {
        position: {
          x: 520,
          y: 40,
          id: '4',
          deps: ['2'],
        },
        elRect: {
          x: 579.796875,
          y: 115,
          width: 150,
          height: 200,
          top: 115,
          right: 729.796875,
          bottom: 315,
          left: 579.796875,
          toJSON: () => {},
        },
      },
      '5': {
        position: {
          x: 40,
          y: 200,
          id: '5',
          deps: ['1'],
        },
        elRect: {
          x: 99.796875,
          y: 275,
          width: 150,
          height: 200,
          top: 275,
          right: 249.796875,
          bottom: 475,
          left: 99.796875,
          toJSON: () => {},
        },
      },
      '6': {
        position: {
          x: 200,
          y: 200,
          id: '6',
          deps: ['5'],
        },
        elRect: {
          x: 259.796875,
          y: 275,
          width: 150,
          height: 200,
          top: 275,
          right: 409.796875,
          bottom: 475,
          left: 259.796875,
          toJSON: () => {},
        },
      },
      '7': {
        position: {
          x: 360,
          y: 200,
          id: '7',
          deps: ['5'],
        },
        elRect: {
          x: 419.796875,
          y: 275,
          width: 150,
          height: 200,
          top: 275,
          right: 569.796875,
          bottom: 475,
          left: 419.796875,
          toJSON: () => {},
        },
      },
      '8': {
        position: {
          x: 520,
          y: 200,
          id: '8',
          deps: ['6', '7'],
        },
        elRect: {
          x: 579.796875,
          y: 275,
          width: 150,
          height: 200,
          top: 275,
          right: 729.796875,
          bottom: 475,
          left: 579.796875,
          toJSON: () => {},
        },
      },
    };
    arrangements = new Arrangements(connections, childObj);
    const expected = {
      '1': { x: 0, y: 0, id: '1', deps: [] },
      '2': { x: 250, y: -150, id: '2', deps: ['1'] },
      '3': { x: 500, y: -300, id: '3', deps: ['2'] },
      '4': { x: 500, y: 0, id: '4', deps: ['2'] },
      '5': { x: 250, y: 150, id: '5', deps: ['1'] },
      '6': { x: 500, y: 0, id: '6', deps: ['5'] },
      '7': { x: 500, y: 300, id: '7', deps: ['5'] },
      '8': { x: 750, y: 150, id: '8', deps: ['6', '7'] },
    };
    expect(Object.fromEntries(arrangements.newList)).toEqual(expected);
  });
});
