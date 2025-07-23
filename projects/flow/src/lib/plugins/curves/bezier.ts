import { ArrowPathFn } from '@ngu/flow';

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
