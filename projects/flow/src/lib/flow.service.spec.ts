import { TestBed } from '@angular/core/testing';
import { FlowService } from './flow.service';
import { FlowOptions } from './flow-interface';

describe('FlowService', () => {
  let service: FlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FlowService],
    });
    service = TestBed.inject(FlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update items and parent relationships', () => {
    const flowItems: FlowOptions[] = [
      { x: 0, y: 0, id: '1', children: ['2'] },
      { x: 1, y: 1, id: '2', children: [] },
    ];
    service.update(flowItems);

    expect(service.items.size).toBe(2);
    expect(service.parents.get('2')).toEqual(['1']);
  });
});
