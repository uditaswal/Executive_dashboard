window.CacheService = (() => {
    const state = {
        aggregates: {}
    };

    const normalizeKey = (parts) =>
        parts
            .filter(Boolean)
            .join("::");

    return {
        clear() {
            state.aggregates = {};
        },
        buildKey({
            dataset,
            cacheKey,
            filters
        }) {
            return normalizeKey([
                dataset,
                cacheKey,
                JSON.stringify(filters || {})
            ]);
        },
        get(key) {
            return state.aggregates[key];
        },
        set(key, value) {
            state.aggregates[key] = value;
            return value;
        },
        remember(key, factory) {
            if (
                Object.prototype.hasOwnProperty.call(
                    state.aggregates,
                    key
                )
            ) {
                return state.aggregates[key];
            }

            const value =
                factory();
            state.aggregates[key] =
                value;
            return value;
        }
    };
})();
