import { ChildInfo } from '../flow-interface';
import { FlowComponent } from '../flow.component';
import { FlowPlugin } from './plugin';

export class FitToWindow implements FlowPlugin {
  private cRect: CPosition;
  private containerPadding = 0;
  private data: FlowComponent;

  private list: ChildInfo[];
  private containerRect: DOMRect;
  private scale: number;
  private panX: number;
  private panY: number;

  constructor(private init = false) {}

  onInit(data: FlowComponent): void {
    this.data = data;
  }

  afterInit(data: FlowComponent): void {
    this.data = data;
    if (this.init) {
      this.fitToWindow();
    }
  }

  fitToWindow() {
    this.run(
      this.data.list,
      this.data.zoomContainer.nativeElement.getBoundingClientRect(),
      this.data.flow.scale,
      this.data.flow.panX,
      this.data.flow.panY
    );
  }

  run(
    list: ChildInfo[],
    cRect: DOMRect,
    scale: number,
    panX: number,
    panY: number
  ) {
    this.list = list;
    this.containerRect = cRect;
    this.scale = scale;
    this.panX = panX;
    this.panY = panY;
    this._fitToWindowInternal();
  }

  private _fitToWindowInternal() {
    this.containerPadding = 30 / this.scale;
    this.cRect = {
      x: this.containerRect.x / this.scale - this.panX,
      y: this.containerRect.y / this.scale - this.panY,
      width: this.containerRect.width / this.scale,
      height: this.containerRect.height / this.scale,
    };
    const { scale, panX, panY } = this._updateValue();
    this.data.flow.scale = scale;
    this.data.flow.panX = panX;
    this.data.flow.panY = panY;
    this.data.updateZoomContainer();
  }

  _updateValue() {
    const positions = this._getPositions();
    const { minX, maxX, minY, maxY } = this._getBoundaries(positions);
    const adjMaxX = maxX - minX + this.containerPadding;
    const adjMaxY = maxY - minY + this.containerPadding;
    const newScale = this._getNewScale(adjMaxX, adjMaxY);
    const { panX, panY } = this._getPanValues(
      adjMaxX,
      adjMaxY,
      newScale,
      minX,
      minY
    );
    return { scale: newScale, panX, panY };
  }

  _getPositions() {
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

  _getBoundaries(positions: CPosition[]) {
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x + p.width));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y + p.height));
    return { minX, maxX, minY, maxY };
  }

  _getNewScale(adjMaxX: number, adjMaxY: number) {
    const scaleX = this.cRect.width / adjMaxX;
    const scaleY = this.cRect.height / adjMaxY;
    return Math.min(scaleX, scaleY);
  }

  _getPanValues(
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
