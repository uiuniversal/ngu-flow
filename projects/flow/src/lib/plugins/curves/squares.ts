import { ArrowPathFn } from '@ngu/flow';

export const squarePath: ArrowPathFn = (start, end, arrowSize, strokeWidth) => {
  const { x: startX, y: startY } = start;
  const { x: endX, y: endY } = end;
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist / 12; // Adjust this value to change the "tightness" of the curve

  return `M${startX} ${startY} L${endX} ${endY}`;
};

// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Interactive SVG Arrow Generator</title>
//     <style>
//         body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
//                 Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
//             display: flex;
//             justify-content: center;
//             align-items: flex-start;
//             padding: 20px;
//             background-color: #f0f2f5;
//             color: #333;
//             gap: 30px;
//             flex-wrap: wrap;
//         }

//         #playground-container {
//             border: 1px solid #ccc;
//             border-radius: 8px;
//             background-color: #fff;
//             box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//         }

//         #playground-svg {
//             cursor: default;
//             user-select: none;
//         }

//         #arrow-path {
//             fill: none;
//             stroke: #333;
//             stroke-width: 2.5;
//             stroke-linecap: round;
//             stroke-linejoin: round;
//         }

//         .handle {
//             fill: #007bff;
//             stroke: #fff;
//             stroke-width: 2;
//             cursor: move;
//             transition: r 0.1s ease-in-out;
//         }

//         .handle:hover {
//             r: 10;
//         }

//         #controls {
//             width: 300px;
//             padding: 20px;
//             background: #fff;
//             border-radius: 8px;
//             box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//             display: flex;
//             flex-direction: column;
//             gap: 20px;
//         }

//         .control-group {
//             display: flex;
//             flex-direction: column;
//             gap: 8px;
//         }

//         .control-group label {
//             font-weight: 600;
//             color: #555;
//         }

//         .control-group input[type="range"],
//         .control-group select {
//             width: 100%;
//             padding: 4px;
//             border: 1px solid #ccc;
//             border-radius: 4px;
//         }

//         .radio-group label {
//            margin-right: 15px;
//            font-weight: normal;
//         }

//         #path-output-container {
//             margin-top: 10px;
//         }
//         #path-output-container label {
//             font-weight: 600;
//             color: #555;
//         }

//         #path-output {
//             margin-top: 8px;
//             padding: 10px;
//             background-color: #e9ecef;
//             border-radius: 4px;
//             font-family: 'Courier New', Courier, monospace;
//             font-size: 0.85em;
//             word-wrap: break-word;
//             border: 1px solid #ddd;
//         }
//     </style>
// </head>
// <body>

//     <div id="playground-container">
//         <svg id="playground-svg" width="600" height="400">
//             <defs>
//                 <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
//                     <path d="M 0 0 L 10 5 L 0 10 z" fill="#333" />
//                 </marker>
//             </defs>
//             <path id="arrow-path" marker-end="url(#arrowhead)"></path>
//             <circle id="start-handle" class="handle" r="8"></circle>
//             <circle id="end-handle" class="handle" r="8"></circle>
//         </svg>
//     </div>

//     <div id="controls">
//         <h2>Arrow Options</h2>

//         <div class="control-group">
//             <label>Path Style</label>
//             <div class="radio-group">
//                 <input type="radio" id="s-curve" name="path-type" value="s-curve">
//                 <label for="s-curve">Curvy (S-Shape)</label>
//                 <input type="radio" id="c-curve" name="path-type" value="orthogonal" checked>
//                 <label for="c-curve">Orthogonal</label>
//             </div>
//         </div>

//         <div class="control-group">
//             <label for="start-direction-select">Start Edge Direction</label>
//             <select id="start-direction-select">
//                 <option value="auto">Auto</option>
//                 <option value="left">Left</option>
//                 <option value="right">Right</option>
//                 <option value="top">Top</option>
//                 <option value="bottom">Bottom</option>
//             </select>
//         </div>

//         <div class="control-group">
//             <label for="end-direction-select">End Edge Direction</label>
//             <select id="end-direction-select">
//                 <option value="auto">Auto</option>
//                 <option value="left">Left</option>
//                 <option value="right">Right</option>
//                 <option value="top">Top</option>
//                 <option value="bottom">Bottom</option>
//             </select>
//         </div>

//         <div class="control-group">
//             <label for="distance-slider">Edge Distance</label>
//             <input type="range" id="distance-slider" min="10" max="200" value="80">
//         </div>

