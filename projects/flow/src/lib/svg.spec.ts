import { bezierPath } from './svg';

describe('SvgHandler', () => {
  it('should calc the path', () => {
    const val = bezierPath(
      { x: 0, y: 0, id: '1', deps: [], dotIndex: 0 },
      { x: 10, y: 10, id: '2', deps: [], dotIndex: 0 },
      10,
      2
    );
    expect(val).toEqual('M0 0 C5 1.1785113019775793 5 8.82148869802242 10 10');
  });
});
