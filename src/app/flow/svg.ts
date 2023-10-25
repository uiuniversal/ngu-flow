import { FlowOptions } from './flow-interface';

export class SvgHandler {
  arrowSize = 20;
  bezierPath(start: FlowOptions, end: FlowOptions) {
    let { x: startX, y: startY } = start;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = dist / 12; // Adjust this value to change the "tightness" of the curve

    // Check if start and end points are on the same X-axis (within +/- 5 range)
    if (Math.abs(dy) <= 5) {
      return `M${start.x} ${start.y} L${end.x} ${end.y}`;
    } else {
      // const startX = start.x;
      // const startY = start.y;
      const endX = end.x;
      const endY = end.y;
      const cp1x = start.x + dx / 2;
      const cp2x = end.x - dx / 2;

      // Adjust control points based on the relative positions of the start and end nodes
      const cp1y = end.y > start.y ? startY + offset : startY - offset;
      const cp2y = end.y > start.y ? endY - offset : endY + offset;

      return `M${startX} ${startY} C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`;
    }
  }

  // get the svg path similar to flow chart path
  //   --
  //   |
  // --
  // like above, no curves
  flowPath(start: FlowOptions, end: FlowOptions): string {
    // If the start and end are aligned vertically:
    if (Math.abs(start.x - end.x) <= 5) {
      return `M${start.x} ${start.y} L${end.x} ${end.y}`;
    }
    // If the start and end are aligned horizontally:
    if (Math.abs(start.y - end.y) <= 5) {
      return `M${start.x} ${start.y} L${end.x} ${end.y}`;
    }

    // Determine the midpoint of the x coordinates
    const midX = (start.x + end.x) / 2;

    // Create the path
    return `M${start.x} ${start.y} L${midX} ${start.y} L${midX} ${end.y} L${end.x} ${end.y}`;
  }

  blendCorners(start: FlowOptions, end: FlowOptions): string {
    // include the arrow size
    let { x: startX, y: startY } = start;
    let { x: endX, y: endY } = end;
    endX -= this.arrowSize;
    // Define two control points for the cubic Bezier curve
    const cp1 = { x: startX + (endX - startX) / 3, y: startY };
    const cp2 = { x: endX - (endX - startX) / 3, y: endY };

    // Create the path using the cubic Bezier curve
    return `M${startX} ${startY} C${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${endX} ${endY}`;
  }
}
