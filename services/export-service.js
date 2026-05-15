/**
 * Export Service — Orchestrates multi-format exports (PNG, PPT, Excel) for dashboard widgets and entire layouts.
 * Coordinates canvas-to-image conversion, PptxGenJS native chart/table rendering, and SheetJS Excel generation.
 * Handles export profile selection, widget grouping, and preset management for power-user workflows.
 */

window.ExportService = (() => {
    const getSelectedWidgetIds = () =>
        [...document.querySelectorAll(".global-export-check:checked")]
            .map((input) => input.value);

    const waitForPaint = () =>
        new Promise((resolve) =>
            requestAnimationFrame(() => resolve())
        );

    const captureWidget = async (widget) => {
        const previousSection =
            APP.RUNTIME.state.activeSection;

        if (widget.section !== previousSection) {
            APP.RUNTIME.state.activeSection =
                widget.section;
            APP.RUNTIME.renderShell();
            await waitForPaint();
        }

        const el =
            document.querySelector(
                `[data-widget-id="${widget.id}"]`
            );

        if (!el) {
            throw new Error(`Widget ${widget.title} is not rendered.`);
        }

        const canvas =
            await html2canvas(el, {
                backgroundColor: "#f4f7fb",
                scale: 2,
                useCORS: true
            });

        if (widget.section !== previousSection) {
            APP.RUNTIME.state.activeSection =
                previousSection;
            APP.RUNTIME.renderShell();
            await waitForPaint();
        }

        return canvas.toDataURL("image/png");
    };

    return {
        openModal() {
            APP.RUNTIME?.renderExportList();
            APP.g("exportModal")?.classList.remove("hide");
        },
        closeModal() {
            APP.g("exportModal")?.classList.add("hide");
        },
        getSelectedWidgetIds,
        async exportPng(widgets) {
            for (const widget of widgets) {
                const image =
                    await captureWidget(widget);
                APP.download(
                    image,
                    `${APP.slug(widget.title)}.png`
                );
            }
        },
        async exportPpt(widgets) {
            const PptxGen =
                window.pptxgen ||
                window.PptxGenJS;

            if (!PptxGen) {
                throw new Error("PowerPoint export library is unavailable.");
            }

            const pptx =
                new PptxGen();
            pptx.layout = "LAYOUT_WIDE";
            pptx.author = "Payments Dashboard";
            pptx.title = "Dashboard Widgets";

            for (const widget of widgets) {
                const image =
                    await captureWidget(widget);
                const slide =
                    pptx.addSlide();
                slide.background = { color: "F8FAFC" };
                slide.addText(widget.slideTitle || widget.title, {
                    x: 0.45,
                    y: 0.25,
                    w: 12.4,
                    h: 0.35,
                    fontSize: 18,
                    bold: true,
                    color: "0F172A"
                });
                slide.addImage({
                    data: image,
                    x: 0.5,
                    y: 0.8,
                    w: 12.3,
                    h: 6.1
                });
            }

            await pptx.writeFile({
                fileName: "dashboard-widgets-runtime.pptx"
            });
        },
        exportExcel(widgets) {
            const wb =
                XLSX.utils.book_new();

            widgets.forEach((widget, index) => {
                const table =
                    APP.RUNTIME?.widgetToTable(widget);

                if (!table || !table.rows.length) return;

                const rows =
                    table.rows.map((row) => {
                        const out = {};
                        table.headers.forEach((header, columnIndex) => {
                            out[header] = row[columnIndex] ?? "";
                        });
                        return out;
                    });

                XLSX.utils.book_append_sheet(
                    wb,
                    XLSX.utils.json_to_sheet(rows),
                    String(widget.title || `Widget ${index + 1}`).slice(0, 31)
                );
            });

            XLSX.writeFile(
                wb,
                "dashboard-export-config-runtime.xlsx"
            );
        }
    };
})();
