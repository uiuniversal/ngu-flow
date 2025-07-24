import { ArrowPathFn } from '../../flow-interface';

export const blendCorners1: ArrowPathFn = (
  start,
  end,
  arrowSize,
  strokeWidth,
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
  strokeWidth,
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
  arrowSize: number,
): {
  x: number;
  y: number;
  cpX: number;
  cpY: number;
} {
  // console.log(arrowSize);
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
