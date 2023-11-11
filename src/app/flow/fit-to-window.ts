import { ChildInfo } from './connections';

export class FitToWindow {
  cRect: CPosition;
  containerPadding = 0;

  constructor(
    private list: ChildInfo[],
    private containerRect: DOMRect,
    private scale: number,
    private panX: number,
    private panY: number
  ) {
    const tt = { list, containerRect, scale, panX, panY };
    this.containerPadding = 30 / this.scale;
    this.cRect = {
      x: this.containerRect.x / this.scale - this.panX,
      y: this.containerRect.y / this.scale - this.panY,
      width: this.containerRect.width / this.scale,
      height: this.containerRect.height / this.scale,
    };
  }

  fitToWindow() {
    const positions = this.getPositions();
    const { minX, maxX, minY, maxY } = this.getBoundaries(positions);
    const adjMaxX = maxX - minX + this.containerPadding;
    const adjMaxY = maxY - minY + this.containerPadding;
    const newScale = this.getNewScale(adjMaxX, adjMaxY);
    const { panX, panY } = this.getPanValues(
      adjMaxX,
      adjMaxY,
      newScale,
      minX,
      minY
    );
    return { scale: newScale, panX, panY };
  }

  getPositions() {
    return this.list.map((child) => {
      const scaledX = child.elRect.x / this.scale - this.panX;
      const scaledY = child.elRect.y / this.scale - this.panY;
      const scaledWidth = child.elRect.width;
      const scaledHeight = child.elRect.height;
      return {
        x: scaledX,
        y: scaledY,
        width: scaledWidth,
        height: scaledHeight,
      };
    });
  }

  getBoundaries(positions: CPosition[]) {
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x + p.width));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y + p.height));
    return { minX, maxX, minY, maxY };
  }

  getNewScale(adjMaxX: number, adjMaxY: number) {
    const scaleX = this.cRect.width / adjMaxX;
    const scaleY = this.cRect.height / adjMaxY;
    return Math.min(scaleX, scaleY);
  }

  //   getPanValues(
  //     adjMaxX: number,
  //     adjMaxY: number,
  //     newScale: number,
  //     minX: number,
  //     minY: number
  //   ) {
  //     const panX =
  //       this.cRect.x +
  //       (this.cRect.width - (adjMaxX - this.containerPadding) * newScale) / 2 -
  //       minX * newScale;
  //     const panY =
  //       this.cRect.y +
  //       (this.cRect.height - (adjMaxY - this.containerPadding) * newScale) / 2 -
  //       minY * newScale;
  //     return { panX, panY };
  //   }
  // }
  getPanValues(
    adjMaxX: number,
    adjMaxY: number,
    newScale: number,
    minX: number,
    minY: number
  ) {
    // Calculate the center point of the scaled content
    const scaledContentWidth = adjMaxX * newScale;
    const scaledContentHeight = adjMaxY * newScale;

    // Calculate the center point of the container
    const containerCenterX = this.cRect.width / 2;
    const containerCenterY = this.cRect.height / 2;

    // Calculate the difference between the container center and the content center
    const offsetX =
      containerCenterX - (scaledContentWidth / 2 + minX * newScale);
    const offsetY =
      containerCenterY - (scaledContentHeight / 2 + minY * newScale);

    // Adjust pan values to center the content
    const nPad = (this.containerPadding * newScale) / 2;
    const panX = this.cRect.x * newScale + offsetX + nPad;
    const panY = this.cRect.y * newScale + offsetY + nPad;

    return { panX, panY };
  }
}

interface CPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}
