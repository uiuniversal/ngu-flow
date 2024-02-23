import { FlowComponent } from '../flow.component';
import { FlowPlugin } from './plugin';

export class ScrollIntoView implements FlowPlugin {
  private data: FlowComponent;

  constructor(private id: string) {}

  afterInit(data: FlowComponent): void {
    this.data = data;
    this.focus(this.id);
  }

  focus(id: string) {
    const item = this.data.list.find((x) => x.position.id === id);
    if (item) {
      const { x, y } = item.position;
      const { width, height } = item.elRect;
      if (x + width * this.data.flow.scale > this.data.flow.zRect.width) {
        this.data.flow.panX =
          -x * this.data.flow.scale + (this.data.flow.zRect.width - width);
      } else if (
        this.data.flow.panX + x * this.data.flow.scale <
        this.data.flow.zRect.width
      ) {
        this.data.flow.panX = -x * this.data.flow.scale;
      }
      this.data.flow.panY =
        -y * this.data.flow.scale + (this.data.flow.zRect.height - height) / 2;
      this.data.updateZoomContainer();
    }
  }
}
