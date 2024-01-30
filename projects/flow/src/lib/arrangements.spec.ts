import { Arrangements, Arrangements2 } from './arrangements';
import { ChildInfo } from './flow-interface';

export const FLOW_LIST = [
  { x: 40, y: 40, id: '1', deps: [] },
  { x: 200, y: 40, id: '2', deps: ['1'] },
  { x: 360, y: 40, id: '3', deps: ['2'] },
  { x: 520, y: 40, id: '4', deps: ['2'] },
  { x: 40, y: 200, id: '5', deps: ['1'] },
  { x: 200, y: 200, id: '6', deps: ['5'] },
  { x: 360, y: 200, id: '7', deps: ['5'] },
  { x: 600, y: 760, id: '8', deps: ['6', '7'] },
];

describe('Arrangements', () => {
  let arrangements: Arrangements;

  it('should be created', () => {
    const childObj: ChildInfo[] = FLOW_LIST.map((x) => ({
      position: x,
      elRect: { width: 200, height: 200 } as any,
    }));

    arrangements = new Arrangements(childObj);
    arrangements.verticalPadding = 20;
    arrangements.groupPadding = 100;
    const expected = {
      '1': { x: 0, y: 370, id: '1', deps: [] },
      '2': { x: 300, y: 110, id: '2', deps: ['1'] },
      '3': { x: 600, y: 0, id: '3', deps: ['2'] },
      '4': { x: 600, y: 220, id: '4', deps: ['2'] },
      '5': { x: 300, y: 630, id: '5', deps: ['1'] },
      '6': { x: 600, y: 520, id: '6', deps: ['5'] },
      '7': { x: 600, y: 740, id: '7', deps: ['5'] },
      '8': { x: 900, y: 550, id: '8', deps: ['6', '7'] },
    };
    const actual = Object.fromEntries(arrangements.autoArrange());
    expect(actual).toEqual(expected);
  });
});

describe('Arrangements2', () => {
  let arrangements: Arrangements2;

  it('should be created', () => {
    const childObj: ChildInfo[] = FLOW_LIST.map((x) => ({
      position: x,
      elRect: { width: 200, height: 200 } as any,
    }));

    arrangements = new Arrangements2(childObj);
    arrangements.verticalPadding = 20;
    arrangements.groupPadding = 100;
    const expected = {
      '1': { x: 330, y: 0, id: '1', deps: [] },
      '2': { x: 110, y: 300, id: '2', deps: ['1'] },
      '3': { x: 0, y: 600, id: '3', deps: ['2'] },
      '4': { x: 220, y: 600, id: '4', deps: ['2'] },
      '5': { x: 550, y: 300, id: '5', deps: ['1'] },
      '6': { x: 440, y: 600, id: '6', deps: ['5'] },
      '7': { x: 660, y: 600, id: '7', deps: ['5'] },
      '8': { x: 660, y: 900, id: '8', deps: ['6', '7'] },
    };
    const actual = Object.fromEntries(arrangements.autoArrange());
    expect(actual).toEqual(expected);
  });
});
