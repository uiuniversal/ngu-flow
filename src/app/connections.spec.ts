import { FlowOptions } from './app.component';
import { ChildInfo, Connections } from './connections';

describe('Connections', () => {
  let connections: Connections;

  function t(position: FlowOptions, width = 200, height = 200): ChildInfo {
    return { position, elRect: { width, height } as DOMRect };
  }

  it('should return the proper index _findClosestConnectionPoints', () => {
    let list = [
      t({ x: 0, y: 0, id: '1', deps: [] }),
      t({ x: 300, y: 150, id: '5', deps: ['1'] }),
    ];

    check(list, [1, 3]);
    check(list.reverse(), [3, 1]);

    list = [
      t({ x: 300, y: -150, id: '2', deps: ['1'] }),
      t({ x: 600, y: -300, id: '3', deps: ['2'] }),
    ];
    check(list, [1, 3]);

    list = [
      t({ x: 46, y: -470, id: '3', deps: ['2'] }),
      t({ x: 300, y: -150, id: '2', deps: ['1'] }),
    ];
    check(list, [1, 3]);

    list = [
      t({ x: 300, y: -150, id: '2', deps: ['1'] }),
      t({ x: 450, y: -422, id: '3', deps: ['2'] }),
    ];
    check(list, [0, 2]);

    function check(list: ChildInfo[], expected: [number, number]) {
      connections = new Connections(list);
      const actual = connections._findClosestConnectionPoints(list[0], list[1]);
      expect(actual).toEqual(expected);
    }
  });

  it('should calc the closest dot', () => {
    let list: ChildInfo[] = [
      t({ x: 0, y: 0, id: '1', deps: [] }),
      t({ x: 300, y: 40, id: '2', deps: ['1'] }),
    ];

    check(list, 0, '2', [1, 3]);
    // connections = new Connections(list);
    // let actual = connections.getClosestDotsSimplified(list[0], '2');
    // expect(actual).toEqual([1, 3]);
    check(list, 1, '1', [3, 1]);
    // actual = connections.getClosestDotsSimplified(list[1], '1');
    // expect(actual).toEqual([3, 1]);

    list = [
      t({ x: 40, y: 40, id: '1', deps: [] }),
      t({ x: 173.203125, y: -33, id: '2', deps: ['1'] }),
    ];
    check(list, 0, '2', [1, 3]);
    // connections = new Connections(list);
    // actual = connections.getClosestDotsSimplified(list[0], '2');
    // expect(actual).toEqual([1, 3]);

    list = [
      t({ x: 40, y: 40, id: '1', deps: [] }),
      t({ x: 142.203125, y: -33, id: '2', deps: ['1'] }),
    ];
    check(list, 0, '2', [1, 3]);

    // actual = connections.getClosestDotsSimplified(list[0], '2');
    // expect(actual).toEqual([1, 3]);

    function check(
      list: ChildInfo[],
      index: number,
      dep: string,
      expected: [number, number]
    ) {
      connections = new Connections(list);
      const actual = connections.getClosestDotsSimplified(list[index], dep);
      expect(actual).toEqual(expected);
    }
  });
});
