window.ConfigService = (() => {
    const DASHBOARD_KEY =
        "payments-dashboard-config";
    const PROFILE_KEY =
        "payments-dashboard-export-profiles";
    const CONFIG_URL =
        "configs/default-dashboard.json";
    const PROFILES_URL =
        "configs/export-profiles.json";
    const SCHEMA =
        1;

    const safeParse = (value) => {
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    };

    const clone = (value) =>
        JSON.parse(JSON.stringify(value));

    const loadJson = async (url) => {
        const response =
            await fetch(`${url}?v=${Date.now()}`, {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(`Unable to load ${url}`);
        }

        return response.json();
    };

    const isCompatible = (config) =>
        config &&
        Number(config.schema) === SCHEMA;

    return {
        async loadDashboardConfig() {
            const defaultConfig =
                await loadJson(CONFIG_URL);
            const saved =
                safeParse(localStorage.getItem(DASHBOARD_KEY));

            if (isCompatible(saved)) {
                return saved;
            }

            return defaultConfig;
        },
        async loadExportProfiles() {
            const defaults =
                await loadJson(PROFILES_URL);
            const saved =
                safeParse(localStorage.getItem(PROFILE_KEY));

            if (isCompatible(saved)) {
                return saved;
            }

            return defaults;
        },
        saveDashboardConfig(config) {
            localStorage.setItem(
                DASHBOARD_KEY,
                JSON.stringify(config)
            );
        },
        saveExportProfiles(profiles) {
            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(profiles)
            );
        },
        resetToDefault() {
            localStorage.removeItem(DASHBOARD_KEY);
            localStorage.removeItem(PROFILE_KEY);
        },
        createWidgetId() {
            return window.crypto?.randomUUID
                ? window.crypto.randomUUID()
                : `widget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        },
        clone,
        schema: SCHEMA
    };
})();
