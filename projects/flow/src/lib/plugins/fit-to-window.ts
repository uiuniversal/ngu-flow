import { ChildInfo } from '../flow-interface';
import { FlowComponent } from '../flow.component';
import { BasePlugin } from '../adapters/base/base-plugin';
import { GeometryUtils } from '../core/utils/geometry-utils';
import {
  FitToWindowConfig,
  PluginConfigManager,
} from '../core/config/plugin-config';

export class FitToWindow extends BasePlugin {
  private containerPadding = 0;
  private configManager: PluginConfigManager<FitToWindowConfig>;
  private originalContainerSize!: { width: number; height: number };
  private hasInitialFit = false;

  constructor(init = false, config?: Partial<FitToWindowConfig>) {
    super();
    this.configManager = new PluginConfigManager<FitToWindowConfig>(
      {
        enabled: true,
        priority: 0,
        containerPadding: 30,
        maxScale: 1,
        minScale: 0.1,
      },
      { ...config, enabled: init },
    );
  }

  override onInit(data: FlowComponent): void {
    this.setData(data);
  }

  override afterInit(data: FlowComponent): void {
    this.setData(data);
    // Don't fit immediately, wait for afterUpdate when DOM is ready
  }

  override afterUpdate(data: FlowComponent): void {
    this.setData(data);
    if (this.configManager.isEnabled() && !this.hasInitialFit) {
      // Use requestAnimationFrame to ensure DOM measurements are available
      requestAnimationFrame(() => {
        this.fitToWindow();
        this.hasInitialFit = true;
      });
    }
  }

  fitToWindow() {
    if (!this.list?.length) return;

    const transform = this.getTransform();
    this.run(
      this.list,
      this.getContainerRect(),
      transform.scale,
      transform.panX,
      transform.panY,
    );
  }

  run(
    list: ChildInfo[],
    cRect: DOMRect,
    scale: number,
    _panX: number,
    _panY: number,
  ) {
    this.list = list;

    // Store the original container size on first call (when scale = 1)
    if (!this.originalContainerSize || scale === 1) {
      this.originalContainerSize = {
        width: cRect.width,
        height: cRect.height,
      };
    }

    this._fitToWindowInternal();
  }

  private _fitToWindowInternal() {
    const config = this.configManager.getConfig();

    // Use fixed container padding, not scaled
    this.containerPadding = config.containerPadding!;

    const { scale, panX, panY } = this.updateValue();
    const clampedScale = Math.max(
      config.minScale!,
      Math.min(config.maxScale!, scale),
    );

    this.data.flow.scale = clampedScale;
    this.data.flow.panX = panX;
    this.data.flow.panY = panY;
    this.updateZoomContainer();
    this.notifyLayoutUpdated();
  }

  private updateValue() {
    const positions = this._getPositions();
    const { minX, maxX, minY, maxY } = this._getBoundaries(positions);

    // Calculate content size
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Use the original container dimensions, never the scaled ones
    const availableWidth =
      this.originalContainerSize.width - this.containerPadding * 2;
    const availableHeight =
      this.originalContainerSize.height - this.containerPadding * 2;

    const newScale = Math.min(
      availableWidth / contentWidth,
      availableHeight / contentHeight,
      1, // Don't scale up beyond 100%
    );

    console.log('FitToWindow calculations:', {
      currentScale: this.data.flow.scale,
      contentSize: { width: contentWidth, height: contentHeight },
      availableSize: { width: availableWidth, height: availableHeight },
      newScale,
      bounds: { minX, maxX, minY, maxY },
    });

    const { panX, panY } = this._getPanValues(
      contentWidth,
      contentHeight,
      newScale,
      minX,
      minY,
    );
    return { scale: newScale, panX, panY };
  }

  _getPositions() {
    // Get the current scale to unscale the DOM dimensions
    const currentScale = this.data.flow.scale || 1;

    return this.list.map((child) => {
      return {
        x: child.position.x,
        y: child.position.y,
        // Unscale the DOM dimensions to get the original logical dimensions
        width: child.elRect.width / currentScale,
        height: child.elRect.height / currentScale,
      };
    });
  }

  _getBoundaries(
    positions: Array<{ x: number; y: number; width: number; height: number }>,
  ) {
    return GeometryUtils.getBoundaries(positions);
  }

  _getNewScale(contentWidth: number, contentHeight: number) {
    const availableWidth =
      this.originalContainerSize.width - this.containerPadding * 2;
    const availableHeight =
      this.originalContainerSize.height - this.containerPadding * 2;

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    return Math.min(scaleX, scaleY);
  }

  _getPanValues(
    contentWidth: number,
    contentHeight: number,
    newScale: number,
    minX: number,
    minY: number,
  ) {
    // Calculate the center point of the content bounds
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;

    // Use the original container dimensions for centering
    const containerCenterX = this.originalContainerSize.width / 2;
    const containerCenterY = this.originalContainerSize.height / 2;

    // Calculate pan values to center the content in the container
    const panX = containerCenterX - contentCenterX * newScale;
    const panY = containerCenterY - contentCenterY * newScale;

    return { panX, panY };
  }
}
