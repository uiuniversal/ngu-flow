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
  // { x: 520, y: 200, id: '8', deps: ['6', '7'] },
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
    const childObj: Record<string, any> = {
      '1': {
        position: { x: 40, y: 40, id: '1', deps: [] },
        elRect: { width: 200, height: 200 },
      },
      '2': {
        position: { x: 200, y: 40, id: '2', deps: ['1'] },
        elRect: { width: 200, height: 200 },
      },
      '3': {
        position: { x: 360, y: 40, id: '3', deps: ['2'] },
        elRect: { width: 200, height: 200 },
      },
      '4': {
        position: { x: 520, y: 40, id: '4', deps: ['2'] },
        elRect: { width: 200, height: 200 },
      },
      '5': {
        position: { x: 40, y: 200, id: '5', deps: ['1'] },
        elRect: { width: 200, height: 200 },
      },
      '6': {
        position: { x: 200, y: 200, id: '6', deps: ['5'] },
        elRect: { width: 200, height: 200 },
      },
      '7': {
        position: { x: 360, y: 200, id: '7', deps: ['5'] },
        elRect: { width: 200, height: 200 },
      },
      // '8': {
      //   position: { x: 520, y: 200, id: '8', deps: ['6', '7'] },
      //   elRect: { width: 150, height: 200 },
      // },
    };
    arrangements = new Arrangements(connections, childObj as any);
    const expected = {
      '1': { x: 0, y: 450, id: '1', deps: [] },
      '2': { x: 300, y: 150, id: '2', deps: ['1'] },
      '3': { x: 600, y: 0, id: '3', deps: ['2'] },
      '4': { x: 600, y: 300, id: '4', deps: ['2'] },
      '5': { x: 300, y: 750, id: '5', deps: ['1'] },
      '6': { x: 600, y: 600, id: '6', deps: ['5'] },
      '7': { x: 600, y: 900, id: '7', deps: ['5'] },
    };
    expect(Object.fromEntries(arrangements.newList)).toEqual(expected);
  });
});
