/**
 * Base interface for plugin configuration
 */
export interface BasePluginConfig {
  enabled?: boolean;
  priority?: number;
}

/**
 * Plugin configuration manager with validation and defaults
 */
export class PluginConfigManager<T extends BasePluginConfig> {
  private config: T;
  private defaults: T;

  constructor(defaults: T, initialConfig?: Partial<T>) {
    this.defaults = { ...defaults };
    this.config = { ...defaults, ...initialConfig };
  }

  /**
   * Get the current configuration
   */
  getConfig(): T {
    return { ...this.config };
  }

  /**
   * Update configuration with validation
   */
  updateConfig(updates: Partial<T>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.config = { ...this.defaults };
  }

  /**
   * Get a specific config value with fallback
   */
  getValue<K extends keyof T>(key: K, fallback?: T[K]): T[K] {
    const value = this.config[key];
    return value !== undefined ? value : (fallback !== undefined ? fallback : this.defaults[key]);
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    const enabled = this.getValue('enabled', true);
    return enabled !== undefined ? enabled : true;
  }

  /**
   * Get plugin priority
   */
  getPriority(): number {
    const priority = this.getValue('priority', 0);
    return priority !== undefined ? priority : 0;
  }
}

/**
 * Priority-based configuration resolver
 */
export class ConfigResolver {
  /**
   * Resolve value using priority system: specific > config > default
   */
  static resolve<T>(
    specificValue: T | undefined,
    configValue: T | undefined, 
    defaultValue: T
  ): T {
    if (specificValue !== undefined) return specificValue;
    if (configValue !== undefined) return configValue;
    return defaultValue;
  }

  /**
   * Resolve configuration from multiple sources with priority
   */
  static resolveConfig<T extends Record<string, any>>(
    sources: Array<Partial<T> | undefined>,
    defaults: T
  ): T {
    let resolved = { ...defaults };
    
    // Apply sources in order (later sources override earlier ones)
    sources.forEach(source => {
      if (source) {
        Object.keys(source).forEach(key => {
          if (source[key] !== undefined) {
            (resolved as any)[key] = (source as any)[key];
          }
        });
      }
    });

    return resolved;
  }
}

/**
 * Standard plugin configurations
 */
export interface ArrangementsConfig extends BasePluginConfig {
  layoutAlgorithm?: string;
  autoArrange?: boolean;
  verticalPadding?: number;
  horizontalPadding?: number;
}

export interface ConnectionsConfig extends BasePluginConfig {
  connectionMode?: 'flexible' | 'strict';
  arrowSize?: number;
  strokeWidth?: number;
}

export interface FitToWindowConfig extends BasePluginConfig {
  containerPadding?: number;
  maxScale?: number;
  minScale?: number;
}

export interface ScrollIntoViewConfig extends BasePluginConfig {
  animationDuration?: number;
  offset?: { x: number; y: number };
}