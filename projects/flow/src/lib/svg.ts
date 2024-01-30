import { ArrowPathFn } from './flow-interface';

export const bezierPath: ArrowPathFn = (start, end, arrowSize, strokeWidth) => {
  let { x: startX, y: startY } = start;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist / 12; // Adjust this value to change the "tightness" of the curve

  // Check if start and end points are on the same X-axis (within +/- 5 range)
  if (Math.abs(dy) <= 5) {
    return `M${start.x} ${start.y} L${end.x} ${end.y}`;
  } else {
    const endX = end.x;
    const endY = end.y;
    const cp1x = start.x + dx / 2;
    const cp2x = end.x - dx / 2;

    // Adjust control points based on the relative positions of the start and end nodes
    const cp1y = end.y > start.y ? startY + offset : startY - offset;
    const cp2y = end.y > start.y ? endY - offset : endY + offset;

    return `M${startX} ${startY} C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY}`;
  }
};

// get the svg path similar to flow chart path
//   --
//   |
// --
// like above, no curves
export const flowPath: ArrowPathFn = (start, end, arrowSize, strokeWidth) => {
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
};

export const blendCorners1: ArrowPathFn = (
  start,
  end,
  arrowSize,
  strokeWidth
) => {
  // include the arrow size
  let { x: startX, y: startY } = start;
  let { x: endX, y: endY } = end;
  endX -= arrowSize;
  // Define two control points for the cubic Bezier curve
  const cp1 = { x: startX + (endX - startX) / 3, y: startY };
  const cp2 = { x: endX - (endX - startX) / 3, y: endY };

  // Create the path using the cubic Bezier curve
  return `M${startX} ${startY} C${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${endX} ${endY}`;
};

export const blendCorners: ArrowPathFn = (
  start,
  end,
  arrowSize,
  strokeWidth
) => {
  let { x: startX, y: startY, dotIndex: startDotIndex } = start;
  let { x: endX, y: endY, dotIndex: endDotIndex } = end;

  // Determine the direction from the dotIndex and adjust the start and end points
  let startAdjustment = getDirectionAdjustment(startDotIndex, arrowSize);
  let endAdjustment = getDirectionAdjustment(endDotIndex, arrowSize);

  startX += startAdjustment.x - strokeWidth / 2;
  startY += startAdjustment.y;
  endX += endAdjustment.x - strokeWidth / 2;
  endY += endAdjustment.y;

  // Calculate control points based on the directionality
  let cp1 = {
    x: startX + startAdjustment.cpX,
    y: startY + startAdjustment.cpY,
  };
  let cp2 = { x: endX + endAdjustment.cpX, y: endY + endAdjustment.cpY };

  // Create the path using the cubic Bezier curve
  const path = `M${startX - startAdjustment.x} ${startY - startAdjustment.y} C${
    cp1.x
  } ${cp1.y} ${cp2.x} ${cp2.y} ${endX} ${endY}`;
  return path;
};

function getDirectionAdjustment(
  dotIndex: number,
  arrowSize: number
): {
  x: number;
  y: number;
  cpX: number;
  cpY: number;
} {
  // 'controlPointDistance' is a new property to be defined. It determines how 'curvy' the path should be.
  // Adjust this value to increase or decrease the curvature of the Bezier path.
  let controlPointDistance = 50;
  switch (dotIndex) {
    case 0: // top
      return {
        x: 0,
        y: -arrowSize,
        cpX: 0,
        cpY: -controlPointDistance,
      };
    case 1: // right
      return {
        x: arrowSize,
        y: 0,
        cpX: controlPointDistance,
        cpY: 0,
      };
    case 2: // bottom
      return {
        x: 0,
        y: arrowSize,
        cpX: 0,
        cpY: controlPointDistance,
      };
    case 3: // left
      return {
        x: -arrowSize,
        y: 0,
        cpX: -controlPointDistance,
        cpY: 0,
      };
    default:
      return { x: 0, y: 0, cpX: 0, cpY: 0 };
  }
}
