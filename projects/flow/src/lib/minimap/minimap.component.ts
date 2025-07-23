import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowComponent } from '../flow.component';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'flow-minimap',
  template: `
    <div class="minimap-container">
      <svg #minimapSvg class="minimap-svg">
        <g #minimapG></g>
        <rect #viewportRect class="minimap-viewport"></rect>
      </svg>
    </div>
  `,
  styles: [
    `
      .minimap-container {
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 200px;
        height: 150px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #333;
        overflow: hidden;
        z-index: 100;
      }
      .minimap-svg {
        width: 100%;
        height: 100%;
      }
      .minimap-node {
        fill: #555;
        stroke: #888;
        stroke-width: 1;
      }
      .minimap-connection {
        stroke: #888;
        stroke-width: 0.5;
        fill: none;
      }
      .minimap-viewport {
        fill: rgba(0, 120, 215, 0.3);
        stroke: #0078d7;
        stroke-width: 1;
        cursor: grab;
      }
    `,
  ],
})
export class MinimapComponent implements AfterViewInit, OnDestroy {
  private ngZone = inject(NgZone);
  readonly flowComponent = inject(FlowComponent);

  @ViewChild('minimapSvg') minimapSvg!: ElementRef<SVGSVGElement>;
  @ViewChild('minimapG') minimapG!: ElementRef<SVGGElement>;
  @ViewChild('viewportRect') viewportRect!: ElementRef<SVGRectElement>;

  private subscriptions: Subscription[] = [];
  private minimapScale = 0.1; // Initial scale for the minimap
  private isDraggingViewport = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastUpdateTime = 0;
  private updateThrottle = 100; // Minimum ms between updates

