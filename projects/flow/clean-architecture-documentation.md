# Ngu-Flow: Clean Architecture Refactoring Documentation

## 1. Introduction: Why Clean Architecture for Ngu-Flow?

Clean Architecture, as popularized by Robert C. Martin (Uncle Bob), is a software design philosophy that promotes separation of concerns by organizing code into concentric layers. The core idea is that dependencies should always point inwards, meaning inner layers have no knowledge of outer layers.

For `ngu-flow`, adopting a clean architecture offers significant benefits:

*   **Maintainability:** Changes in UI (e.g., switching from Angular to React) or data persistence (e.g., saving flow data to a database) will not affect the core business logic.
*   **Testability:** Business rules (Use Cases) can be tested independently of the UI, database, or external frameworks, leading to faster and more reliable tests.
*   **Flexibility & Extensibility:** New features or plugins can be added with minimal impact on existing code, as the core logic is isolated.
*   **Plugin Focus:** The architecture naturally supports a robust plugin system, allowing plugins to interact with the core logic through well-defined interfaces without tightly coupling to the Angular framework.
*   **Technology Independence:** The core logic becomes independent of Angular, making it potentially reusable in other contexts or easier to migrate in the future.

## 2. Proposed Architectural Layers for Ngu-Flow

We will structure `ngu-flow` into four primary layers, moving from the innermost (most abstract) to the outermost (most concrete):

### 2.1. Entities (Core Business Rules)

*   **Purpose:** Encapsulate the enterprise-wide business rules. These are the most stable parts of the application and should have no dependencies on any other layer.
*   **Ngu-Flow Mapping:** This layer will contain the fundamental data structures and core definitions of the flow library.
    *   `FlowNode` (interface)
    *   `FlowEdge` (interface)
    *   `Dot` (interface)
    *   `Arrow` (interface)
    *   `FlowConfig` (class, but only its data properties and default values; any behavior related to plugins or framework specifics should be moved out).
    *   Any other pure data models or fundamental types that define the flow diagram itself.

### 2.2. Use Cases (Application Business Rules / Interactors)

*   **Purpose:** Contain application-specific business rules. These orchestrate the flow of data to and from the Entities, and direct them to accomplish the goals of the application. They are independent of the UI and database.
*   **Ngu-Flow Mapping:** This layer will house the core logic for manipulating the flow diagram, independent of Angular components or services.
    *   **FlowManager (or similar service):** This will be a plain TypeScript class (not an Angular `Injectable`) responsible for:
        *   Managing the state of `FlowNodes` and `FlowEdges`.
        *   Implementing core logic for node manipulation (add, remove, update position).
        *   Implementing core logic for edge manipulation (add, remove, connect).
        *   Handling zoom and pan calculations (`_setZoom` logic from `FlowComponent`).
        *   Orchestrating layout algorithms (these algorithms themselves could be separate modules, potentially even plugins, but their application would be a Use Case).
        *   Providing interfaces for plugins to interact with the core flow state (e.g., `registerPlugin`, `triggerPluginHook`).
    *   **Interfaces for Adapters:** Define interfaces that the outer layers (Adapters) must implement to interact with the Use Cases (e.g., `IFlowPresenter`, `IFlowGateway`).

### 2.3. Adapters (Interface Adapters / Presenters / Gateways)

*   **Purpose:** Convert data from the format most convenient for the Use Cases and Entities to the format most convenient for the Frameworks & Drivers, and vice versa. This layer includes Presenters, View Models, and Gateways (e.g., database interfaces).
*   **Ngu-Flow Mapping:** This layer will contain Angular-specific services and components that act as intermediaries between the Angular framework and the core Use Cases.
    *   **`FlowService` (Angular `Injectable`):** This service will be significantly refactored.
        *   It will no longer contain core business logic (like `update` or `_setZoom`). Instead, it will *delegate* these operations to the `FlowManager` (Use Case).
        *   It will primarily act as a **Presenter** and **Gateway**:
            *   **Presenter:** Expose observables (`scaleChange`, `panChange`, `nodePositionChange`) that the `FlowComponent` (UI) can subscribe to.
            *   **Gateway:** Provide methods for the `FlowComponent` to call, which in turn call the `FlowManager` (e.g., `flowService.updateNodePosition(node)` would call `flowManager.updateNodePosition(node)`).
            *   Handle browser events (e.g., `mousemove`, `wheel`) and translate them into calls to the `FlowManager`.
    *   **`FlowPlugin` (Interface):** This interface will remain in this layer. Concrete plugins will implement this interface and act as adapters, translating framework-specific events or data into calls to the Use Cases, or reacting to Use Case outputs.
    *   **`Connections` (Plugin):** This concrete plugin will live here, interacting with the `FlowManager` to get node positions and then using the Frameworks & Drivers layer to render SVG paths.

