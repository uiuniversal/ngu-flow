import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlowComponent, FlowService } from './app.component';

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
      'translate(11px, 11px) scale(1)'
    );
  });

  it('should properly calc the zoom', () => {
    // test the setZoom method
    const val = component._setZoom(1, 1, 1, 10, 11, 1.1);
    const d = JSON.stringify(val);
    expect(val).toEqual({
      scale: 1.11,
      panX: 10.081818181818182,
      panY: 11.090909090909092,
    });
  });

  it('should zoom in properly', () => {
    const ev = new WheelEvent('wheel', {
      deltaY: -1,
    });
    component.zoomHandle(ev);
    expect(component.zoomContainer.nativeElement.style.transform).toEqual(
      'translate(0px, 0px) scale(1.01)'
    );
  });

  it('should calc the path', () => {
    const val = component.calculatePath(
      { x: 0, y: 0, id: '1', deps: [] },
      { x: 10, y: 10, id: '2', deps: [] }
    );
    expect(val).toEqual('M0 0 C5 1.1785113019775793 5 8.82148869802242 10 10');
  });
});
