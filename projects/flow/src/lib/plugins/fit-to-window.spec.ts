import { FitToWindow } from './fit-to-window';

describe('FitToWindow', () => {
  let fitToWindow: FitToWindow;
  let list: any;
  let containerRect: any;
  let scale;
  let panX;
  let panY;

  beforeEach(() => {
    list = [
      {
        position: { x: 0, y: 207.5, id: '1', deps: [] },
        elRect: {
          x: 121,
          y: 342.5,
          bottom: 737.5,
          left: 121,
          right: 521,
          top: 342.5,
          width: 400,
          height: 395,
        },
        dots: [],
      },
      {
        position: { x: 500, y: 207.5, id: '2', deps: ['1'] },
        elRect: {
          x: 621,
          y: 342.5,
          bottom: 737.5,
          left: 621,
          right: 1021,
          top: 342.5,
          width: 400,
          height: 395,
        },
        dots: [],
      },
      {
        position: { x: 1000, y: 0, id: '3', deps: ['2'] },
        elRect: {
          x: 1121,
          y: 135,
          bottom: 530,
          left: 1121,
          right: 1521,
          top: 135,
          width: 400,
          height: 395,
        },
        dots: [],
      },
      {
        position: { x: 1000, y: 415, id: '4', deps: ['2'] },
        elRect: {
          x: 1121,
          y: 550,
          bottom: 945,
          left: 1121,
          right: 1521,
          top: 550,
          width: 400,
          height: 395,
        },
        dots: [],
      },
    ];
    containerRect = {
      bottom: 696,
      height: 628,
      left: 61,
      right: 1139,
      top: 68,
      width: 1078,
      x: 61,
      y: 68,
    };
    scale = 1;
    panX = 0;
    panY = 0;
    fitToWindow = new FitToWindow();
    fitToWindow.onInit({
      list,
      zoomContainer: {
        nativeElement: { getBoundingClientRect: () => containerRect },
      },
      flow: {
        scale,
        panX,
        panY,
        zRect: containerRect,
      },
      updateZoomContainer: () => {},
    } as any);
    fitToWindow.run(list, containerRect, scale, panX, panY);
  });

  it('should return positions', () => {
    const positions = fitToWindow._getPositions();
    expect(positions).toEqual([
      { x: 121, y: 342.5, width: 400, height: 395 },
      { x: 621, y: 342.5, width: 400, height: 395 },
      { x: 1121, y: 135, width: 400, height: 395 },
      { x: 1121, y: 550, width: 400, height: 395 },
    ]);
  });

  it('should return boundaries', () => {
    const positions = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 100, width: 100, height: 100 },
    ];
    const { minX, maxX, minY, maxY } = fitToWindow._getBoundaries(positions);
    expect(minX).toBe(0);
    expect(maxX).toBe(200);
    expect(minY).toBe(0);
    expect(maxY).toBe(200);
  });

  it('should return new scale', () => {
    const newScale = fitToWindow._getNewScale(100, 100);
    expect(newScale).toBe(6.28);
  });

  it('should return pan values', () => {
    const { panX, panY } = fitToWindow._getPanValues(
      1430,
      840,
      0.7476,
      121,
      135
    );
    expect(panX).toBe(-29.176000000000016);
    expect(panY).toBe(-38.867200000000004);
  });

  it('should return pan and scale values', () => {
    const { scale, panX, panY } = fitToWindow._updateValue();
    expect(scale).toBe(0.7476190476190476);
    expect(panX).toBe(-29.19047619047616);
    expect(panY).toBe(-38.876190476190494);
  });
});
