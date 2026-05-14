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
