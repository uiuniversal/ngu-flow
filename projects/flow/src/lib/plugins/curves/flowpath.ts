import { ArrowPathFn } from '@ngu/flow';

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
