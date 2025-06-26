// Convert mermaid to flow

import { FlowOptions } from '@ngu/flow';

export class NodeMap extends FlowOptions {
  constructor(
    options: FlowOptions,
    public title?: string,
    public subTitle?: string,
    public details?: string,
    public done = false,
    public color = '',
  ) {
    super(options);
  }
}

export function convertMermaidToNodeMap(mermaidString: string): NodeMap[] {
  const lines = mermaidString.split('\n');
  const nodes: NodeMap[] = [];
  const idMap: { [key: string]: string } = {};

  // Skip the first line if it's the flowchart definition
  const startIndex = lines[0].trim().startsWith('flowchart') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('```')) {
      const [sourcepart, targetpart] = line
        .split('-->')
        .map((part) => part.trim());

      // Extract source node information
      const sourceMatch = sourcepart.match(/(\w+)(\[([^\]]+)\])?/);
      if (sourceMatch) {
        const [, sourceId, , sourceTitle] = sourceMatch;
        if (!idMap[sourceId]) {
          idMap[sourceId] = crypto.randomUUID();
          nodes.push(
            new NodeMap(
              {
                x: 0,
                y: i * 100,
                id: idMap[sourceId],
                children: [],
              },
              sourceTitle || sourceId,
            ),
          );
        }
      }

      // Extract target node information
      if (targetpart) {
        const linkLabel = targetpart.match(/\|([^|]+)\|/)?.[1] || '';
        const targetMatch = targetpart
          .replace(/\|[^|]+\|/, '')
          .match(/(\w+)(\[([^\]]+)\])?/);
        if (targetMatch) {
          const [, targetId, , targetTitle] = targetMatch;
          if (!idMap[targetId]) {
            idMap[targetId] = crypto.randomUUID();
            nodes.push(
              new NodeMap(
                {
                  x: 300,
                  y: i * 100,
                  id: idMap[targetId],
                  children: [idMap[sourceMatch![1]]],
                },
                targetTitle || targetId,
                linkLabel,
              ),
            );
          } else {
            const targetNode = nodes.find(
              (node) => node.id === idMap[targetId],
            );
            if (targetNode) {
              if (!targetNode.children.includes(idMap[sourceMatch![1]])) {
                targetNode.children.push(idMap[sourceMatch![1]]);
              }
              if (linkLabel && !targetNode.subTitle) {
                targetNode.subTitle = linkLabel;
              }
            }
          }
        }
      }
    }
  }

  return nodes;
}
