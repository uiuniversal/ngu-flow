import { Directive, input, inject } from '@angular/core';
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

  position = input.required<FlowNode>({ alias: 'flowDot' });
  dot = input.required<Dot>();

  onMouseDown(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.flowService.startConnection.next({
      event,
      fromNode: this.position(),
      fromDot: this.dot(),
    });
  }

  onMouseUp(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.flowService.endConnection.next({
      event,
      toNode: this.position(),
      toDot: this.dot(),
    });
  }
}
