import { FlowComponent } from '../flow.component';
import { FlowPlugin } from './plugin';

export interface SnapGridOptions {
  size?: number;
  visible?: boolean;
  snapEnabled?: boolean;
  style?: 'dots' | 'lines';
  color?: string;
  opacity?: number;
}

export class SnapGrid implements FlowPlugin {
  private options: Required<SnapGridOptions>;
  private patternId = `grid-pattern-${Math.random().toString(36).substring(2, 11)}`;
  private gridElement?: HTMLDivElement;
  private data!: FlowComponent;

  constructor(options: SnapGridOptions = {}) {
    this.options = {
      size: options.size ?? 20,
      visible: options.visible ?? true,
      snapEnabled: options.snapEnabled ?? true,
      style: options.style ?? 'dots',
      color: options.color ?? '#a0a0a7', // '#e0e0e0',
      opacity: options.opacity ?? 0.5,
    };
  }

  afterInit(data: FlowComponent): void {
    this.data = data;

    // Set grid size in flow service
    if (this.options.snapEnabled) {
      this.data.flow.gridSize = this.options.size;
    }

    // Create visual grid
    if (this.options.visible) {
      this.createGrid();
    }
  }

  afterUpdate(data: FlowComponent): void {
    // Update grid transform to match zoom container
    if (this.gridElement && this.options.visible) {
      const svg = this.gridElement.querySelector('svg');
      if (svg) {
        svg.style.transform = `translate3d(${data.flow.panX}px, ${data.flow.panY}px, 0) scale(${data.flow.scale})`;
        svg.style.transformOrigin = '0 0';
        svg.style.overflow = 'visible';
      }
    }
  }

  beforeDestroy(): void {
    this.removeGrid();
  }

  setSize(size: number): void {
    this.options.size = size;
    if (this.options.snapEnabled) {
      this.data.flow.gridSize = size;
    }
    if (this.options.visible) {
      this.updateGrid();
    }
  }

  setVisible(visible: boolean): void {
    this.options.visible = visible;
    if (visible) {
      this.createGrid();
    } else {
      this.removeGrid();
    }
  }

  setSnapEnabled(enabled: boolean): void {
    this.options.snapEnabled = enabled;
    this.data.flow.gridSize = enabled ? this.options.size : 1;
  }

  setStyle(style: 'dots' | 'lines'): void {
    this.options.style = style;
    if (this.options.visible) {
      this.updateGrid();
    }
  }

  private createGrid(): void {
    if (this.gridElement) return;

    // Create grid container
    this.gridElement = document.createElement('div');
    this.gridElement.className = 'flow-grid-pattern';
    this.gridElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    `;

    // Create SVG pattern
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const pattern = this.createPattern();
    defs.appendChild(pattern);
    svg.appendChild(defs);

    // Create rect that uses the pattern
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', `url(#${this.patternId})`);
    rect.setAttribute('transform', `translate(${-10000}, ${-10000})`);
    rect.setAttribute('width', '20000');
    rect.setAttribute('height', '20000');
    svg.appendChild(rect);

    this.gridElement.appendChild(svg);

    // Insert as first child of zoom container
    const zoomContainer = this.data.zoomContainer.nativeElement;
    zoomContainer.insertBefore(this.gridElement, zoomContainer.firstChild);
  }

  private createPattern(): SVGPatternElement {
    const pattern = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'pattern',
    );
    pattern.setAttribute('id', this.patternId);
    pattern.setAttribute('x', '0');
    pattern.setAttribute('y', '0');
    pattern.setAttribute('width', this.options.size.toString());
    pattern.setAttribute('height', this.options.size.toString());
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    if (this.options.style === 'dots') {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      circle.setAttribute('cx', '1');
      circle.setAttribute('cy', '1');
      circle.setAttribute('r', '1');
      circle.setAttribute('fill', this.options.color);
      circle.setAttribute('opacity', this.options.opacity.toString());
      pattern.appendChild(circle);
    } else {
      // Lines style
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      path.setAttribute(
        'd',
        `M ${this.options.size} 0 L 0 0 0 ${this.options.size}`,
      );
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', this.options.color);
      path.setAttribute('stroke-width', '0.5');
      path.setAttribute('opacity', this.options.opacity.toString());
      pattern.appendChild(path);
    }

    return pattern;
  }

  private updateGrid(): void {
    this.removeGrid();
    this.createGrid();
  }

  private removeGrid(): void {
    if (this.gridElement) {
      this.gridElement.remove();
      this.gridElement = undefined;
    }
  }
}