//         <div class="control-group">
//             <label for="curviness-slider">Corner Radius / Curviness</label>
//             <input type="range" id="curviness-slider" min="0" max="100" value="20">
//         </div>

//         <div id="path-output-container">
//             <label for="path-output">SVG Path Data (d)</label>
//             <div id="path-output"></div>
//         </div>
//     </div>

//     <script>
//         document.addEventListener('DOMContentLoaded', () => {
//             const svg = document.getElementById('playground-svg');
//             const path = document.getElementById('arrow-path');
//             const startHandle = document.getElementById('start-handle');
//             const endHandle = document.getElementById('end-handle');

//             const distanceSlider = document.getElementById('distance-slider');
//             const curvinessSlider = document.getElementById('curviness-slider');
//             const pathTypeRadios = document.querySelectorAll('input[name="path-type"]');
//             const startDirSelect = document.getElementById('start-direction-select');
//             const endDirSelect = document.getElementById('end-direction-select');
//             const pathOutput = document.getElementById('path-output');

//             const state = {
//                 start: { x: 300, y: 300 },
//                 end: { x: 300, y: 100 },
//                 params: {
//                     distance: 80,
//                     curviness: 20,
//                     pathType: 'orthogonal',
//                     startDirection: 'right',
//                     endDirection: 'right',
//                 },
//                 dragging: null
//             };

//             function getSVGPoint(event) {
//                 const pt = svg.createSVGPoint();
//                 pt.x = event.clientX;
//                 pt.y = event.clientY;
//                 return pt.matrixTransform(svg.getScreenCTM().inverse());
//             }

//             function getEdgePoint(point, direction, distance, isEnd = false) {
//                 const d = isEnd ? -distance : distance;
//                 if (direction === 'left') return { x: point.x - d, y: point.y };
//                 if (direction === 'right') return { x: point.x + d, y: point.y };
//                 if (direction === 'top') return { x: point.x, y: point.y - d };
//                 if (direction === 'bottom') return { x: point.x, y: point.y + d };
//                 return point;
//             }

//             function buildPathWithRounding(points, radius) {
//                 if (points.length < 2) return '';
//                 let d = `M ${points[0].x},${points[0].y}`;
//                 for (let i = 1; i < points.length - 1; i++) {
//                     const p0 = points[i - 1];
//                     const p1 = points[i]; // The corner
//                     const p2 = points[i + 1];
//                     const p01_dist = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
//                     const p12_dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
//                     const r = Math.min(radius, p01_dist / 2.01, p12_dist / 2.01);
//                     if (r <= 0) {
//                         d += ` L ${p1.x},${p1.y}`;
//                         continue;
//                     }
//                     const p01_dx = (p1.x - p0.x) / p01_dist;
//                     const p01_dy = (p1.y - p0.y) / p01_dist;
//                     const p12_dx = (p2.x - p1.x) / p12_dist;
//                     const p12_dy = (p2.y - p1.y) / p12_dist;
//                     d += ` L ${p1.x - r * p01_dx},${p1.y - r * p01_dy}`;
//                     d += ` Q ${p1.x},${p1.y} ${p1.x + r * p12_dx},${p1.y + r * p12_dy}`;
//                 }
//                 d += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;
//                 return d;
//             }

//             function generateSPath(start, end, params) {
//                 const dx = end.x - start.x;
//                 const dy = end.y - start.y;
//                 let startDir = params.startDirection === 'auto' ? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top')) : params.startDirection;
//                 let endDir = params.endDirection === 'auto' ? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'top' : 'bottom')) : params.endDirection;

//                 const p1 = getEdgePoint(start, startDir, params.distance, false);
//                 const p2 = getEdgePoint(end, endDir, params.distance, true);

//                 const c1 = getEdgePoint(p1, startDir, params.curviness, false);
//                 const c2 = getEdgePoint(p2, endDir, params.curviness, true);

//                 return `M ${start.x},${start.y} L ${p1.x},${p1.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y} L ${end.x},${end.y}`;
//             }

//             function generateOrthogonalPath(start, end, params) {
//                 const dx = end.x - start.x;
//                 const dy = end.y - start.y;
//                 const dist = params.distance;

//                 let startDir = params.startDirection === 'auto' ? (Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top')) : params.startDirection;
//                 let endDir = params.endDirection === 'auto' ? (Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? 'left' : 'right') : (dy >= 0 ? 'top' : 'bottom')) : params.endDirection;

