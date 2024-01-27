import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewChildren,
} from '@angular/core';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-svg',
  template: `<svg class="w-[1100px] h-[720px] border border-red-500">
    @for (rect of rects; track rect) {
    <rect
      #rects
      [attr.x]="rect.x"
      [attr.y]="rect.y"
      [attr.width]="rect.width"
      [attr.height]="rect.height"
      fill="cornflowerblue"
      (click)="selectRect($event)"
    ></rect>
    }
    <g #g></g>
  </svg>`,
})
export class SvgComponent implements OnInit {
  @ViewChild('g') g: ElementRef<SVGGElement>;
  @ViewChildren('rects') boxes: ElementRef<SVGRectElement>[];
  rects: { x: number; y: number; width: number; height: number }[] = [];
  nodes: SVGRectElement[] = [];

  constructor() {
    // add rect with x, y, width = 100, height = 100
    // make sure that the width of the svg is 1100 so we need to add 10 rects
    // with 10 rows
    const gap = 60;
    let xGap = gap;
    let yGap = gap;
    let x = 0 + xGap;
    let y = 0 + yGap;
    const width = 100 - gap / 2;
    const height = 100 - gap / 2;
    let i = 0;
    let j = 0;
    while (i < 5) {
      while (j < 10) {
        this.rects.push({ x, y, width, height });
        x += width + gap;
        j++;
      }
      y += height + gap;
      x = 0 + xGap;
      j = 0;
      i++;
    }
  }

  ngOnInit() {}

  selectRect(ev: MouseEvent) {
    console.log(ev);
    this.nodes.push(ev.target as SVGRectElement);
    if (this.nodes.length === 2) {
      this.drawPath(
        document.querySelector('svg')!,
        this.nodes[0],
        this.nodes[1]
      );
      this.nodes = [];
    }
  }

  drawPath(
    svg: SVGSVGElement,
    node1: SVGRectElement,
    node2: SVGRectElement
  ): any {
    // Extract coordinates
    const { width: w1, height: h1 } = node1.getBoundingClientRect();
    const x1 = +node1.getAttribute('x')! + w1 / 2;
    let y1 = +node1.getAttribute('y')! + h1 / 2;
    const { width: w2, height: h2 } = node2.getBoundingClientRect();
    const x2 = +node2.getAttribute('x')! + w2 / 2;
    let y2 = +node2.getAttribute('y')! + h2 / 2;

    // With the help of A* algorithm, we can find the shortest path
    // between two points in a graph. We can use the same algorithm
    // to find the shortest path between two points in a grid.
    // code below
    const grid: { x: number; y: number }[][] = [];
    const numRows = 5;
    const numCols = 10;
    const gap = 60;
    const nodeWidth = 100;
    const nodeHeight = 100;
    const startX = gap / 2 + nodeWidth / 2;
    const startY = gap / 2 + nodeHeight / 2;
    const endX = startX + (numCols - 1) * (nodeWidth + gap);
    const endY = startY + (numRows - 1) * (nodeHeight + gap);

    // Create the grid
    for (let i = 0; i < numRows; i++) {
      const row = [];
      for (let j = 0; j < numCols; j++) {
        const x = startX + j * (nodeWidth + gap);
        const y = startY + i * (nodeHeight + gap);
        row.push({ x, y });
      }
      grid.push(row);
    }

    // Find the start and end nodes
    let startNode = null;
    let endNode = null;
    let minDistance = Infinity;
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        const node = grid[i][j];
        const distanceToStart = Math.sqrt(
          (node.x - x1) ** 2 + (node.y - y1) ** 2
        );
        const distanceToEnd = Math.sqrt(
          (node.x - x2) ** 2 + (node.y - y2) ** 2
        );
        if (distanceToStart < minDistance) {
          startNode = node;
          minDistance = distanceToStart;
        }
        if (distanceToEnd < minDistance) {
          endNode = node;
          minDistance = distanceToEnd;
        }
      }
    }

    // Implement A* algorithm to find the shortest path
    const openSet = [startNode];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    gScore.set(startNode, 0);
    fScore.set(startNode, heuristic(startNode, endNode));
    while (openSet.length > 0) {
      const current = getLowestFScoreNode(openSet, fScore);
      if (current === endNode) {
        const path = reconstructPath(cameFrom, endNode);
        const d = `M${x1},${y1} ${path} ${x2},${y2}`;
        const pathElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path'
        );
        pathElement.setAttribute('d', d);
        pathElement.setAttribute('stroke', 'black');
        pathElement.setAttribute('stroke-width', '2');
        pathElement.setAttribute('fill', 'none');
        this.g.nativeElement.appendChild(pathElement);
        return pathElement;
      }
      openSet.splice(openSet.indexOf(current), 1);
      for (const neighbor of getNeighbors(current, grid)) {
        const tentativeGScore =
          gScore.get(current) + distance(current, neighbor);
        if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(neighbor, tentativeGScore + heuristic(neighbor, endNode));
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    // Helper functions
    function heuristic(node1: any, node2: any) {
      return Math.sqrt((node1.x - node2.x) ** 2 + (node1.y - node2.y) ** 2);
    }

    function getLowestFScoreNode(nodes: any, fScore: any) {
      let lowestNode = nodes[0];
      let lowestFScore = fScore.get(lowestNode);
      for (const node of nodes) {
        const nodeFScore = fScore.get(node);
        if (nodeFScore < lowestFScore) {
          lowestNode = node;
          lowestFScore = nodeFScore;
        }
      }
      return lowestNode;
    }

    function reconstructPath(cameFrom: any, current: any) {
      let path = '';
      while (cameFrom.has(current)) {
        const previous = cameFrom.get(current);
        path = `L${current.x},${current.y} ${path}`;
        current = previous;
      }
      return path;
    }

    function getNeighbors(node: any, grid: any) {
      const neighbors = [];
      const numRows = grid.length;
      const numCols = grid[0].length;
      const row = Math.floor((node.y - startY) / (nodeHeight + gap));
      const col = Math.floor((node.x - startX) / (nodeWidth + gap));
      if (row > 0) {
        neighbors.push(grid[row - 1][col]);
      }
      if (row < numRows - 1) {
        neighbors.push(grid[row + 1][col]);
      }
      if (col > 0) {
        neighbors.push(grid[row][col - 1]);
      }
      if (col < numCols - 1) {
        neighbors.push(grid[row][col + 1]);
      }
      return neighbors;
    }

    function distance(node1: any, node2: any) {
      return Math.sqrt((node1.x - node2.x) ** 2 + (node1.y - node2.y) ** 2);
    }
  }
}

