import { FlowNode } from '../entities';

// ChildInfo interface for geometry calculations
interface ChildInfo {
  position: FlowNode;
  elRect: DOMRect;
}

/**
 * Geometry and positioning utilities extracted from plugins
 */
export class GeometryUtils {
  /**
   * Calculate the closest connection points between two nodes
   */
  static findClosestConnectionPoints(
    sourceNode: ChildInfo,
    targetNode: ChildInfo,
    direction: 'horizontal' | 'vertical' = 'horizontal'
  ): [number, number] {
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;

    if (direction === 'vertical') {
      return dy > 0 
        ? [2, 0] // source bottom, target top
        : [0, 2]; // source top, target bottom
    } else {
      return dx > 0 
        ? [1, 3] // source right, target left
        : [3, 1]; // source left, target right
    }
  }

  /**
   * Get optimal dot indices based on relative positions
   */
  static getOptimalDotIndices(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number }
  ): { sourceDotIndex: number; targetDotIndex: number } {
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;

    let sourceDotIndex: number;
    let targetDotIndex: number;

    // Source dot: point towards target
    if (Math.abs(dx) > Math.abs(dy)) {
      sourceDotIndex = dx > 0 ? 1 : 3; // right or left
    } else {
      sourceDotIndex = dy > 0 ? 2 : 0; // bottom or top
    }

    // Target dot: point towards source (opposite)
    if (Math.abs(dx) > Math.abs(dy)) {
      targetDotIndex = dx > 0 ? 3 : 1; // left or right (opposite)
    } else {
      targetDotIndex = dy > 0 ? 0 : 2; // top or bottom (opposite)
    }

    return { sourceDotIndex, targetDotIndex };
  }

  /**
   * Calculate boundaries of a set of positioned nodes
   */
  static getBoundaries(positions: Array<{ x: number; y: number; width: number; height: number }>) {
    if (positions.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    return { minX, maxX, minY, maxY };
  }

  /**
   * Check if a point is within a rectangle
   */
  static isPointInRect(
    point: { x: number; y: number },
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  /**
   * Calculate distance between two points
   */
  static distance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate center point of a rectangle
   */
  static getRectCenter(rect: { x: number; y: number; width: number; height: number }): { x: number; y: number } {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }

  /**
   * Get direction from one node to another
   */
  static getDirection(
    from: { x: number; y: number },
    to: { x: number; y: number },
    preferVertical: boolean = false
  ): 'right' | 'left' | 'bottom' | 'top' {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (preferVertical) {
      return dy > 0 ? 'bottom' : 'top';
    } else {
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'right' : 'left';
      } else {
        return dy > 0 ? 'bottom' : 'top';
      }
    }
  }

  /**
   * Calculate scale that fits content within container
   */
  static calculateFitScale(
    contentBounds: { width: number; height: number },
    containerSize: { width: number; height: number },
    padding: number = 0
  ): number {
    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - padding * 2;
    
    const scaleX = availableWidth / contentBounds.width;
    const scaleY = availableHeight / contentBounds.height;
    
    return Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
  }

  /**
   * Calculate pan values to center content in container
   */
  static calculateCenterPan(
    contentBounds: { x: number; y: number; width: number; height: number },
    containerSize: { width: number; height: number },
    scale: number
  ): { panX: number; panY: number } {
    const scaledContentWidth = contentBounds.width * scale;
    const scaledContentHeight = contentBounds.height * scale;

    const containerCenterX = containerSize.width / 2;
    const containerCenterY = containerSize.height / 2;

    const panX = containerCenterX - (scaledContentWidth / 2 + contentBounds.x * scale);
    const panY = containerCenterY - (scaledContentHeight / 2 + contentBounds.y * scale);

    return { panX, panY };
  }
}