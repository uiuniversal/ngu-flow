import { Directive, Input, inject } from '@angular/core';
import { FlowService } from './flow.service';
import { FlowNode, Dot } from './flow-interface';

@Directive({
  selector: '[flowDot]',
  standalone: true,
  host: {
    '(mousedown)': 'onMouseDown($event)',
    '(mouseup)': 'onMouseUp($event)',
  },
})
export class FlowDotDirective {
  private flowService = inject(FlowService);

  @Input('flowDot') position!: FlowNode;
  @Input() dot!: Dot;

  onMouseDown(event: MouseEvent) {
    event.stopPropagation();
    this.flowService.startConnection.next({
      event,
      fromNode: this.position,
      fromDot: this.dot,
    });
  }

  onMouseUp(event: MouseEvent) {
    event.stopPropagation();
    this.flowService.endConnection.next({
      event,
      toNode: this.position,
      toDot: this.dot,
    });
  }
}
