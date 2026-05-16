/**
 * Config-Driven Widget Renderer
 * Renders widgets based on configuration
 * Supports charts, tables, KPIs, and summaries
 */

APP.WidgetRenderer = {
    /**
     * Render a widget based on its config
     */
    renderWidget: function (config, container) {
        if (!config || !container) return null;

        try {
            switch (config.type) {
                case "chart":
                    return this.renderChart(config, container);
                case "table":
                    return this.renderTable(config, container);
                case "kpi":
                    return this.renderKPI(config, container);
                case "summary":
                    return this.renderSummary(config, container);
                default:
                    console.warn("Unknown widget type:", config.type);
                    return null;
            }
        } catch (error) {
            console.error("Widget rendering error:", error, config);
            return this.renderFallback(config, container, error);
        }
    },

    /**
     * Render a chart widget
     */
    renderChart: function (config, container) {
        const canvas = document.createElement("canvas");
        canvas.id = config.id || "chart-" + Math.random();
        container.appendChild(canvas);

        // Get data based on dataset
        const dataset = config.dataset === "rejections"
            ? APP.filteredRejections
            : APP.DATA;

        // Build chart data based on config
        const chartData = this.buildChartData(config, dataset);

        // Create Chart.js instance
        const chart = new Chart(canvas, {
            type: config.chartType || "bar",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: config.title || ""
                    }
                }
            }
        });

        return chart;
    },

    /**
     * Build chart data from config and dataset
     */
    buildChartData: function (config, dataset) {
        const labels = [];
        const data = [];
        const dataMap = {};

        // Group data by rows field
        dataset.forEach(row => {
            const key = APP.getValue(row, config.rows[0]) || "Unknown";
            dataMap[key] = (dataMap[key] || 0) + 1;
        });

        // Convert to array and sort by value descending
        let entries = Object.entries(dataMap);
        entries.sort((a, b) => b[1] - a[1]);

        // Limit to topN if specified (post-aggregation, post-sort)
        if (config.topN) {
            if (config.groupBy) {
                // Apply Top N per group if grouped data exists
                const groupedEntries = {};
                entries.forEach(([key, value]) => {
                    const group = key.split(config.groupBy)[0];
                    if (!groupedEntries[group]) {
                        groupedEntries[group] = [];
                    }
                    groupedEntries[group].push([key, value]);
                });

                entries = Object.values(groupedEntries).flatMap(group =>
                    group.sort((a, b) => b[1] - a[1]).slice(0, config.topN)
                );
            } else {
                entries = entries.slice(0, config.topN);
            }
        }

        // Extract labels and data from sorted entries
        entries.forEach(([key, value]) => {
            labels.push(key);
            data.push(value);
        });

        return {
            labels: labels,
            datasets: [{
                label: config.title || "Data",
                data: data,
                backgroundColor: "rgba(79, 70, 229, 0.8)",
                borderColor: "rgba(79, 70, 229, 1)",
                borderWidth: 1
            }]
        };
    },

    /**
     * Render a table widget
     */
    renderTable: function (config, container) {
        const table = document.createElement("table");
        table.className = "data-table";
        table.id = config.id || "table-" + Math.random();

        const dataset = config.dataset === "rejections"
            ? APP.filteredRejections
            : APP.DATA;

        if (!dataset.length) {
            container.appendChild(document.createTextNode("No data available"));
            return null;
        }

        // Create header
        const headerRow = table.createTHead().insertRow();
        const columns = config.columns || Object.keys(dataset[0]);
        columns.forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            headerRow.appendChild(th);
        });

        // Create body
        const tbody = table.createTBody();
        dataset.slice(0, config.limit || 100).forEach(row => {
            const tr = tbody.insertRow();
            columns.forEach(col => {
                const td = tr.insertCell();
                td.textContent = APP.getValue(row, col) || "";
            });
        });

        container.appendChild(table);
        return table;
    },

    /**
     * Render a KPI widget
     */
    renderKPI: function (config, container) {
        const kpiBox = document.createElement("div");
        kpiBox.className = "kpi-widget";
        kpiBox.id = config.id || "kpi-" + Math.random();

        const dataset = config.dataset === "rejections"
            ? APP.filteredRejections
            : APP.DATA;

        let value = dataset.length;

        // Calculate specific metrics
        if (config.metric === "topIncidentPartner") {
            const partnerMap = {};
            dataset.forEach(row => {
                const partner = APP.getValue(row, "Partner") || "Unknown";
                partnerMap[partner] = (partnerMap[partner] || 0) + 1;
            });
            value = Object.keys(partnerMap).sort((a, b) => partnerMap[b] - partnerMap[a])[0] || "N/A";
        } else if (config.metric === "topRejectPartner") {
            const partnerMap = {};
            dataset.forEach(row => {
                const partner = APP.getValue(row, "PARTNERNAME") || "Unknown";
                partnerMap[partner] = (partnerMap[partner] || 0) + 1;
            });
            value = Object.keys(partnerMap).sort((a, b) => partnerMap[b] - partnerMap[a])[0] || "N/A";
        }

        kpiBox.innerHTML = `
            <div class="kpi-label">${APP.escape(config.title || "KPI")}</div>
            <div class="kpi-value">${APP.escape(String(value))}</div>
        `;

        container.appendChild(kpiBox);
        return kpiBox;
    },

    /**
     * Render a summary widget
     */
    renderSummary: function (config, container) {
        const summaryBox = document.createElement("div");
        summaryBox.className = "summary-widget";
        summaryBox.id = config.id || "summary-" + Math.random();

        let text = config.template || "";

        const dataset = config.dataset === "rejections"
            ? APP.filteredRejections
            : APP.DATA;

        // Replace template variables
        const incidentCount = APP.DATA.length;
        const rejectionCount = APP.filteredRejections.length;

        const partnerMap = {};
        APP.DATA.forEach(row => {
            const partner = APP.getValue(row, "Partner") || "Unknown";
            partnerMap[partner] = (partnerMap[partner] || 0) + 1;
        });
        const topIncidentPartner = Object.keys(partnerMap).sort((a, b) => partnerMap[b] - partnerMap[a])[0] || "N/A";

        const rejPartnerMap = {};
        APP.filteredRejections.forEach(row => {
            const partner = APP.getValue(row, "PARTNERNAME") || "Unknown";
            rejPartnerMap[partner] = (rejPartnerMap[partner] || 0) + 1;
        });
        const topRejectPartner = Object.keys(rejPartnerMap).sort((a, b) => rejPartnerMap[b] - rejPartnerMap[a])[0] || "N/A";

        const period = "Current Period";

        text = text
            .replace(/{{incidentCount}}/g, incidentCount)
            .replace(/{{rejectionCount}}/g, rejectionCount)
            .replace(/{{topIncidentPartner}}/g, topIncidentPartner)
            .replace(/{{topRejectPartner}}/g, topRejectPartner)
            .replace(/{{period}}/g, period);

        summaryBox.innerHTML = `<p>${APP.escape(text)}</p>`;
        container.appendChild(summaryBox);
        return summaryBox;
    },

    /**
     * Render fallback error widget
     */
    renderFallback: function (config, container, error) {
        const fallback = document.createElement("div");
        fallback.className = "widget-error";
        fallback.id = config.id || "error-widget";
        fallback.innerHTML = `
            <p>Error rendering widget: ${APP.escape(config.id || "Unknown")}</p>
            <small>${APP.escape(error.message || "Unknown error")}</small>
        `;
        container.appendChild(fallback);
        return fallback;
    },

    /**
     * Render all widgets from config
     */
    renderAllWidgets: function (dashboardConfig) {
        if (!dashboardConfig || !dashboardConfig.widgets) return;

        dashboardConfig.widgets.forEach(widgetConfig => {
            if (!widgetConfig.visible) return;

            const sectionContainer = APP.g(widgetConfig.section);
            if (!sectionContainer) return;

            const widgetContainer = document.createElement("div");
            widgetContainer.className = "widget-container";
            widgetContainer.id = `widget-${widgetConfig.id}`;

            if (widgetConfig.layout) {
                if (widgetConfig.layout.width) {
                    widgetContainer.style.gridColumn = `span ${Math.min(12, widgetConfig.layout.width / 100 * 12)}`;
                }
            }

            this.renderWidget(widgetConfig, widgetContainer);
            sectionContainer.appendChild(widgetContainer);
        });
    }
};

// Make renderWidget available globally
window.renderWidget = APP.WidgetRenderer.renderWidget.bind(APP.WidgetRenderer);