// function getAdjustedPoint(nodeCenter, obstacleCenter, obstacleRadius) {
//   const dx = nodeCenter.x - obstacleCenter.x;
//   const dy = nodeCenter.y - obstacleCenter.y;
//   const distance = Math.sqrt(dx * dx + dy * dy);
//   const buffer = 1.1; // To ensure the path does not touch the node

//   // Calculate the new point that is 'obstacleRadius' away from the obstacle's edge
//   return {
//     x: obstacleCenter.x + (dx / distance) * (obstacleRadius + buffer),
//     y: obstacleCenter.y + (dy / distance) * (obstacleRadius + buffer)
//   };
// }

// function drawPathAvoidingNode(svg, node1, node2, obstacleNode) {
//   // Get center points of the nodes
//   const start = { x: parseFloat(node1.getAttribute('cx')), y: parseFloat(node1.getAttribute('cy')) };
//   const end = { x: parseFloat(node2.getAttribute('cx')), y: parseFloat(node2.getAttribute('cy')) };
//   const obstacle = { x: parseFloat(obstacleNode.getAttribute('cx')), y: parseFloat(obstacleNode.getAttribute('cy')) };
//   const obstacleRadius = parseFloat(obstacleNode.getAttribute('r'));

//   // Adjust the start and end points if they overlap with the obstacle
//   const adjustedStart = getAdjustedPoint(start, obstacle, obstacleRadius);
//   const adjustedEnd = getAdjustedPoint(end, obstacle, obstacleRadius);

//   // Create the path element
//   const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

//   // Set the path's `d` attribute to move to the start point, line to the adjusted start,
//   // line to the adjusted end, and then to the end point
//   const d = `M${start.x},${start.y} L${adjustedStart.x},${adjustedStart.y} L${adjustedEnd.x},${adjustedEnd.y} L${end.x},${end.y}`;
//   path.setAttribute('d', d);

//   // Optional: style the path
//   path.setAttribute('stroke', 'black');
//   path.setAttribute('stroke-width', '2');
//   path.setAttribute('fill', 'none');

//   // Append the path to the SVG
//   svg.appendChild(path);

//   return path;
// }

// // Usage: Assuming node1, node2, and obstacleNode are defined SVG circle elements
// drawPathAvoidingNode(svg, node1, node2, obstacleNode);
