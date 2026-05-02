APP.render = () => {
    APP.g("count").textContent =
        APP.DATA.length + " records";

    if (APP.g("filterRecordHint")) {
        APP.g("filterRecordHint").textContent =
            APP.DATA.length + " shown";
    }

    APP.renderSummary();
    APP.renderKPIs();
    APP.renderPriorityBreakdown();
    APP.renderMetrics();
    APP.renderSuggestions();
    APP.renderAnalyticsTables();
    APP.renderIncidentColumnPicker();
    APP.renderTable();
    APP.draw();
    APP.renderExportOptions();
};

APP.defaultIncidentColumns = [
    "Incident",
    "Month",
    "Partner",
    "Receive Country",
    "Issue (WU issue/Partner side)",
    "issue category",
    "Status",
    "PRIORITY",
    "Impact type",
    "Time Taken for Resolution",
    "Delayed Transaction",
    "Delivery Breached"
];

APP.selectedIncidentColumns = null;

APP.getExcelColumns = () =>
    APP.RAW.length
        ? Object.keys(APP.RAW[0])
        : [];

APP.getIncidentColumns = () => {
    const excelColumns =
        APP.getExcelColumns();

    if (APP.selectedIncidentColumns === null) {
        APP.selectedIncidentColumns =
            APP.defaultIncidentColumns.filter(
                column => excelColumns.includes(column)
            );
    }

    return APP.selectedIncidentColumns.filter(
        column => excelColumns.includes(column)
    );
};

APP.renderIncidentColumnPicker = () => {
    const box =
        APP.g("incidentColumnList");

    if (!box) return;

    const columns =
        APP.getExcelColumns();

    const selected =
        new Set(
            APP.getIncidentColumns()
        );

    box.innerHTML =
        columns.map(column => `
<label class="column-item">
    <input type="checkbox" class="incident-column-check" value="${APP.escape(column)}" ${selected.has(column) ? "checked" : ""}>
    <span>${APP.escape(column)}</span>
</label>
`).join("") ||
        `<div class="empty-state">Load an Excel workbook to choose incident columns.</div>`;

    document
        .querySelectorAll(".incident-column-check")
        .forEach((input) => {
            input.onchange = () => {
                APP.selectedIncidentColumns =
                    [...document.querySelectorAll(".incident-column-check:checked")]
                        .map(item => item.value);

                APP.renderTable();
            };
        });
};

APP.renderTable = () => {
    const open =
        APP.DATA.filter(
            r => r.Status === "Open"
        ).length;

    const major =
        APP.DATA.filter(
            r =>
                /major/i.test(
                    r["Impact type"] || ""
                )
        ).length;

    if (APP.g("incidentShown")) {
        APP.g("incidentShown").textContent =
            APP.DATA.length + " shown";
    }

    if (APP.g("incidentOpen")) {
        APP.g("incidentOpen").textContent =
            open + " open";
    }

    if (APP.g("incidentMajor")) {
        APP.g("incidentMajor").textContent =
            major + " major";
    }

    const columns =
        APP.getIncidentColumns();

    if (APP.g("incidentHead")) {
        APP.g("incidentHead").innerHTML = `
<tr>
${columns.map(column => `<th>${APP.escape(column)}</th>`).join("")}
</tr>
`;
    }

    APP.g("tbody").innerHTML =
        APP.DATA.slice(0, 500)
            .map(
                r => `
<tr>
${columns.map(column => APP.renderIncidentCell(r, column)).join("")}
</tr>
`
            )
            .join("") ||
        `<tr><td colspan="${Math.max(columns.length, 1)}">No incidents match the current filters.</td></tr>`;
};