//                 const p1 = getEdgePoint(start, startDir, dist, false);
//                 const p2 = getEdgePoint(end, endDir, dist, true);
//                 const points = [start, p1];

//                 const startIsHorizontal = startDir === 'left' || startDir === 'right';
//                 const endIsHorizontal = endDir === 'left' || endDir === 'right';

//                 let uTurn = false;
//                 if (startIsHorizontal && endIsHorizontal && startDir === endDir) {
//                     if ((startDir === 'right' && p1.x > p2.x) || (startDir === 'left' && p1.x < p2.x)) uTurn = true;
//                 } else if (!startIsHorizontal && !endIsHorizontal && startDir === endDir) {
//                     if ((startDir === 'bottom' && p1.y > p2.y) || (startDir === 'top' && p1.y < p2.y)) uTurn = true;
//                 }

//                 if (uTurn) {
//                     const midY = (p1.y + p2.y) / 2;
//                     const midX = (p1.x + p2.x) / 2;
//                     if(startIsHorizontal){
//                         points.push({ x: p1.x, y: midY });
//                         points.push({ x: p2.x, y: midY });
//                     } else { // vertical
//                         points.push({ x: midX, y: p1.y });
//                         points.push({ x: midX, y: p2.y });
//                     }
//                 } else if (startIsHorizontal !== endIsHorizontal) {
//                     if (startIsHorizontal) points.push({ x: p1.x, y: p2.y });
//                     else points.push({ x: p2.x, y: p1.y });
//                 } else { // Parallel but not a U-turn
//                     const midX = (p1.x + p2.x) / 2;
//                     const midY = (p1.y + p2.y) / 2;
//                     if(startIsHorizontal) {
//                         points.push({ x: midX, y: p1.y });
//                         points.push({ x: midX, y: p2.y });
//                     } else {
//                         points.push({ x: p1.x, y: midY });
//                         points.push({ x: p2.x, y: midY });
//                     }
//                 }

//                 points.push(p2, end);
//                 return buildPathWithRounding(points.filter(p=>p), params.curviness);
//             }

//             function update() {
//                 startHandle.setAttribute('cx', state.start.x);
//                 startHandle.setAttribute('cy', state.start.y);
//                 endHandle.setAttribute('cx', state.end.x);
//                 endHandle.setAttribute('cy', state.end.y);

//                 let d;
//                 const { start, end, params } = state;
//                 if (params.pathType === 's-curve') {
//                     document.querySelector('label[for="curviness-slider"]').textContent = 'Curviness';
//                     d = generateSPath(start, end, params);
//                 } else {
//                     document.querySelector('label[for="curviness-slider"]').textContent = 'Corner Radius';
//                     d = generateOrthogonalPath(start, end, params);
//                 }

//                 path.setAttribute('d', d);
//                 pathOutput.textContent = d.replace(/\s\s+/g, ' ').trim();
//             }

//             // --- Event Listeners ---
//             startHandle.addEventListener('mousedown', (e) => { state.dragging = 'start'; });
//             endHandle.addEventListener('mousedown', (e) => { state.dragging = 'end'; });
//             window.addEventListener('mousemove', (e) => {
//                 if (!state.dragging) return;
//                 const pt = getSVGPoint(e);
//                 state[state.dragging].x = pt.x;
//                 state[state.dragging].y = pt.y;
//                 update();
//             });
//             window.addEventListener('mouseup', () => { state.dragging = null; });
//             distanceSlider.addEventListener('input', (e) => { state.params.distance = Number(e.target.value); update(); });
//             curvinessSlider.addEventListener('input', (e) => { state.params.curviness = Number(e.target.value); update(); });
//             pathTypeRadios.forEach(radio => { radio.addEventListener('change', (e) => { state.params.pathType = e.target.value; update(); }); });
//             startDirSelect.addEventListener('change', (e) => { state.params.startDirection = e.target.value; update(); });
//             endDirSelect.addEventListener('change', (e) => { state.params.endDirection = e.target.value; update(); });

//             // Initial render
//             distanceSlider.value = state.params.distance;
//             curvinessSlider.value = state.params.curviness;
//             startDirSelect.value = state.params.startDirection;
//             endDirSelect.value = state.params.endDirection;
//             document.querySelector(`input[name="path-type"][value="${state.params.pathType}"]`).checked = true;
//             update();
//         });
//     </script>
// </body>
// </html>
