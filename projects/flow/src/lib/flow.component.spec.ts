import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlowComponent } from './flow.component';
import { FlowService } from './flow.service';

describe('FlowComponent', () => {
  let component: FlowComponent;
  let fixture: ComponentFixture<FlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowComponent],
      providers: [FlowService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowComponent);
    component = fixture.componentInstance;
    // component.position = { x: 0, y: 0, id: '1', deps: [] };
    fixture.detectChanges();
  });

  it('should create flow component', () => {
    expect(component).toBeTruthy();
  });

  it('should set proper initial values', () => {
    const ev = new MouseEvent('mousedown', {
      clientX: 10,
      clientY: 10,
    });
    expect(component.flow.panX).toBe(0);
    expect(component.flow.panY).toBe(0);
    component._startDraggingZoomContainer(ev);
    expect(component.flow.isDraggingZoomContainer).toBeTruthy();
    expect(component.initialX).toBe(10);
    expect(component.initialY).toBe(10);
  });

  it('should set proper end event', () => {
    const ev = new MouseEvent('mouseup');
    component._stopDraggingZoomContainer(ev);
    expect(component.flow.isDraggingZoomContainer).toBeFalsy();
  });

  it('should update the transform properly', () => {
    const ev = new MouseEvent('mousemove', {
      clientX: 11,
      clientY: 11,
    });
    component.flow.isDraggingZoomContainer = true;
    component._dragZoomContainer(ev);
    expect(component.zoomContainer.nativeElement.style.transform).toEqual(
      'translate3d(11px, 11px, 0) scale(1)'
    );
  });

  it('should properly calc the zoom', () => {
    // test the setZoom method
    const val = component._setZoom(1, 1, 1, 10, 11, 1.1);
    const d = JSON.stringify(val);
    expect(val).toEqual({
      panX: 10.45,
      panY: 11.5,
      scale: 1.155,
    });
  });

  it('should zoom in properly', () => {
    const ev = new WheelEvent('wheel', {
      deltaY: -1,
    });
    component.zoomHandle(ev);
    expect(component.zoomContainer.nativeElement.style.transform).toEqual(
      'translate3d(0px, 0px, 0) scale(1.05)'
    );
  });
});