APP.renderIncidentCell = (row, column) => {
    const value =
        row[column] ?? "";

    if (column === "Incident") {
        return `<td class="incident-id">${APP.escape(value)}</td>`;
    }

    if (column === "Status") {
        return `<td><span class="status-badge status-${APP.slug(value)}">${APP.escape(value)}</span></td>`;
    }

    if (column === "PRIORITY") {
        return `<td><span class="priority-badge priority-badge-${APP.escape(value)}">P${APP.escape(value)}</span></td>`;
    }

    if (
        column === "Delayed Transaction" ||
        column === "Delivery Breached" ||
        column === "Transaction Loss(customer impact)" ||
        column === "Transaction REJECTED"
    ) {
        return `<td>${APP.n(value).toLocaleString()}</td>`;
    }

    return `<td>${APP.escape(value)}</td>`;
};

APP.renderKPIs = () => {
    const total = APP.DATA.length;

    const open =
        APP.DATA.filter(
            x => x.Status === "Open"
        ).length;

    const closed =
        APP.DATA.filter(
            x =>
                /closed|resolved/i.test(
                    x.Status || ""
                )
        ).length;

    const vendor =
        APP.DATA.filter(
            x =>
                /vendor|partner/i.test(
                    x["Issue (WU issue/Partner side)"] || ""
                )
        ).length;

    const wallet =
        APP.DATA.filter(
            x =>
                /wallet/i.test(
                    x["Issue subcategory"] || ""
                )
        ).length;

    const delayed =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Delayed Transaction"]
                ),
            0
        );

    const breached =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Delivery Breached"]
                ),
            0
        );

    const loss =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Transaction Loss(customer impact)"]
                ),
            0
        );

    const rejected =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Transaction REJECTED"]
                ),
            0
        );

    const majorImpact =
        APP.DATA.filter(
            x =>
                /major/i.test(
                    x["Impact type"] || ""
                )
        ).length;

    const resolvedWithinOneDay =
        APP.DATA.filter(
            r =>
                /within 1 day/i.test(
                    r["Time Taken for Resolution"] || ""
                )
        ).length;

    const moreThanThreeDays =
        APP.DATA.filter(
            r =>
                /more than 3 days/i.test(
                    r["Time Taken for Resolution"] || ""
                )
        ).length;

    const monitoringGap =
        APP.DATA.filter(
            r =>
                /yes|delay|gap/i.test(
                    r["Monitoring Gap / delay In detection"] || ""
                )
        ).length;

    const reroute =
        APP.getRerouteMetrics();

    const volume =
        APP.getVolumeMetrics();

    const closedRate =
        APP.percent(
            closed,
            total
        );

    const breachRate =
        APP.percent(
            breached,
            delayed,
            1
        );

    const cards = [
        ["Total Incidents", total],
        ["Open Incidents", open],
        ["Closed/Resolved", closed],
        ["Vendor Issues", vendor],
        ["Wallet Issues", wallet],
        ["Delayed Txns", delayed],
        ["Delivery Breached", breached],
        ["Breach Rate", breachRate],
        ["Rejected Txns", rejected],
        ["Loss Impact", loss],
        ["Major Impact", majorImpact],
        ["Resolved < 1 Day", resolvedWithinOneDay],

    ];

    APP.g("kpis").innerHTML =
        cards.map((x, i) => `
<div class="kpi-card kpi-${i}">
   <div class="kpi-label">${x[0]}</div>
   <div class="kpi-number">${x[1]}</div>
</div>
`).join("");
};

APP.renderPriorityBreakdown = () => {
    const total =
        APP.DATA.length;

    const priorities =
        Object.entries(
            APP.cb("PRIORITY")
        )
            .sort(
                (a, b) =>
                    APP.n(a[0]) - APP.n(b[0])
            );

    const labels = {
        "1": "Critical",
        "2": "High",
        "3": "Medium",
        "4": "Low"
    };

    APP.g("priorityBreakdown").innerHTML =
        priorities.map(([priority, count]) => `
<div class="priority-card priority-${priority}">
    <div class="priority-title">P${priority}</div>
    <div class="priority-count">${count}</div>
    <div class="priority-meta">${labels[priority] || "Priority"} · ${APP.percent(count, total)}</div>
</div>
`).join("") ||
        `<div class="empty-state">No priority data available.</div>`;
};

