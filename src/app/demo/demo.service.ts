import { Injectable } from '@angular/core';
import { FlowComponent, FlowNode, FlowEdge } from '@ngu/flow';

@Injectable({ providedIn: 'root' })
export class DemoService {
  flow: FlowComponent;

  constructor() {}

  addNode(targetNode: FlowNode, nodesList: FlowNode[], edgesList: FlowEdge[]) {
    // find the highest id
    const lastId = nodesList.reduce((acc, cur) => Math.max(+cur.id, acc), 0);
    const newNodeId = (lastId + 1).toString();
    const newNode: FlowNode = {
      x: 40 + nodesList.length * 160,
      y: 40,
      id: newNodeId,
    };
    nodesList.push(newNode);

    // Create edge from new node to target node
    const newEdge: FlowEdge = {
      id: `edge-${newNodeId}-${targetNode.id}`,
      source: newNodeId,
      target: targetNode.id,
    };
    edgesList.push(newEdge);
  }

  deleteNode(id: string, nodesList: FlowNode[], edgesList: FlowEdge[]) {
    // Remove the node
    const updatedNodes = nodesList.filter((node) => node.id !== id);

    // Remove all edges connected to this node
    const updatedEdges = edgesList.filter(
      (edge) => edge.source !== id && edge.target !== id,
    );

    return { nodes: updatedNodes, edges: updatedEdges };
  }
}
