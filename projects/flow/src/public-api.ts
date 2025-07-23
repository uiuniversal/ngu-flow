/*
 * Public API Surface of flow
 */

// Core framework components and services
export * from './lib/flow.service';
export * from './lib/flow.component';
export * from './lib/flow-child.component';
export * from './lib/flow-interface';
export * from './lib/svg';
export * from './lib/dot.directive';

// Plugins
export { FitToWindow } from './lib/plugins/fit-to-window';
export { ScrollIntoView } from './lib/plugins/scroll-into-view';
export { Arrangements } from './lib/plugins/arrangements';
export { FlowConfig, FlowPlugin } from './lib/plugins/plugin';

// Core architecture exports for advanced usage
export * from './lib/core/entities';
export * from './lib/core/use-cases';
export * from './lib/adapters/interfaces';

// New plugin utilities and base classes
export * from './lib/adapters/base/base-plugin';
export * from './lib/core/utils/coordinate-transform';
export * from './lib/core/utils/geometry-utils';
export * from './lib/core/config/plugin-config';
export * from './lib/core/events/plugin-events';
