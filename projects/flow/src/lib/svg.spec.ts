import { SvgHandler } from './svg';

describe('SvgHandler', () => {
  it('should calc the path', () => {
    const val = new SvgHandler().bezierPath(
      { x: 0, y: 0, id: '1', deps: [] },
      { x: 10, y: 10, id: '2', deps: [] }
    );
    expect(val).toEqual('M0 0 C5 1.1785113019775793 5 8.82148869802242 10 10');
  });
});
