/**
 * Coordinate transformation utilities for flow components.
 * Handles conversions between screen coordinates and flow coordinates.
 */
export class CoordinateTransform {
  constructor(
    private scale: number,
    private panX: number,
    private panY: number,
    private containerRect: DOMRect
  ) {}

  /**
   * Convert screen coordinates to flow coordinates
   */
  screenToFlow(screenX: number, screenY: number): { x: number; y: number } {
    const { left, top } = this.containerRect;
    return {
      x: (screenX - left - this.panX) / this.scale,
      y: (screenY - top - this.panY) / this.scale,
    };
  }

  /**
   * Convert flow coordinates to screen coordinates
   */
  flowToScreen(flowX: number, flowY: number): { x: number; y: number } {
    const { left, top } = this.containerRect;
    return {
      x: flowX * this.scale + this.panX + left,
      y: flowY * this.scale + this.panY + top,
    };
  }

  /**
   * Convert DOM element rect to flow coordinates
   */
  domRectToFlow(rect: DOMRect): { x: number; y: number; width: number; height: number } {
    const { left, top } = this.containerRect;
    return {
      x: (rect.x + rect.width / 2 - this.panX - left) / this.scale,
      y: (rect.y + rect.height / 2 - this.panY - top) / this.scale,
      width: rect.width / this.scale,
      height: rect.height / this.scale,
    };
  }

  /**
   * Get the center point of a DOM element in flow coordinates
   */
  getDomElementCenter(element: Element): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return this.domRectToFlow(rect);
  }

  /**
   * Scale a distance/size value from flow to screen coordinates
   */
  scaleDistance(flowDistance: number): number {
    return flowDistance * this.scale;
  }

  /**
   * Scale a distance/size value from screen to flow coordinates  
   */
  unscaleDistance(screenDistance: number): number {
    return screenDistance / this.scale;
  }

  /**
   * Create a new transformer with updated values
   */
  withTransform(scale: number, panX: number, panY: number, containerRect?: DOMRect): CoordinateTransform {
    return new CoordinateTransform(
      scale, 
      panX, 
      panY, 
      containerRect || this.containerRect
    );
  }

  /**
   * Static factory method for creating transformer from flow component
   */
  static fromFlowComponent(component: any): CoordinateTransform {
    return new CoordinateTransform(
      component.flow.scale,
      component.flow.panX, 
      component.flow.panY,
      component.flow.zRect
    );
  }
}