import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlowChildComponent } from './flow-child.component';
import { FlowService } from './flow.service';

describe('FlowChildComponent', () => {
  let component: FlowChildComponent;
  let fixture: ComponentFixture<FlowChildComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowChildComponent],
      providers: [FlowService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowChildComponent);
    component = fixture.componentInstance;
    component.position = { x: 0, y: 0, id: '1', deps: [] };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ... more tests, possibly involving simulated drag-and-drop
});