  ngAfterViewInit(): void {
    // Check if flowComponent is available
    if (!this.flowComponent) {
      console.warn('FlowComponent not provided to minimap');
      return;
    }

    // Subscribe to children changes if available
    if (this.flowComponent.children) {
      this.subscriptions.push(
        this.flowComponent.children.changes.subscribe(() => {
          console.log('Children changed, drawing minimap');
          this.drawMinimap();
        }),
      );
    }

    // Subscribe to flow service events if they exist
    if (this.flowComponent.flow) {
      // Layout updates
      if (this.flowComponent.flow.layoutUpdated) {
        this.subscriptions.push(
          this.flowComponent.flow.layoutUpdated.subscribe(() => {
            console.log('Layout updated, drawing minimap');
            this.drawMinimap();
          }),
        );
      }

      // Scale changes
      if (this.flowComponent.flow.scaleChange) {
        this.subscriptions.push(
          this.flowComponent.flow.scaleChange.subscribe(() => {
            console.log('Scale changed, updating minimap');
            this.updateViewportRect();
          }),
        );
      }

      // Pan changes
      if (this.flowComponent.flow.panChange) {
        this.subscriptions.push(
          this.flowComponent.flow.panChange.subscribe(() => {
            console.log('Pan changed, updating viewport');
            this.updateViewportRect();
          }),
        );
      }

      // Arrow/connection changes
      if (this.flowComponent.flow.arrowsChange) {
        this.subscriptions.push(
          this.flowComponent.flow.arrowsChange.subscribe(() => {
            console.log('Arrows changed, drawing minimap');
            this.drawMinimap();
          }),
        );
      }

      // Node position changes
      if (this.flowComponent.flow.nodePositionChange) {
        this.subscriptions.push(
          this.flowComponent.flow.nodePositionChange.subscribe(() => {
            console.log('Node position changed, drawing minimap');
            this.drawMinimap();
          }),
        );
      }
    }

    // Set up MutationObserver to watch for DOM changes in the flow component
    if (this.flowComponent.el && this.flowComponent.el.nativeElement) {
      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            shouldUpdate = true;
          }
        });
        if (shouldUpdate) {
          console.log('DOM mutation detected, drawing minimap');
          this.drawMinimap();
        }
      });

      observer.observe(this.flowComponent.el.nativeElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'transform'],
      });

      // Add cleanup for the observer
      this.subscriptions.push({
        unsubscribe: () => observer.disconnect(),
      } as any);
    }

    this.ngZone.runOutsideAngular(() => {
      this.viewportRect.nativeElement.addEventListener(
        'mousedown',
        this.onViewportMouseDown,
      );
      document.addEventListener('mousemove', this.onViewportMouseMove);
      document.addEventListener('mouseup', this.onViewportMouseUp);
    });
  }

  /**
   * Public method to manually trigger minimap update
   */
  public updateMinimap(): void {
    this.drawMinimap();
  }

  private drawMinimap(): void {
    // Throttle updates to improve performance
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }
    this.lastUpdateTime = now;

    console.log('drawMinimap');
    if (!this.flowComponent || !this.minimapG || !this.viewportRect) return;

    const mainFlowNodes = this.flowComponent.list;
    if (!mainFlowNodes || mainFlowNodes.length === 0) return;

    // Clear previous minimap content
    while (this.minimapG.nativeElement.firstChild) {
      this.minimapG.nativeElement.removeChild(
        this.minimapG.nativeElement.firstChild,
      );
    }

    // Calculate overall bounds of the main flow content
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    mainFlowNodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.elRect.width);
      maxY = Math.max(maxY, node.position.y + node.elRect.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Determine minimap scale based on content size and minimap container size
    const minimapContainerRect =
      this.minimapSvg.nativeElement.getBoundingClientRect();
    const scaleX = minimapContainerRect.width / contentWidth;
    const scaleY = minimapContainerRect.height / contentHeight;
    this.minimapScale = Math.min(scaleX, scaleY) * 0.9; // Add some padding

    // Adjust translation to center content in minimap
    const translateX =
      minimapContainerRect.width / 2 -
      (minX + contentWidth / 2) * this.minimapScale;
    const translateY =
      minimapContainerRect.height / 2 -
      (minY + contentHeight / 2) * this.minimapScale;

    // Render nodes on minimap
    mainFlowNodes.forEach((node) => {
      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      rect.setAttribute(
        'x',
        (node.position.x * this.minimapScale + translateX).toString(),
      );
      rect.setAttribute(
        'y',
        (node.position.y * this.minimapScale + translateY).toString(),
      );
      rect.setAttribute(
        'width',
        (node.elRect.width * this.minimapScale).toString(),
      );
      rect.setAttribute(
        'height',
        (node.elRect.height * this.minimapScale).toString(),
      );
      rect.classList.add('minimap-node');
      this.minimapG.nativeElement.appendChild(rect);
    });

    // Render connections on minimap (simplified as straight lines)
    if (this.flowComponent.flow && this.flowComponent.flow.arrows) {
      this.flowComponent.flow.arrows.forEach((arrow) => {
        const fromNode = mainFlowNodes.find(
          (n) => n.position.id === arrow.deps[0],
        );
        const toNode = mainFlowNodes.find(
          (n) => n.position.id === arrow.deps[1],
        );

        if (fromNode && toNode) {
          const line = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line',
          );
          line.setAttribute(
            'x1',
            (
              (fromNode.position.x + fromNode.elRect.width / 2) *
                this.minimapScale +
              translateX
            ).toString(),
          );
          line.setAttribute(
            'y1',
            (
              (fromNode.position.y + fromNode.elRect.height / 2) *
                this.minimapScale +
              translateY
            ).toString(),
          );
          line.setAttribute(
            'x2',
            (
              (toNode.position.x + toNode.elRect.width / 2) *
                this.minimapScale +
              translateX
            ).toString(),
          );
          line.setAttribute(
            'y2',
            (
              (toNode.position.y + toNode.elRect.height / 2) *
                this.minimapScale +
              translateY
            ).toString(),
          );
          line.classList.add('minimap-connection');
          this.minimapG.nativeElement.appendChild(line);
        }
      });
    }

    // Update viewport rectangle
    this.updateViewportRect();
  }

  private updateViewportRect(): void {
    if (!this.flowComponent || !this.viewportRect) return;
    if (!this.flowComponent.list || this.flowComponent.list.length === 0)
      return;

    const mainFlowRect =
      this.flowComponent.el.nativeElement.getBoundingClientRect();
    const minimapContainerRect =
      this.minimapSvg.nativeElement.getBoundingClientRect();

    // Calculate overall bounds of the main flow content (same as in drawMinimap)
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    this.flowComponent.list.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.elRect.width);
      maxY = Math.max(maxY, node.position.y + node.elRect.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Recalculate minimapScale and translation for viewport positioning
    const scaleX = minimapContainerRect.width / contentWidth;
    const scaleY = minimapContainerRect.height / contentHeight;
    const currentMinimapScale = Math.min(scaleX, scaleY) * 0.9; // Use the same scale as drawing

    const translateX =
      minimapContainerRect.width / 2 -
      (minX + contentWidth / 2) * currentMinimapScale;
    const translateY =
      minimapContainerRect.height / 2 -
      (minY + contentHeight / 2) * currentMinimapScale;

    // Get current scale and pan values safely
    const currentScale = this.flowComponent.flow?.scale || 1;
    const currentPanX = this.flowComponent.flow?.panX || 0;
    const currentPanY = this.flowComponent.flow?.panY || 0;

    const viewportWidth =
      (mainFlowRect.width * currentMinimapScale) / currentScale;
    const viewportHeight =
      (mainFlowRect.height * currentMinimapScale) / currentScale;

    const viewportX =
      (-currentPanX * currentMinimapScale) / currentScale + translateX;
    const viewportY =
      (-currentPanY * currentMinimapScale) / currentScale + translateY;

    this.viewportRect.nativeElement.setAttribute('x', viewportX.toString());
    this.viewportRect.nativeElement.setAttribute('y', viewportY.toString());
    this.viewportRect.nativeElement.setAttribute(
      'width',
      viewportWidth.toString(),
    );
    this.viewportRect.nativeElement.setAttribute(
      'height',
      viewportHeight.toString(),
    );
  }

  private onViewportMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingViewport = true;
    const minimapRect = this.minimapSvg.nativeElement.getBoundingClientRect();
    this.dragStartX = event.clientX - minimapRect.left;
    this.dragStartY = event.clientY - minimapRect.top;
  };

  private onViewportMouseMove = (event: MouseEvent) => {
    if (!this.isDraggingViewport) return;

    event.preventDefault();
    event.stopPropagation();

    const minimapRect = this.minimapSvg.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - minimapRect.left;
    const currentY = event.clientY - minimapRect.top;

    const deltaX = currentX - this.dragStartX;
    const deltaY = currentY - this.dragStartY;

    // Calculate new pan for the main flow
    const currentScale = this.flowComponent.flow?.scale || 1;
    const mainFlowDeltaX = (-deltaX / this.minimapScale) * currentScale;
    const mainFlowDeltaY = (-deltaY / this.minimapScale) * currentScale;

    if (this.flowComponent.flow) {
      this.flowComponent.flow.panX =
        (this.flowComponent.flow.panX || 0) + mainFlowDeltaX;
      this.flowComponent.flow.panY =
        (this.flowComponent.flow.panY || 0) + mainFlowDeltaY;
    }

    this.flowComponent.updateZoomContainer();
    this.drawMinimap(); // Redraw minimap to update viewport position

    this.dragStartX = currentX;
    this.dragStartY = currentY;
  };

  private onViewportMouseUp = () => {
    this.isDraggingViewport = false;
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    document.removeEventListener('mousemove', this.onViewportMouseMove);
    document.removeEventListener('mouseup', this.onViewportMouseUp);
  }
}
