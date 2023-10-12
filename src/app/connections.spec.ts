import { FlowOptions } from './app.component';
import { Connections } from './connections';

describe('Connections', () => {
  let connections: Connections;

  it('should calc the closest dot', () => {
    let list: FlowOptions[] = [
      { x: 40, y: 40, id: '1', deps: [] },
      { x: 200, y: 40, id: '2', deps: ['1'] },
    ];
    connections = new Connections(list);

    let childObj = {
      '1': {
        dots: [
          {
            x: 174.796875,
            y: 110,
            width: 10,
            height: 10,
            top: 110,
            right: 184.796875,
            bottom: 120,
            left: 174.796875,
            toJSON: () => {},
          },
          {
            x: 244.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 254.796875,
            bottom: 170,
            left: 244.796875,
            toJSON: () => {},
          },
          {
            x: 174.796875,
            y: 310,
            width: 10,
            height: 10,
            top: 310,
            right: 184.796875,
            bottom: 320,
            left: 174.796875,
            toJSON: () => {},
          },
          {
            x: 94.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 104.796875,
            bottom: 170,
            left: 94.796875,
            toJSON: () => {},
          },
        ],
      },
      '2': {
        dots: [
          {
            x: 334.796875,
            y: 110,
            width: 10,
            height: 10,
            top: 110,
            right: 344.796875,
            bottom: 120,
            left: 334.796875,
            toJSON: () => {},
          },
          {
            x: 404.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 414.796875,
            bottom: 170,
            left: 404.796875,
            toJSON: () => {},
          },
          {
            x: 334.796875,
            y: 310,
            width: 10,
            height: 10,
            top: 310,
            right: 344.796875,
            bottom: 320,
            left: 334.796875,
            toJSON: () => {},
          },
          {
            x: 254.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 264.796875,
            bottom: 170,
            left: 254.796875,
            toJSON: () => {},
          },
        ],
      },
    };

    let val = connections.getClosestDotsSimplified(childObj, list[0], '');
    expect(val).toEqual([1]);

    val = connections.getClosestDotsSimplified(childObj, list[0], '2');
    expect(val).toEqual([1]);

    val = connections.getClosestDotsSimplified(childObj, list[1], '');
    expect(val).toEqual([3]);

    childObj = {
      '1': {
        dots: [
          {
            x: 174.796875,
            y: 110,
            width: 10,
            height: 10,
            top: 110,
            right: 184.796875,
            bottom: 120,
            left: 174.796875,
            toJSON: () => {},
          },
          {
            x: 244.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 254.796875,
            bottom: 170,
            left: 244.796875,
            toJSON: () => {},
          },
          {
            x: 174.796875,
            y: 310,
            width: 10,
            height: 10,
            top: 310,
            right: 184.796875,
            bottom: 320,
            left: 174.796875,
            toJSON: () => {},
          },
          {
            x: 94.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 104.796875,
            bottom: 170,
            left: 94.796875,
            toJSON: () => {},
          },
        ],
      },
      '2': {
        dots: [
          {
            x: 366.796875,
            y: 111,
            width: 10,
            height: 10,
            top: 111,
            right: 376.796875,
            bottom: 121,
            left: 366.796875,
            toJSON: () => {},
          },
          {
            x: 436.796875,
            y: 161,
            width: 10,
            height: 10,
            top: 161,
            right: 446.796875,
            bottom: 171,
            left: 436.796875,
            toJSON: () => {},
          },
          {
            x: 366.796875,
            y: 311,
            width: 10,
            height: 10,
            top: 311,
            right: 376.796875,
            bottom: 321,
            left: 366.796875,
            toJSON: () => {},
          },
          {
            x: 286.796875,
            y: 161,
            width: 10,
            height: 10,
            top: 161,
            right: 296.796875,
            bottom: 171,
            left: 286.796875,
            toJSON: () => {},
          },
        ],
      },
    };

    list = [
      {
        x: 40,
        y: 40,
        id: '1',
        deps: [],
      },
      {
        x: 173.203125,
        y: -33,
        id: '2',
        deps: ['1'],
      },
    ];
    connections = new Connections(list);

    val = connections.getClosestDotsSimplified(childObj, list[0], '2');

    expect(val).toEqual([1]);

    childObj = {
      '1': {
        dots: [
          {
            x: 174.796875,
            y: 110,
            width: 10,
            height: 10,
            top: 110,
            right: 184.796875,
            bottom: 120,
            left: 174.796875,
            toJSON: () => {},
          },
          {
            x: 244.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 254.796875,
            bottom: 170,
            left: 244.796875,
            toJSON: () => {},
          },
          {
            x: 174.796875,
            y: 310,
            width: 10,
            height: 10,
            top: 310,
            right: 184.796875,
            bottom: 320,
            left: 174.796875,
            toJSON: () => {},
          },
          {
            x: 94.796875,
            y: 160,
            width: 10,
            height: 10,
            top: 160,
            right: 104.796875,
            bottom: 170,
            left: 94.796875,
            toJSON: () => {},
          },
        ],
      },
      '2': {
        dots: [
          {
            x: 335.796875,
            y: 112,
            width: 10,
            height: 10,
            top: 112,
            right: 345.796875,
            bottom: 122,
            left: 335.796875,
            toJSON: () => {},
          },
          {
            x: 405.796875,
            y: 162,
            width: 10,
            height: 10,
            top: 162,
            right: 415.796875,
            bottom: 172,
            left: 405.796875,
            toJSON: () => {},
          },
          {
            x: 335.796875,
            y: 312,
            width: 10,
            height: 10,
            top: 312,
            right: 345.796875,
            bottom: 322,
            left: 335.796875,
            toJSON: () => {},
          },
          {
            x: 255.796875,
            y: 162,
            width: 10,
            height: 10,
            top: 162,
            right: 265.796875,
            bottom: 172,
            left: 255.796875,
            toJSON: () => {},
          },
        ],
      },
    };

    list = [
      {
        x: 40,
        y: 40,
        id: '1',
        deps: [],
      },
      {
        x: 142.203125,
        y: -33,
        id: '2',
        deps: ['1'],
      },
    ];

    val = connections.getClosestDotsSimplified(childObj, list[0], '2');
    expect(val).toEqual([1]);
  });
});