APP.escape = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

APP.slug = (value) =>
    String(value || "unknown")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

APP.renderAnalyticsTables = () => {
    const container =
        APP.g("analyticsTables");

    if (!container) return;

    const tables =
        APP.getGraphTables
            ? APP.getGraphTables()
            : [];

    container.innerHTML =
        tables.map((table) => `
<article class="data-table-card">
    <div class="data-table-head">
        <h4>${APP.escape(table.title)}</h4>
        <span>${table.rows.length} rows</span>
    </div>
    <div class="data-table-scroll">
        <table class="data-table">
            <thead>
                <tr>
                    ${table.headers.map(header => `<th>${APP.escape(header)}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${table.rows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${APP.escape(cell)}</td>`).join("")}
                </tr>
                `).join("")}
            </tbody>
        </table>
    </div>
</article>
`).join("") ||
        `<div class="empty-state">No graph table data available for the current filter selection.</div>`;
};

APP.renderExportOptions = () => {
    const box =
        APP.g("chartExportList");

    if (!box) return;

    const charts =
        Object.keys(APP.charts || {})
            .sort(
                (a, b) =>
                    APP.exportOrder.indexOf(a) -
                    APP.exportOrder.indexOf(b)
            );

    box.innerHTML =
        charts.map((id) => `
<label class="chart-export-item">
    <input type="checkbox" class="chart-export-check" value="${APP.escape(id)}" checked>
    <span>${APP.escape(APP.chartTitles?.[id] || id)}</span>
</label>
`).join("") ||
        `<div class="empty-state">Open the Analytics tab after data loads to select charts for export.</div>`;
};

APP.getSelectedChartIds = () =>
    [...document.querySelectorAll(".chart-export-check:checked")]
        .map(input => input.value)
        .filter(id => APP.charts[id]);

APP.download = (href, filename) => {
    const link =
        document.createElement("a");

    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

APP.chartImage = (id, type = "image/jpeg") => {
    const canvas =
        APP.g(id);

    if (!canvas) return "";

    const out =
        document.createElement("canvas");

    out.width = canvas.width;
    out.height = canvas.height;

    const ctx =
        out.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);

    return out.toDataURL(type, 0.92);
};

APP.exportSelectedJpg = () => {
    const ids =
        APP.getSelectedChartIds();

    if (!ids.length) {
        alert("Select at least one chart to export.");
        return;
    }

    ids.forEach((id) => {
        const title =
            APP.slug(APP.chartTitles?.[id] || id);

        APP.download(
            APP.chartImage(id, "image/jpeg"),
            `${title}.jpg`
        );
    });
};

APP.chartDataRows = (id) => {
    const chart =
        APP.charts[id];

    if (!chart) return [];

    const labels =
        chart.data.labels || [];

    const datasets =
        chart.data.datasets || [];

    return labels.map((label, index) => {
        const row = {
            Label: label
        };

        datasets.forEach((dataset) => {
            row[dataset.label || "Value"] =
                Array.isArray(dataset.data)
                    ? dataset.data[index]
                    : "";
        });

        return row;
    });
};

APP.exportSelectedExcel = () => {
    const ids =
        APP.getSelectedChartIds();

    if (!ids.length) {
        alert("Select at least one chart to export.");
        return;
    }

    const wb =
        XLSX.utils.book_new();

    ids.forEach((id, index) => {
        const rows =
            APP.chartDataRows(id);

        const ws =
            XLSX.utils.json_to_sheet(rows);

        const name =
            (APP.chartTitles?.[id] || `Chart ${index + 1}`)
                .replace(/[\\/?*[\]:]/g, "")
                .slice(0, 31);

        XLSX.utils.book_append_sheet(
            wb,
            ws,
            name || `Chart ${index + 1}`
        );
    });

    XLSX.writeFile(
        wb,
        "dashboard-chart-data.xlsx"
    );
};

APP.exportTablesExcel = () => {
    const tables =
        APP.getGraphTables
            ? APP.getGraphTables()
            : [];

    if (!tables.length) {
        alert("No table data is available to export.");
        return;
    }

    const wb =
        XLSX.utils.book_new();

    tables.forEach((table, index) => {
        const rows =
            table.rows.map((row) => {
                const out = {};

                table.headers.forEach((header, i) => {
                    out[header] =
                        row[i] ?? "";
                });

                return out;
            });

        const ws =
            XLSX.utils.json_to_sheet(rows);

        const name =
            table.title
                .replace(/[\\/?*[\]:]/g, "")
                .slice(0, 31) ||
            `Table ${index + 1}`;

        XLSX.utils.book_append_sheet(
            wb,
            ws,
            name
        );
    });

    const incidentColumns =
        APP.getIncidentColumns();

    if (incidentColumns.length) {
        const incidentRows =
            APP.DATA.map((row) => {
                const out = {};

                incidentColumns.forEach((column) => {
                    out[column] =
                        row[column] ?? "";
                });

                return out;
            });

        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(incidentRows),
            "Incident Register"
        );
    }

    XLSX.writeFile(
        wb,
        "dashboard-tables.xlsx"
    );
};

APP.exportSelectedPpt = async () => {
    const ids =
        APP.getSelectedChartIds();

    if (!ids.length) {
        alert("Select at least one chart to export.");
        return;
    }

    const PptxGen =
        window.pptxgen ||
        window.PptxGenJS;

    if (!PptxGen) {
        alert("PowerPoint export library is still loading. Try again in a moment.");
        return;
    }

    const pptx =
        new PptxGen();

    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Payments Dashboard";
    pptx.subject = "Filtered dashboard chart export";
    pptx.title = "Payments Dashboard Charts";

    ids.forEach((id) => {
        const slide =
            pptx.addSlide();

        const title =
            APP.chartTitles?.[id] || id;

        slide.background = {
            color: "F8FAFC"
        };

        slide.addText(title, {
            x: 0.45,
            y: 0.25,
            w: 12.4,
            h: 0.35,
            fontSize: 18,
            bold: true,
            color: "0F172A"
        });

        slide.addImage({
            data: APP.chartImage(id, "image/png"),
            x: 0.65,
            y: 0.8,
            w: 12,
            h: 6.25
        });
    });

    await pptx.writeFile({
        fileName: "dashboard-charts.pptx"
    });
};

APP.renderMetrics = () => {
    const total = APP.DATA.length;

    const vendor =
        APP.DATA.filter(
            x =>
                /vendor|partner/i.test(
                    x["Issue (WU issue/Partner side)"] || ""
                )
        ).length;

    const vendorPct =
        total
            ? Math.round(
                (vendor / total) * 100
            )
            : 0;

    const wallet =
        APP.DATA.filter(
            x =>
                /wallet/i.test(
                    x["Issue subcategory"] || ""
                )
        ).length;

    const walletPct =
        total
            ? Math.round(
                (wallet / total) * 100
            )
            : 0;

    const reroute =
        APP.getRerouteMetrics();

    const volume =
        APP.getVolumeMetrics();

    const resolvedUnderOneDay =
        APP.DATA.filter(
            r =>
                /within 1 day|less than 1 day/i.test(
                    r["Time Taken for Resolution"] || ""
                )
        ).length;

    const moreThanThreeDays =
        APP.DATA.filter(
            r =>
                /more than 3 days/i.test(
                    r["Time Taken for Resolution"] || ""
                )
        ).length;

    const delayed =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Delayed Transaction"]
                ),
            0
        );

    const breached =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Delivery Breached"]
                ),
            0
        );

    const rejected =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Transaction REJECTED"]
                ),
            0
        );

    const majorImpact =
        APP.DATA.filter(
            x =>
                /major/i.test(
                    x["Impact type"] || ""
                )
        ).length;

    const monitoringGap =
        APP.DATA.filter(
            r =>
                /yes|delay|gap/i.test(
                    r["Monitoring Gap / delay In detection"] || ""
                )
        ).length;

    const breachedAfterDelayPct =
        delayed
            ? ((breached / delayed) * 100).toFixed(1) + "%"
            : "0%";

    const rows = [
        ["Total Incidents", total, ""],
        ["Vendor-side %", vendorPct + "%", ""],
        ["Wallet-related %", walletPct + "%", ""],
        ["Major Impact Incidents", majorImpact, ""],
        ["Rerouted Txns", reroute.txnCount, ""],
        ["Rerouted USD", reroute.usd.toFixed(2), ""],
        ["Avg APN Monthly Volume", volume.avg.toLocaleString(), ""],
        ["Resolved < 1 day", resolvedUnderOneDay, ""],
        ["Resolution > 3 days", moreThanThreeDays, ""],
        ["SLA breached after delay", breachedAfterDelayPct, "Breached / delayed MTCNs"],
        ["Rejected Transactions", rejected.toLocaleString(), ""],
    ];

    APP.g("metricsBody").innerHTML =
        rows.map(
            r => `
<tr>
<td>${r[0]}</td>
<td>${r[1]}</td>
<td>${r[2]}</td>
</tr>
`
        ).join("");
};

APP.getReviewPeriod = () => {
    const monthOrder = APP.monthOrder || [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const months =
        APP.u(
            APP.DATA.map(
                r => r.Month
            )
        );

    const sorted =
        monthOrder.filter(
            month => months.includes(month)
        );

    if (!sorted.length) return "Current";
    if (sorted.length === 1) return sorted[0];

    return `${sorted[0]}-${sorted[sorted.length - 1]}`;
};

APP.renderSummary = () => {
    const total = APP.DATA.length;

    const vendor =
        APP.DATA.filter(
            x =>
                /vendor|partner/i.test(
                    x["Issue (WU issue/Partner side)"] || ""
                )
        ).length;

    const vendorPct =
        total
            ? Math.round(
                vendor / total * 100
            )
            : 0;

    const topPartners =
        Object.entries(
            APP.cb("Partner")
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 3)
            .map(x => x[0])
            .join(", ") || "N/A";

    const p1 =
        APP.DATA.filter(
            x =>
                String(x.PRIORITY) === "1"
        ).length;

    const open =
        APP.DATA.filter(
            x =>
                x.Status === "Open"
        ).length;

    const delayed =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Delayed Transaction"]
                ),
            0
        );

    const breached =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Delivery Breached"]
                ),
            0
        );

    const rejected =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    r["Transaction REJECTED"]
                ),
            0
        );

    const majorImpact =
        APP.DATA.filter(
            x =>
                /major/i.test(
                    x["Impact type"] || ""
                )
        ).length;

    const resolvedWithinOneDay =
        APP.DATA.filter(
            r =>
                /within 1 day|less than 1 day/i.test(
                    r["Time Taken for Resolution"] || ""
                )
        ).length;

    const reroute =
        APP.getRerouteMetrics();

    const volume =
        APP.getVolumeMetrics();

    const period =
        APP.getReviewPeriod();

    APP.g("execSummary").innerHTML = `
<strong>${period} 2026</strong>

<ul style="margin-top:8px; padding-left:18px; line-height:1.8">
  <li>A total of <b>${total}</b> incidents were recorded across the APN during the review period (${period} 2026).</li>
  <li>Vendor/partner side issues accounted for <b>${vendorPct}%</b> of incidents, with top contributors being <b>${topPartners}</b>.</li>
  <li><b>${majorImpact}</b> major incidents were created, and <b>${resolvedWithinOneDay}</b> incidents were resolved within one day.</li>
  <li>Note: These are static values currently</li>
 <li> APN transaction volumes are on a steady upward trajectory, averaging 7 million transactions per month in 2026 with 75% real time.</li>
<li>Processing mix is balanced, with 55% of volume from retail channels and 45% from digital channels.</li>
<liOverall rejection rate is stable at ~1.38% of total volume, with most rejections originating from processors, beneficiary banks, and wallets.</li>
</ul>
`;
};

APP.renderSuggestions = () => {
    const box =
        APP.g("suggestions");

    if (
        !APP.SUGGESTIONS ||
        !APP.SUGGESTIONS.length
    ) {
        box.innerHTML =
            "<li>No suggestions provided.</li>";

        return;
    }

    box.innerHTML =
        APP.SUGGESTIONS
            .sort(
                (a, b) =>
                    APP.n(a.priority) -
                    APP.n(b.priority)
            )
            .map(
                row => row.suggestion
                    ? `<li>${row.suggestion}</li>`
                    : ""
            )
            .join("");
};

fileInput.onchange = async (e) => {
    if (
        e.target.files[0]
    ) {
        APP.parse(
            await e.target.files[0]
                .arrayBuffer()
        );
    }
};

btnLoad.onclick = APP.loadLocal;
btnApply.onclick = APP.apply;
btnReset.onclick = APP.reset;

[
    "fMonth",
    "fPartner",
    "fStatus",
    "fPriority",
    "fRegion",
    "fCountry",
    "fOwner",
    "fCategory",
    "fImpact"
].forEach((id) => {
    const el =
        APP.g(id);

    if (el) {
        el.onchange =
            APP.apply;
    }
});

if (APP.g("search")) {
    APP.g("search").oninput =
        APP.apply;
}

if (APP.g("btnSelectCharts")) {
    APP.g("btnSelectCharts").onclick = () => {
        document
            .querySelectorAll(".chart-export-check")
            .forEach(
                input => input.checked = true
            );
    };
}

if (APP.g("btnClearCharts")) {
    APP.g("btnClearCharts").onclick = () => {
        document
            .querySelectorAll(".chart-export-check")
            .forEach(
                input => input.checked = false
            );
    };
}

if (APP.g("btnExportJpg")) {
    APP.g("btnExportJpg").onclick =
        APP.exportSelectedJpg;
}

if (APP.g("btnExportPpt")) {
    APP.g("btnExportPpt").onclick =
        APP.exportSelectedPpt;
}

if (APP.g("btnExportTablesExcel")) {
    APP.g("btnExportTablesExcel").onclick =
        APP.exportTablesExcel;
}

if (APP.g("btnDefaultColumns")) {
    APP.g("btnDefaultColumns").onclick = () => {
        const excelColumns =
            APP.getExcelColumns();

        APP.selectedIncidentColumns =
            APP.defaultIncidentColumns.filter(
                column => excelColumns.includes(column)
            );

        APP.renderIncidentColumnPicker();
        APP.renderTable();
    };
}

if (APP.g("btnAllColumns")) {
    APP.g("btnAllColumns").onclick = () => {
        APP.selectedIncidentColumns =
            APP.getExcelColumns();

        APP.renderIncidentColumnPicker();
        APP.renderTable();
    };
}

if (APP.g("btnClearColumns")) {
    APP.g("btnClearColumns").onclick = () => {
        APP.selectedIncidentColumns = [];

        document
            .querySelectorAll(".incident-column-check")
            .forEach(
                input => input.checked = false
            );

        APP.renderTable();
    };
}

// Chart labels toggle handler
if (APP.g("toggleChartLabels")) {
    APP.g("toggleChartLabels").onclick = (e) => {
        APP.showChartLabels = e.target.checked;
        
        // Redraw charts with new settings
        if (Object.keys(APP.charts).length > 0) {
            APP.draw();
        }
    };
}

document
    .querySelectorAll(".tab")
    .forEach(
        t =>
            t.onclick =
            () =>
                APP.view(
                    t.dataset.view
                )
    );

APP.loadLocal();
