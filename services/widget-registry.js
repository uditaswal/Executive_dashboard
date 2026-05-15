/**
 * Widget Registry — Central registry for custom widget type renderers, enabling pluggable chart/table/summary/KPI components.
 * Supports dynamic widget type registration and lookup, allowing future extensibility for new visualization types.
 * Decouples widget rendering logic from core app, enabling modular architecture and independent widget development.
 */

window.WidgetRegistry = (() => {
    const registry = {};

    return {
        register(type, renderer) {
            registry[type] = renderer;
        },
        render(widget, context) {
            const renderer =
                registry[widget.type];

            if (!renderer) {
                throw new Error(`No widget renderer registered for ${widget.type}`);
            }

            return renderer(widget, context);
        }
    };
})();
