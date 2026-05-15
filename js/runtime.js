/**
 * Runtime Initialization & Startup Logic — Configures dashboard sections, loads Excel data, and orchestrates initial render sequence.
 * Handles IIFE module setup, user workbook upload, and auto-load for local development testing.
 * Bridges Excel data -> APP state -> UI rendering and coordinates with TabManager for dynamic section configuration.
 */

(function () {
    const SECTION_DEFS = {
        overview: {
            id: "overview",
            title: "Overview",
            icon: "Overview",
            dataset: "incidents",
            filters: ["month", "partner"]
        },
        incidents: {
            id: "incidents",
            title: "Incidents",
            icon: "Incidents",
            dataset: "incidents",
            filters: ["month", "partner", "status", "country", "search"]
        },
        rejections: {
            id: "rejections",
            title: "Rejections",
            icon: "Rejections",
            dataset: "rejections",
            filters: ["month", "partner", "deliveryService", "bankName", "bankCode", "country", "status", "search"]
        },
        "vendor-rca": {
            id: "vendor-rca",
            title: "Vendor RCA",
            icon: "Vendor RCA",
            dataset: "incidents",
            filters: ["month", "partner", "search"]
        },
        "executive-summary": {
            id: "executive-summary",
            title: "Executive Summary",
            icon: "Executive Summary",
            dataset: "incidents",
            filters: ["month", "partner"]
        }
    };

    const FILTER_LABELS = {
        month: "Month",
        partner: "Partner",
        status: "Status",
        country: "Country",
        search: "Search",
        deliveryService: "Delivery Service",
        bankName: "Bank Name",
        bankCode: "Bank Code"
    };

    const debounce = (fn, wait = 300) => {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), wait);
        };
    };

    APP.RUNTIME = {
        state: {
            activeSection: "overview",
            initializedSections: {},
            dashboardConfig: null,
            exportProfiles: null,
            globalFilters: {
                incidents: {
                    month: "",
                    partner: "",
                    status: "",
                    country: "",
                    search: ""
                },
                rejections: {
                    month: "",
                    partner: "",
                    deliveryService: "",
                    bankName: "",
                    bankCode: "",
                    country: "",
                    status: "",
                    search: ""
                }
            }
        },
        dataVersion: "2026.05",
        getSectionWidgets(sectionId) {
            return (APP.RUNTIME.state.dashboardConfig?.widgets || [])
                .filter((widget) =>
                    widget.section === sectionId &&
                    widget.visible !== false
                )
                .sort((a, b) =>
                    (a.layout?.order || 0) - (b.layout?.order || 0)
                );
        },
        syncDatasets() {
            APP.datasets = APP.datasets || {};
            APP.datasets.incidents =
                APP.DATA.slice();
            APP.datasets.rejections =
                APP.filteredRejections.slice();
        },
        getFilterRows(dataset) {
            return dataset === "rejections"
                ? APP.REJECTIONS
                : APP.RAW;
        },
        applyRuntimeFilters() {
            const incidentFilters =
                APP.RUNTIME.state.globalFilters.incidents;
            const rejectionFilters =
                APP.RUNTIME.state.globalFilters.rejections;

            APP.DATA = APP.RAW.filter((row) => {
                const month =
                    APP.rowValue(row, "Month");
                const partner =
                    APP.rowValue(row, "Partner");
                const status =
                    APP.rowValue(row, "Status");
                const country =
                    APP.rowValue(row, "Receive Country");
                const searchTarget =
                    JSON.stringify(row).toLowerCase();

                return (
                    (!incidentFilters.month || month === incidentFilters.month) &&
                    (!incidentFilters.partner || partner === incidentFilters.partner) &&
                    (!incidentFilters.status || status === incidentFilters.status) &&
                    (!incidentFilters.country || country === incidentFilters.country) &&
                    (!incidentFilters.search || searchTarget.includes(incidentFilters.search.toLowerCase()))
                );
            });

            APP.filteredRejections =
                APP.REJECTIONS.filter((row) => {
                    const month =
                        APP.rowValue(row, "MONTH");
                    const partner =
                        APP.rowValue(row, "PARTNERNAME");
                    const deliveryService =
                        APP.rowValue(row, "DELIVERYSERVICE");
                    const bankName =
                        APP.rowValue(row, "BANKNAME");
                    const bankCode =
                        APP.rowValue(row, "BANKCODE");
                    const country =
                        APP.rowValue(row, "RECEIVECOUNTRYCODE");
                    const status =
                        APP.rowValue(row, "SUBSTATE");
                    const searchTarget =
                        JSON.stringify(row).toLowerCase();

                    return (
                        (!rejectionFilters.month || month === rejectionFilters.month) &&
                        (!rejectionFilters.partner || partner === rejectionFilters.partner) &&
                        (!rejectionFilters.deliveryService || deliveryService === rejectionFilters.deliveryService) &&
                        (!rejectionFilters.bankName || bankName === rejectionFilters.bankName) &&
                        (!rejectionFilters.bankCode || bankCode === rejectionFilters.bankCode) &&
                        (!rejectionFilters.country || country === rejectionFilters.country) &&
                        (!rejectionFilters.status || status === rejectionFilters.status) &&
                        (!rejectionFilters.search || searchTarget.includes(rejectionFilters.search.toLowerCase()))
                    );
                });

            APP.RUNTIME.syncDatasets();
            CacheService.clear();
        },
        renderNav() {
            const nav =
                APP.g("reportNav");

            if (!nav) return;

            nav.innerHTML =
                Object.values(SECTION_DEFS).map((section) => `
<button class="runtime-nav-btn ${APP.RUNTIME.state.activeSection === section.id ? "active" : ""}" data-runtime-section="${section.id}" title="${APP.escape(section.title)}">
    <span>${APP.escape(section.title)}</span>
</button>
`).join("");

            nav.querySelectorAll("[data-runtime-section]")
                .forEach((button) => {
                    button.onclick = () => {
                        APP.RUNTIME.state.activeSection =
                            button.dataset.runtimeSection;
                        APP.RUNTIME.renderShell();
                    };
                });
        },
        filterOptionsFor(dataset, filterName) {
            const rows =
                APP.RUNTIME.getFilterRows(dataset);
            const fieldMap = {
                incidents: {
                    month: "Month",
                    partner: "Partner",
                    status: "Status",
                    country: "Receive Country"
                },
                rejections: {
                    month: "MONTH",
                    partner: "PARTNERNAME",
                    deliveryService: "DELIVERYSERVICE",
                    bankName: "BANKNAME",
                    bankCode: "BANKCODE",
                    country: "RECEIVECOUNTRYCODE",
                    status: "SUBSTATE"
                }
            };
            const field =
                fieldMap[dataset]?.[filterName];

            if (!field) return [];

            return APP.u(
                rows.map((row) =>
                    APP.rowValue(row, field)
                )
            );
        },
        renderFilters() {
            const section =
                SECTION_DEFS[APP.RUNTIME.state.activeSection];
            const box =
                APP.g("sectionFilters");

            if (!section || !box) return;

            const filterState =
                APP.RUNTIME.state.globalFilters[section.dataset];

            box.innerHTML =
                section.filters.map((filterName) => {
                    if (filterName === "search") {
                        return `
<label class="runtime-filter">
    <span>${FILTER_LABELS[filterName]}</span>
    <input id="runtime-filter-${filterName}" value="${APP.escape(filterState[filterName] || "")}" placeholder="Search ${section.title}">
</label>`;
                    }

                    const options =
                        APP.RUNTIME.filterOptionsFor(
                            section.dataset,
                            filterName
                        );

                    return `
<label class="runtime-filter">
    <span>${FILTER_LABELS[filterName]}</span>
    <select id="runtime-filter-${filterName}">
        <option value="">All ${FILTER_LABELS[filterName]}</option>
        ${options.map((option) => `<option value="${APP.escape(option)}" ${filterState[filterName] === option ? "selected" : ""}>${APP.escape(option)}</option>`).join("")}
    </select>
</label>`;
                }).join("");

            section.filters.forEach((filterName) => {
                const el =
                    APP.g(`runtime-filter-${filterName}`);
                if (!el) return;
                const update =
                    () => {
                        filterState[filterName] = el.value;
                        APP.RUNTIME.debouncedRefresh();
                    };
                if (filterName === "search") {
                    el.oninput = update;
                } else {
                    el.onchange = update;
                }
            });
        },
        metrics() {
            const incidentRows =
                APP.datasets.incidents || [];
            const rejectionRows =
                APP.datasets.rejections || [];

            const topIncidentPartner =
                Object.entries(
                    PivotEngine.groupCount(incidentRows, "Partner")
                ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

            const topRejectPartner =
                Object.entries(
                    PivotEngine.groupCount(rejectionRows, "PARTNERNAME")
                ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

            const topRejectBank =
                Object.entries(
                    PivotEngine.groupCount(rejectionRows, "BANKNAME")
                ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

            return {
                period: APP.getReviewPeriod ? APP.getReviewPeriod() : "Current",
                incidentCount: incidentRows.length,
                rejectionCount: rejectionRows.length,
                topIncidentPartner,
                topRejectPartner,
                topRejectBank
            };
        },
        template(text, data) {
            return String(text || "").replace(/\{\{(.*?)\}\}/g, (_, key) => {
                const value =
                    data[key.trim()];
                return value == null ? "" : value;
            });
        },
        chartAggregate(widget) {
            const rows =
                APP.datasets[widget.dataset] || [];
            const filters =
                APP.RUNTIME.state.globalFilters[widget.dataset];
            const cacheId =
                CacheService.buildKey({
                    dataset: widget.dataset,
                    cacheKey: widget.cacheKey || `${widget.type}-${widget.rows?.join("-")}`,
                    filters
                });

            return CacheService.remember(cacheId, () => {
                const groupField =
                    widget.rows?.[0];
                if (
                    groupField &&
                    /month/i.test(groupField)
                ) {
                    return PivotEngine.monthlyCounts({
                        rows,
                        field: groupField
                    });
                }

                const entries =
                    PivotEngine.groupedEntries({
                        rows,
                        field: groupField,
                        topN: widget.topN
                    });

                return {
                    labels: entries.map(([label]) => label),
                    values: entries.map(([, value]) => value)
                };
            });
        },
        renderChartWidget(widget, context) {
            const aggregate =
                APP.RUNTIME.chartAggregate(widget);
            const canvasId =
                `${widget.id}-canvas`;

            context.body.innerHTML =
                `<canvas id="${canvasId}" height="280"></canvas>`;

            const canvas =
                APP.g(canvasId);

            if (!canvas) return;

            APP.charts[widget.id]?.destroy?.();
            APP.charts[widget.id] =
                new Chart(canvas, {
                    type: widget.chartType || "bar",
                    data: {
                        labels: aggregate.labels,
                        datasets: [{
                            label: widget.title,
                            data: aggregate.values,
                            backgroundColor: widget.dataset === "rejections" ? "#dc2626" : "#2563eb",
                            borderColor: widget.dataset === "rejections" ? "#f97316" : "#1d4ed8",
                            borderRadius: 8
                        }]
                    },
                    options: APP.chartOptions(widget.title, widget.chartType === "pie" || widget.chartType === "doughnut"
                        ? { scales: {} }
                        : {})
                });
            APP.chartTitles =
                APP.chartTitles || {};
            APP.chartTitles[widget.id] =
                widget.title;
        },
        renderKpiWidget(widget, context) {
            const metrics =
                APP.RUNTIME.metrics();
            const value =
                metrics[widget.metric] ?? "N/A";
            context.body.innerHTML = `
<div class="widget-kpi-value">${APP.escape(String(value))}</div>
<div class="widget-kpi-note">${APP.escape(widget.dataset === "rejections" ? "Rejection dataset" : "Incident dataset")}</div>
`;
        },
        renderSummaryWidget(widget, context) {
            const metrics =
                APP.RUNTIME.metrics();
            context.body.innerHTML =
                `<div class="widget-summary">${APP.escape(APP.RUNTIME.template(widget.template, metrics))}</div>`;
        },
        renderLegacyWidget(widget, context) {
            const legacyMap = {
                vendor: APP.getOverviewTables?.().find((table) => /Vendor/i.test(table.title))
            };
            const table =
                legacyMap[widget.legacyView];

            if (!table) {
                throw new Error("Legacy adapter data is unavailable.");
            }

            context.body.innerHTML =
                `<div class="data-table-scroll"><table class="data-table"><thead><tr>${table.headers.map((header) => `<th>${APP.escape(header)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${APP.escape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
        },
        renderTableWidget(widget, context) {
            const mountId =
                `${widget.id}-table`;
            context.body.innerHTML =
                `<div id="${mountId}" class="table-mount"></div>`;

            const rows =
                (APP.datasets[widget.dataset] || []).map((row) => {
                    const out = {};
                    (widget.columns || []).forEach((column) => {
                        out[column] =
                            APP.rowValue(row, column);
                    });
                    return out;
                });

            const mount =
                APP.g(mountId);
            if (!mount) return;

            if (context.section === "rejections" && window.Tabulator) {
                APP.RUNTIME.tabulators =
                    APP.RUNTIME.tabulators || {};

                if (APP.RUNTIME.tabulators[widget.id]) {
                    APP.RUNTIME.tabulators[widget.id].destroy();
                }

                APP.RUNTIME.tabulators[widget.id] =
                    new Tabulator(mount, {
                        data: rows,
                        layout: "fitColumns",
                        pagination: true,
                        paginationSize: 100,
                        reactiveData: false,
                        height: 420,
                        columns: (widget.columns || []).map((column) => ({
                            title: column,
                            field: column,
                            headerFilter: false
                        }))
                    });
                return;
            }

            const headers =
                widget.columns || [];
            mount.innerHTML =
                `<div class="data-table-scroll"><table class="data-table"><thead><tr>${headers.map((header) => `<th>${APP.escape(header)}</th>`).join("")}</tr></thead><tbody>${rows.slice(0, 200).map((row) => `<tr>${headers.map((header) => `<td>${APP.escape(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
        },
        renderWidget(widget) {
            const card =
                document.createElement("article");
            const width =
                widget.layout?.width || 12;
            card.className =
                `widget-card widget-span-${width >= 12 ? 12 : width >= 8 ? 8 : width >= 6 ? 6 : 4} ${widget.dataset === "rejections" ? "rejections-theme" : "incidents-theme"}`;
            card.dataset.widgetId =
                widget.id;

            const head =
                document.createElement("div");
            head.className = "widget-head";
            head.innerHTML =
                `<h3>${APP.escape(widget.title)}</h3><span>${APP.escape(widget.type)}</span>`;

            const body =
                document.createElement("div");
            body.className = "widget-body";

            card.appendChild(head);
            card.appendChild(body);

            try {
                if (
                    widget.dataVersion &&
                    widget.dataVersion !== APP.RUNTIME.dataVersion
                ) {
                    throw new Error(`Widget dataVersion ${widget.dataVersion} does not match runtime dataVersion ${APP.RUNTIME.dataVersion}.`);
                }
                WidgetRegistry.render(widget, {
                    card,
                    body,
                    section: APP.RUNTIME.state.activeSection
                });
            } catch (error) {
                body.innerHTML =
                    `<div class="widget-fallback">Unable to render "${APP.escape(widget.title)}". ${APP.escape(error.message || "Unknown widget error.")}</div>`;
            }

            return card;
        },
        widgetToTable(widget) {
            if (widget.type === "table") {
                const headers =
                    widget.columns || [];
                const rows =
                    (APP.datasets[widget.dataset] || []).map((row) =>
                        headers.map((header) => APP.rowValue(row, header))
                    );
                return {
                    title: widget.title,
                    headers,
                    rows
                };
            }

            if (widget.type === "chart") {
                const aggregate =
                    APP.RUNTIME.chartAggregate(widget);
                return {
                    title: widget.title,
                    headers: ["Label", "Value"],
                    rows: aggregate.labels.map((label, index) => [
                        label,
                        aggregate.values[index]
                    ])
                };
            }

            if (widget.type === "summary" || widget.type === "kpi") {
                const metrics =
                    APP.RUNTIME.metrics();
                return {
                    title: widget.title,
                    headers: ["Metric", "Value"],
                    rows: [[widget.title, widget.type === "summary"
                        ? APP.RUNTIME.template(widget.template, metrics)
                        : metrics[widget.metric] ?? "N/A"]]
                };
            }

            return null;
        },
        renderExportList() {
            const box =
                APP.g("globalExportList");
            if (!box) return;

            const groups =
                Object.values(SECTION_DEFS).map((section) => {
                    const widgets =
                        APP.RUNTIME.getSectionWidgets(section.id)
                            .filter((widget) => widget.exportable !== false);

                    return `
<div class="global-export-group">
    <h4>${APP.escape(section.title)}</h4>
    <div class="global-export-items">
        ${widgets.map((widget) => `
        <label class="global-export-item">
            <input type="checkbox" class="global-export-check" value="${APP.escape(widget.id)}" checked>
            <span>${APP.escape(widget.title)}</span>
        </label>`).join("")}
    </div>
</div>`;
                }).join("");

            box.innerHTML = groups;
        },
        renderSection() {
            const host =
                APP.g("sectionContent");
            if (!host) return;

            const widgets =
                APP.RUNTIME.getSectionWidgets(
                    APP.RUNTIME.state.activeSection
                );

            const grid =
                document.createElement("div");
            grid.className = "widget-grid";
            widgets.forEach((widget) => {
                grid.appendChild(
                    APP.RUNTIME.renderWidget(widget)
                );
            });

            host.innerHTML = "";
            host.appendChild(grid);
        },
        renderShell() {
            APP.RUNTIME.applyRuntimeFilters();
            APP.globalFilters =
                APP.RUNTIME.state.globalFilters;
            APP.dashboardConfig =
                APP.RUNTIME.state.dashboardConfig;
            APP.exportProfiles =
                APP.RUNTIME.state.exportProfiles;
            APP.RUNTIME.renderNav();
            APP.RUNTIME.renderFilters();
            APP.RUNTIME.renderSection();
            APP.g("count").textContent =
                `${APP.datasets.incidents.length} incidents | ${APP.datasets.rejections.length} rejections`;
        },
        bindExportModal() {
            if (APP.g("btnGlobalExportRuntime")) {
                APP.g("btnGlobalExportRuntime").onclick =
                    ExportService.openModal;
            }

            if (APP.g("btnGlobalExport")) {
                APP.g("btnGlobalExport").onclick =
                    ExportService.openModal;
            }

            if (APP.g("btnCloseExportModal")) {
                APP.g("btnCloseExportModal").onclick =
                    ExportService.closeModal;
            }

            if (APP.g("btnExportExcelGlobal")) {
                APP.g("btnExportExcelGlobal").onclick = () => {
                    const selectedIds =
                        ExportService.getSelectedWidgetIds();
                    const widgets =
                        (APP.RUNTIME.state.dashboardConfig?.widgets || [])
                            .filter((widget) => selectedIds.includes(widget.id));
                    ExportService.exportExcel(widgets);
                };
            }

            if (APP.g("btnExportPngGlobal")) {
                APP.g("btnExportPngGlobal").onclick = async () => {
                    const selectedIds =
                        ExportService.getSelectedWidgetIds();
                    const widgets =
                        (APP.RUNTIME.state.dashboardConfig?.widgets || [])
                            .filter((widget) => selectedIds.includes(widget.id));
                    await ExportService.exportPng(widgets);
                };
            }

            if (APP.g("btnExportPptGlobal")) {
                APP.g("btnExportPptGlobal").onclick = async () => {
                    const selectedIds =
                        ExportService.getSelectedWidgetIds();
                    const widgets =
                        (APP.RUNTIME.state.dashboardConfig?.widgets || [])
                            .filter((widget) => selectedIds.includes(widget.id));
                    await ExportService.exportPpt(widgets);
                };
            }
        },
        bindReset() {
            if (APP.g("btnResetDashboard")) {
                APP.g("btnResetDashboard").onclick = async () => {
                    ConfigService.resetToDefault();
                    APP.RUNTIME.state.globalFilters = {
                        incidents: {
                            month: "",
                            partner: "",
                            status: "",
                            country: "",
                            search: ""
                        },
                        rejections: {
                            month: "",
                            partner: "",
                            deliveryService: "",
                            bankName: "",
                            bankCode: "",
                            country: "",
                            status: "",
                            search: ""
                        }
                    };
                    APP.RUNTIME.state.dashboardConfig =
                        await ConfigService.loadDashboardConfig();
                    APP.RUNTIME.state.exportProfiles =
                        await ConfigService.loadExportProfiles();
                    APP.RUNTIME.renderShell();
                };
            }
        },
        debouncedRefresh: debounce(() => {
            APP.RUNTIME.renderShell();
        }, 300),
        async init() {
            WidgetRegistry.register("chart", APP.RUNTIME.renderChartWidget);
            WidgetRegistry.register("table", APP.RUNTIME.renderTableWidget);
            WidgetRegistry.register("kpi", APP.RUNTIME.renderKpiWidget);
            WidgetRegistry.register("summary", APP.RUNTIME.renderSummaryWidget);
            WidgetRegistry.register("legacy", APP.RUNTIME.renderLegacyWidget);

            APP.RUNTIME.state.dashboardConfig =
                await ConfigService.loadDashboardConfig();
            APP.RUNTIME.state.exportProfiles =
                await ConfigService.loadExportProfiles();

            APP.RUNTIME.syncDatasets();
            APP.RUNTIME.bindExportModal();
            APP.RUNTIME.bindReset();
            APP.RUNTIME.renderShell();
        }
    };

    const originalParse =
        APP.parse;
    APP.parse = (buffer) => {
        originalParse(buffer);
        APP.RUNTIME.syncDatasets();
        APP.RUNTIME.renderShell();
    };

    APP.render = () => {
        APP.RUNTIME.syncDatasets();
        APP.RUNTIME.renderShell();
    };

    window.addEventListener("load", () => {
        APP.RUNTIME.init()
            .catch((error) => {
                const box =
                    APP.g("runtimeStatus");
                if (box) {
                    box.classList.remove("hide");
                    box.textContent =
                        `Runtime initialization failed: ${error.message || error}`;
                }
            });
    });
})();
