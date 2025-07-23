import { FlowComponent } from '../flow.component';
import { BasePlugin } from '../adapters/base/base-plugin';
import {
  ScrollIntoViewConfig,
  PluginConfigManager,
} from '../core/config/plugin-config';

export class ScrollIntoView extends BasePlugin {
  private configManager: PluginConfigManager<ScrollIntoViewConfig>;

  constructor(
    private id: string,
    config?: Partial<ScrollIntoViewConfig>,
  ) {
    super();
    this.configManager = new PluginConfigManager<ScrollIntoViewConfig>(
      {
        enabled: true,
        priority: 0,
        animationDuration: 300,
        offset: { x: 0, y: 0 },
      },
      config,
    );
  }

  override afterInit(data: FlowComponent): void {
    this.setData(data);
    if (this.configManager.isEnabled()) {
      this.focus(this.id);
    }
  }

  focus(id: string) {
    const item = this.findNodeById(id);
    if (!item) return;

    const { x, y } = item.position;
    const { width, height } = item.elRect;
    const { scale } = this.getTransform();
    const containerRect = this.getContainerRect();
    const config = this.configManager.getConfig();

    // Calculate new pan values to center the item
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Check if horizontal adjustment is needed
    if (x + scaledWidth > containerRect.width) {
      this.data.flow.panX =
        -x * scale + (containerRect.width - scaledWidth) + config.offset!.x;
    } else if (this.data.flow.panX + x * scale < 0) {
      this.data.flow.panX = -x * scale + config.offset!.x;
    }

    // Center vertically
    this.data.flow.panY =
      -y * scale + (containerRect.height - scaledHeight) / 2 + config.offset!.y;

    this.updateZoomContainer();
  }
}