### 2.4. Frameworks & Drivers (UI / Database / External Services)

*   **Purpose:** The outermost layer, containing frameworks and tools like the Web, UI, Database, and any generic external services. This layer should contain minimal code and simply adapt to the inner layers.
*   **Ngu-Flow Mapping:** This layer will contain the Angular components responsible for rendering and direct DOM manipulation.
    *   **`FlowComponent`:** This component will primarily be a **View**.
        *   It will subscribe to observables exposed by the `FlowService` (Adapter) to update its view (e.g., `zoomContainer` transform).
        *   It will capture user input (e.g., `mousedown`, `wheel` events) and pass them to the `FlowService` (Adapter).
        *   It will be responsible for rendering the SVG elements and child components based on the data provided by the `FlowService`.
    *   **`FlowChildComponent`:** Remains largely the same, acting as a wrapper for individual nodes and handling their drag interactions, passing events to the `FlowService`.
    *   **`MinimapComponent`:** A UI component that interacts with the `FlowService`.
    *   **`svg.ts`:** Utility functions for SVG path generation (`blendCorners`) will reside here, as they are specific to the rendering technology.

## 3. Plugin Architecture within Clean Architecture

The plugin system is central to `ngu-flow`. In a clean architecture, plugins should not violate the dependency rule (dependencies point inwards).

*   **`FlowPlugin` Interface:** This interface will reside in the **Adapters** layer. It defines the contract for how plugins can interact with the `FlowComponent` (Frameworks & Drivers) and the `FlowService` (Adapter).
*   **Plugin Implementation:** Concrete plugins (e.g., `Connections`, `Arrangements`, `FitToWindow`) will live in the **Adapters** layer. They will:
    *   Receive `FlowComponent` and `FlowService` instances (or relevant parts of them) in their lifecycle hooks.
    *   Call methods on the `FlowService` (Adapter) to trigger Use Case logic (e.g., `flowService.updateNodePosition`).
    *   Access data from the `FlowService` (Adapter) to perform their rendering or logic.
    *   Potentially interact directly with the `FlowComponent`'s DOM elements for rendering purposes (e.g., drawing SVG paths).
*   **Dependency Inversion Principle:** For plugins that need to *provide* core functionality (e.g., a new layout algorithm), the Use Case layer would define an interface (e.g., `ILayoutAlgorithm`). The plugin (in the Adapters layer) would implement this interface, and the Use Case would depend on the interface, not the concrete plugin.

## 4. High-Level Refactoring Steps

1.  **Define Entities:** Extract `FlowNode`, `FlowEdge`, `Dot`, `Arrow`, and a clean `FlowConfig` into a new, framework-agnostic directory (e.g., `projects/flow/src/core/entities`). Ensure no Angular imports.
2.  **Create Use Cases Layer:** Introduce a new directory (e.g., `projects/flow/src/core/use-cases`). Create a `FlowManager` class (plain TS) that encapsulates the core logic for flow manipulation, zoom/pan calculations, and state management. It will operate solely on the Entities.
3.  **Refactor `FlowService` (Adapter):** Move `FlowService` to the Adapters layer (e.g., `projects/flow/src/adapters`). Modify it to:
    *   Inject the `FlowManager` (Use Case).
    *   Delegate all core logic calls to `FlowManager`.
    *   Expose observables for UI updates.
    *   Handle browser events and translate them into `FlowManager` calls.
4.  **Refactor `FlowComponent` (Frameworks & Drivers):** Keep `FlowComponent` in its current location (e.g., `projects/flow/src/lib`). Modify it to:
    *   Inject the refactored `FlowService`.
    *   Subscribe to `FlowService` observables for rendering updates.
    *   Pass user input events to `FlowService`.
    *   Remove all business logic and direct state management.
5.  **Refactor Plugins:** Move concrete plugins (e.g., `Connections`) to the Adapters layer. Ensure they interact with the `FlowManager` via the `FlowService` and use `FlowComponent` only for rendering.
6.  **Update `svg.ts`:** Keep `svg.ts` in the Frameworks & Drivers layer, as it's a rendering utility.
7.  **Testing:** Implement unit tests for the Use Cases layer (e.g., `FlowManager`) without any Angular dependencies. Integration tests can then cover the Adapters and Frameworks layers.

This refactoring will create a more robust, testable, and maintainable `ngu-flow` library, ready for future enhancements and a truly pluggable architecture.