/**
 * Config Service — Manages dashboard configuration and export profile persistence via localStorage with JSON file backup/restore.
 * Provides fetch fallback with bundled defaults for file:// origin CORS support, automatic JSON downloads, and import validation.
 * Single source of truth for widget configs, export presets, and user customization across all dashboard sessions.
 */

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

    // Bundled default dashboard config (fallback for file:// origin)
    const DEFAULT_DASHBOARD_CONFIG = {
        "schema": 1,
        "version": "1.0.0",
        "defaultSection": "overview",
        "widgets": [
            {
                "id": "overview-summary",
                "dataset": "incidents",
                "dataVersion": "2026.05",
                "section": "overview",
                "type": "summary",
                "title": "Executive Summary",
                "template": "During {{period}}, the dashboard tracks {{incidentCount}} incidents and {{rejectionCount}} rejection records. The top incident partner is {{topIncidentPartner}}, while the top rejecting partner is {{topRejectPartner}}.",
                "layout": { "width": 12, "height": 3, "order": 1 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Executive Summary",
                "dependsOn": ["globalFilters.incidents", "globalFilters.rejections"]
            },
            {
                "id": "overview-kpi-incidents",
                "dataset": "incidents",
                "dataVersion": "2026.05",
                "section": "overview",
                "type": "kpi",
                "title": "Total Incidents",
                "metric": "incidentCount",
                "layout": { "width": 4, "height": 2, "order": 2 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Overview KPI"
            },
            {
                "id": "overview-kpi-rejections",
                "dataset": "rejections",
                "dataVersion": "2026.05",
                "section": "overview",
                "type": "kpi",
                "title": "Rejection Records",
                "metric": "rejectionCount",
                "layout": { "width": 4, "height": 2, "order": 3 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Overview KPI"
            },
            {
                "id": "overview-kpi-partner",
                "dataset": "incidents",
                "dataVersion": "2026.05",
                "section": "overview",
                "type": "kpi",
                "title": "Top Incident Partner",
                "metric": "topIncidentPartner",
                "layout": { "width": 4, "height": 2, "order": 4 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Overview KPI"
            },
            {
                "id": "incidents-monthly-trend",
                "dataset": "incidents",
                "dataVersion": "2026.05",
                "section": "incidents",
                "type": "chart",
                "title": "Monthly Incident Trend",
                "chartType": "bar",
                "rows": ["Month"],
                "values": ["COUNT"],
                "layout": { "width": 8, "height": 4, "order": 1 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Monthly Incident Trend",
                "cacheKey": "incidents_by_month"
            },
            {
                "id": "incidents-by-partner",
                "dataset": "incidents",
                "dataVersion": "2026.05",
                "section": "incidents",
                "type": "chart",
                "title": "Top Incident Partners",
                "chartType": "bar",
                "rows": ["Partner"],
                "values": ["COUNT"],
                "topN": 8,
                "layout": { "width": 4, "height": 4, "order": 2 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Top Incident Partners",
                "cacheKey": "incidents_by_partner"
            },
            {
                "id": "rejections-monthly-trend",
                "dataset": "rejections",
                "dataVersion": "2026.05",
                "section": "rejections",
                "type": "chart",
                "title": "Monthly Rejection Trend",
                "chartType": "bar",
                "rows": ["MONTH"],
                "values": ["COUNT"],
                "layout": { "width": 8, "height": 4, "order": 1 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Monthly Rejection Trend",
                "cacheKey": "reject_by_month"
            },
            {
                "id": "rejections-by-bank",
                "dataset": "rejections",
                "dataVersion": "2026.05",
                "section": "rejections",
                "type": "chart",
                "title": "Top Rejections by Bank",
                "chartType": "bar",
                "rows": ["BANKNAME"],
                "values": ["COUNT"],
                "topN": 10,
                "layout": { "width": 4, "height": 4, "order": 2 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Top Rejections by Bank",
                "cacheKey": "reject_by_bank"
            },
            {
                "id": "rejections-register",
                "dataset": "rejections",
                "dataVersion": "2026.05",
                "section": "rejections",
                "type": "table",
                "title": "Rejection Register",
                "columns": ["MONTH", "PARTNERNAME", "BANKNAME", "BANKCODE", "RECEIVECOUNTRYCODE", "DELIVERYSERVICE", "SUBSTATE", "PARTNER_REJECTREASON", "APN_REJECTREASON"],
                "layout": { "width": 12, "height": 6, "order": 3 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Rejection Register",
                "cacheKey": "reject_register"
            },
            {
                "id": "vendor-rca-table",
                "dataset": "incidents",
                "dataVersion": "2026.05",
                "section": "vendor-rca",
                "type": "legacy",
                "title": "Vendor RCA View",
                "legacyView": "vendor",
                "layout": { "width": 12, "height": 5, "order": 1 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Vendor RCA"
            },
            {
                "id": "executive-summary-text",
                "dataset": "incidents",
                "dataVersion": "2026.05",
                "section": "executive-summary",
                "type": "summary",
                "title": "Executive Commentary",
                "template": "{{period}} review shows {{incidentCount}} incidents, {{rejectionCount}} rejection records, and the leading rejection bank is {{topRejectBank}}.",
                "layout": { "width": 12, "height": 3, "order": 1 },
                "visible": true,
                "createdBy": "system",
                "exportable": true,
                "slideTitle": "Executive Commentary"
            }
        ]
    };

    // Bundled export profiles config (fallback for file:// origin)
    const DEFAULT_EXPORT_PROFILES = {
        "schema": 1,
        "version": "1.0.0",
        "profiles": [
            {
                "id": "executive-review",
                "title": "Executive Review",
                "widgetIds": ["overview-summary", "overview-kpi-incidents", "overview-kpi-rejections", "executive-summary-text"]
            },
            {
                "id": "monthly-ops",
                "title": "Monthly Ops",
                "widgetIds": ["incidents-monthly-trend", "incidents-by-partner", "rejections-monthly-trend", "rejections-by-bank"]
            },
            {
                "id": "vendor-rca",
                "title": "Vendor RCA",
                "widgetIds": ["vendor-rca-table"]
            },
            {
                "id": "reject-analysis",
                "title": "Reject Analysis",
                "widgetIds": ["rejections-monthly-trend", "rejections-by-bank", "rejections-register"]
            }
        ]
    };

    const safeParse = (value) => {
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    };

    const clone = (value) =>
        JSON.parse(JSON.stringify(value));

    const downloadJson = (filename, json) => {
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadJson = async (url, bundledFallback) => {
        try {
            const response =
                await fetch(`${url}?v=${Date.now()}`, {
                    cache: "no-store"
                });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.warn(`Failed to load ${url}, using bundled fallback:`, error);
            return clone(bundledFallback);
        }
    };

    const isCompatible = (config) =>
        config &&
        Number(config.schema) === SCHEMA;

    const resetToDefault = () => {
        localStorage.removeItem(DASHBOARD_KEY);
        localStorage.removeItem(PROFILE_KEY);
    };

    const createWidgetId = () =>
        (window.crypto && typeof window.crypto.randomUUID === "function")
            ? window.crypto.randomUUID()
            : `widget-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    const importJsonFile = async (file) => {
        if (!file) {
            throw new Error("No file selected.");
        }

        const text =
            await file.text();
        const parsed =
            safeParse(text);

        if (!parsed) {
            throw new Error("Selected file is not valid JSON.");
        }

        return parsed;
    };

    const exportWorkbook = (filename, workbook) => {
        XLSX.writeFile(workbook, filename);
    };

    return {
        async loadDashboardConfig() {
            const defaultConfig =
                await loadJson(CONFIG_URL, DEFAULT_DASHBOARD_CONFIG);
            const saved =
                safeParse(localStorage.getItem(DASHBOARD_KEY));

            if (isCompatible(saved)) {
                return saved;
            }

            return defaultConfig;
        },
        async loadExportProfiles() {
            const defaults =
                await loadJson(PROFILES_URL, DEFAULT_EXPORT_PROFILES);
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
            downloadJson("payments-dashboard-config.json", config);
        },
        saveExportProfiles(profiles) {
            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(profiles)
            );
            downloadJson("payments-dashboard-export-profiles.json", profiles);
        },
        downloadDashboardConfig(config) {
            downloadJson("payments-dashboard-config.json", config);
        },
        downloadExportProfiles(profiles) {
            downloadJson("payments-dashboard-export-profiles.json", profiles);
        },
        async importDashboardConfig(file) {
            const parsed =
                await importJsonFile(file);

            if (!isCompatible(parsed)) {
                throw new Error("Dashboard config schema is not compatible.");
            }

            localStorage.setItem(
                DASHBOARD_KEY,
                JSON.stringify(parsed)
            );

            return parsed;
        },
        async importExportProfiles(file) {
            const parsed =
                await importJsonFile(file);

            if (!isCompatible(parsed)) {
                throw new Error("Export profiles schema is not compatible.");
            }

            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(parsed)
            );

            return parsed;
        },
        resetToDefault,
        createWidgetId,
        exportWorkbook
    };
})();
