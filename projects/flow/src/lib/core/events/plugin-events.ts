import { Subject } from 'rxjs';

/**
 * Standard events that plugins can emit and listen to
 */
export interface PluginEvents {
  layoutUpdated: Subject<void>;
  nodePositionChanged: Subject<{ nodeId: string; x: number; y: number }>;
  edgeCreated: Subject<{ edgeId: string; source: string; target: string }>;
  edgeRemoved: Subject<{ edgeId: string }>;
  zoomChanged: Subject<{ scale: number; panX: number; panY: number }>;
  pluginInitialized: Subject<{ pluginName: string }>;
}

/**
 * Event bus for plugin communication
 */
export class PluginEventBus {
  private events: PluginEvents;

  constructor() {
    this.events = {
      layoutUpdated: new Subject<void>(),
      nodePositionChanged: new Subject<{ nodeId: string; x: number; y: number }>(),
      edgeCreated: new Subject<{ edgeId: string; source: string; target: string }>(),
      edgeRemoved: new Subject<{ edgeId: string }>(),
      zoomChanged: new Subject<{ scale: number; panX: number; panY: number }>(),
      pluginInitialized: new Subject<{ pluginName: string }>(),
    };
  }

  /**
   * Get all available events
   */
  getEvents(): PluginEvents {
    return this.events;
  }

  /**
   * Emit layout updated event
   */
  emitLayoutUpdated(): void {
    this.events.layoutUpdated.next();
  }

  /**
   * Emit node position changed event
   */
  emitNodePositionChanged(nodeId: string, x: number, y: number): void {
    this.events.nodePositionChanged.next({ nodeId, x, y });
  }

  /**
   * Emit edge created event
   */
  emitEdgeCreated(edgeId: string, source: string, target: string): void {
    this.events.edgeCreated.next({ edgeId, source, target });
  }

  /**
   * Emit edge removed event
   */
  emitEdgeRemoved(edgeId: string): void {
    this.events.edgeRemoved.next({ edgeId });
  }

  /**
   * Emit zoom changed event
   */
  emitZoomChanged(scale: number, panX: number, panY: number): void {
    this.events.zoomChanged.next({ scale, panX, panY });
  }

  /**
   * Emit plugin initialized event
   */
  emitPluginInitialized(pluginName: string): void {
    this.events.pluginInitialized.next({ pluginName });
  }

  /**
   * Cleanup all subscriptions
   */
  destroy(): void {
    Object.values(this.events).forEach(subject => {
      subject.complete();
    });
  }
}