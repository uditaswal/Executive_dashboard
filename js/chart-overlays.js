/**
 * Lightweight chart overlays for average, max, and trend lines.
 */

(function () {
    APP.chartRegistry = APP.chartRegistry || new Map();
    APP.chartOverlayState = APP.chartOverlayState || {};
    APP.globalChartOverlays = APP.globalChartOverlays || {
        avg: false,
        trend: false
    };

    APP.linearRegression = (values) => {
        const ys = values
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));

        const n = ys.length;
        if (n < 2) {
            return [];
        }

        const xs = ys.map((_, index) => index);
        const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
        const meanY = ys.reduce((sum, y) => sum + y, 0) / n;
        const slopeNumerator = xs.reduce((sum, x, index) => sum + ((x - meanX) * (ys[index] - meanY)), 0);
        const slopeDenominator = xs.reduce((sum, x) => sum + ((x - meanX) ** 2), 0) || 1;
        const slope = slopeNumerator / slopeDenominator;
        const intercept = meanY - (slope * meanX);

        return xs.map((x) => Number((slope * x + intercept).toFixed(2)));
    };

    APP.chartSupportsOverlays = (chart) => {
        const chartType = chart?.config?.type || chart?.data?.datasets?.[0]?.type;
        return chartType === "bar" || chartType === "line";
    };

    APP.ensureChartOverlayState = (chartId) => {
        if (!APP.chartOverlayState[chartId]) {
            APP.chartOverlayState[chartId] = {
                avg: Boolean(APP.globalChartOverlays.avg),
                max: false,
                trend: Boolean(APP.globalChartOverlays.trend)
            };
        }

        return APP.chartOverlayState[chartId];
    };

    APP.getOverlayDatasets = (chartId, chart) => {
        const state = APP.ensureChartOverlayState(chartId);
        const baseDataset = chart?.data?.datasets?.find((dataset) => !dataset._overlayDataset);
        const values = (baseDataset?.data || []).map((value) => Number(value) || 0);
        const overlays = [];

        if (!values.length) {
            return overlays;
        }

        if (state.avg) {
            const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
            overlays.push({
                label: "Average",
                data: values.map(() => Number(avg.toFixed(2))),
                borderColor: "#0ea5e9",
                backgroundColor: "transparent",
                borderWidth: 2,
                borderDash: [6, 4],
                pointRadius: 0,
                type: "line",
                _overlayDataset: true
            });
        }

        if (state.max) {
            const max = Math.max(...values);
            overlays.push({
                label: "Max",
                data: values.map(() => max),
                borderColor: "#f97316",
                backgroundColor: "transparent",
                borderWidth: 2,
                borderDash: [2, 4],
                pointRadius: 0,
                type: "line",
                _overlayDataset: true
            });
        }

        if (state.trend) {
            overlays.push({
                label: "Trend",
                data: APP.linearRegression(values),
                borderColor: "#8b5cf6",
                backgroundColor: "transparent",
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2,
                type: "line",
                _overlayDataset: true
            });
        }

        return overlays;
    };

    APP.applyChartOverlays = (chartId) => {
        const chart = APP.chartRegistry?.get(chartId);
        if (!chart || !APP.chartSupportsOverlays(chart)) {
            return;
        }

        const datasets = chart.data.datasets.filter((dataset) => !dataset._overlayDataset);
        chart.data.datasets = [
            ...datasets,
            ...APP.getOverlayDatasets(chartId, chart)
        ];
        chart.update("none");
        APP.renderChartOverlayControls?.(chartId);
    };

    APP.renderChartOverlayControls = (chartId) => {
        const chart = APP.chartRegistry?.get(chartId);
        if (!chart || !APP.chartSupportsOverlays(chart)) {
            return;
        }

        const canvas = APP.g(chartId);
        const hostCard = canvas?.closest(".card");
        if (!hostCard) return;

        hostCard.classList.add("chart-card-shell");
        let controls = hostCard.querySelector(".chart-overlay-controls");
        if (!controls) {
            controls = document.createElement("div");
            controls.className = "chart-overlay-controls";
            hostCard.appendChild(controls);
        }

        const state = APP.ensureChartOverlayState(chartId);
        controls.innerHTML = `
<label><input type="checkbox" data-overlay-kind="avg" ${state.avg ? "checked" : ""}> Avg</label>
<label><input type="checkbox" data-overlay-kind="max" ${state.max ? "checked" : ""}> Max</label>
<label><input type="checkbox" data-overlay-kind="trend" ${state.trend ? "checked" : ""}> Trend</label>
`;

        controls.querySelectorAll("input[data-overlay-kind]").forEach((input) => {
            input.onchange = () => {
                APP.ensureChartOverlayState(chartId)[input.dataset.overlayKind] = input.checked;
                APP.applyChartOverlays(chartId);
            };
        });
    };

    APP.registerChartForOverlays = (chartId, chart) => {
        APP.chartRegistry.set(chartId, chart);
        APP.ensureChartOverlayState(chartId);
        APP.applyChartOverlays(chartId);
    };

    APP.applyGlobalOverlayToggle = (kind, checked) => {
        APP.globalChartOverlays[kind] = checked;
        APP.chartRegistry.forEach((chart, chartId) => {
            if (!String(chartId).startsWith("c")) {
                return;
            }
            APP.ensureChartOverlayState(chartId)[kind] = checked;
            APP.applyChartOverlays(chartId);
        });
    };
})();
