/**
 * Main Application Controller — Orchestrates all dashboard logic, data filtering, rendering, and user interactions.
 * Manages state (APP.DATA, APP.REJECTIONS, APP.RAW), coordinates between modules, and drives the entire UI refresh cycle.
 * Core hub for tab management, chart rendering, export workflows, and real-time filter propagation across all views.
 */

APP.render = () => {
    APP.g("count").textContent =
        `${APP.DATA.length} records`;

    APP.updateFilterStats?.(APP.DATA.length, APP.filteredRejections.length);

    APP.renderSummary();
    APP.renderKPIs();
    APP.renderPriorityBreakdown();
    APP.renderSecondaryBreakdowns();
    APP.renderOverviewTabs();
    APP.renderSuggestions();
    APP.renderRejectionKPIs();
    APP.renderIncidentColumnPicker();
    APP.renderRejectionColumnPicker();
    APP.renderTable();
    APP.renderRejectionTable();
    APP.draw();
    APP.renderAnalyticsTables();
    APP.renderRejectionTables();
    APP.renderPivotBuilder();
    APP.renderExportOptions();
};

if (APP.g("analyticsTopN")) {
    APP.g("analyticsTopN").onchange = (e) => {
        APP.analyticsTopN =
            e.target.value
                ? Number(e.target.value)
                : null;
        APP.render();
    };
}

if (APP.g("rejectionsTopN")) {
    APP.g("rejectionsTopN").onchange = (e) => {
        APP.rejectionsTopN =
            e.target.value
                ? Number(e.target.value)
                : null;
        APP.render();
    };
}

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
            APP.defaultIncidentColumns
                .map(column =>
                    APP.findColumnName(
                        APP.RAW,
                        column
                    )
                )
                .filter(Boolean);
    }

    return APP.selectedIncidentColumns.filter(
        column =>
            excelColumns.includes(column)
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
            r =>
                APP.rowValue(
                    r,
                    "Status"
                ) === "Open"
        ).length;

    const major =
        APP.DATA.filter(
            r =>
                /major/i.test(
                    APP.rowValue(
                        r,
                        "Impact type"
                    ) || ""
                )
        ).length;

    if (APP.g("incidentShown")) {
        APP.g("incidentShown").textContent =
            `${APP.DATA.length} shown`;
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
<tr>${columns.map(column => `<th>${APP.escape(column)}</th>`).join("")}</tr>
`;
    }

    if (APP.g("incidentBody")) {
        APP.g("incidentBody").innerHTML =
            APP.DATA.slice(0, 500)
                .map(
                    r => `
<tr>${columns.map(column => `<td>${APP.escape(APP.rowValue(r, column) ?? "")}</td>`).join("")}</tr>
`).join("") ||
            `<tr><td colspan="${Math.max(columns.length, 1)}">No incidents match the current filters.</td></tr>`;
    }
};

APP.renderIncidentCell = (row, column) => {
    const value =
        APP.rowValue(row, column) ?? "";

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
            x =>
                APP.rowValue(
                    x,
                    "Status"
                ) === "Open"
        ).length;

    const closed =
        APP.DATA.filter(
            x =>
                /closed|resolved/i.test(
                    APP.rowValue(
                        x,
                        "Status"
                    ) || ""
                )
        ).length;

    const vendor =
        APP.DATA.filter(
            x =>
                APP.isPartnerSideCategory(x) &&
                APP.isVendorIssue(x)
        ).length;

    const delayed =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    APP.rowValue(
                        r,
                        "Delayed Transaction"
                    )
                ),
            0
        );

    const breached =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    APP.rowValue(
                        r,
                        "Delivery Breached"
                    )
                ),
            0
        );

    const loss =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    APP.rowValue(
                        r,
                        "Transaction Loss(customer impact)"
                    )
                ),
            0
        );

    const rejected =
        APP.DATA.reduce(
            (s, r) =>
                s +
                APP.n(
                    APP.rowValue(
                        r,
                        "Transaction REJECTED"
                    )
                ),
            0
        );

    const majorImpact =
        APP.DATA.filter(
            x =>
                /major/i.test(
                    APP.rowValue(
                        x,
                        "Impact type"
                    ) || ""
                )
        ).length;

    const resolvedWithinOneDay =
        APP.DATA.filter(
            r =>
                /within 1 day|less than 1 day/i.test(
                    APP.rowValue(
                        r,
                        "Time Taken for Resolution"
                    ) || ""
                )
        ).length;

    const moreThanThreeDays =
        APP.DATA.filter(
            r =>
                /more than 3 days/i.test(
                    APP.rowValue(
                        r,
                        "Time Taken for Resolution"
                    ) || ""
                )
        ).length;

    const monitoringGap =
        APP.DATA.filter(
            r =>
                /yes|delay|gap/i.test(
                    APP.rowValue(
                        r,
                        "Monitoring Gap / delay In detection"
                    ) || ""
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

    const wuIssues =
        APP.DATA.filter(APP.isWuIssue).length;

    APP.g("kpis").innerHTML = `
        <div class="kpi">
            <h4>Total Incidents</h4>
            <strong>${APP.formatNum(total)}</strong>
        </div>
        <div class="kpi">
            <h4>Open Incidents</h4>
            <strong>${APP.formatNum(open)}</strong>
        </div>
        <div class="kpi">
            <h4>Closed Incidents</h4>
            <strong>${APP.formatNum(closed)}</strong>
        </div>
        <div class="kpi">
            <h4>Vendor Issues</h4>
            <strong>${APP.formatNum(vendor)}</strong>
        </div>
        <div class="kpi">
            <h4>WU Issues Count</h4>
            <strong>${APP.formatNum(wuIssues)}</strong>
        </div>
    `;
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
    <div class="priority-meta">${labels[priority] || "Priority"} &middot; ${APP.percent(count, total)}</div>
</div>
`).join("") ||
        `<div class="empty-state">No priority data available.</div>`;
};

APP.renderMiniBreakdown = (id, entries, total) => {
    const box = APP.g(id);

    if (!box) return;

    box.innerHTML =
        entries.map(([label, count, extra]) => `
<div class="mini-breakdown-row">
    <span>${APP.escape(label)}</span>
    <strong>${APP.formatNum(count)} <small>${APP.percent(count, total)}</small></strong>
    ${extra ? `<span class="extra-info">${extra}</span>` : ""}
</div>
`).join("") ||
        `<div class="empty-state">No data available.</div>`;
};

APP.getImpactMetrics = (rows = APP.DATA) => {
    const delayed =
        APP.sumRows(rows, "Delayed Transaction");

    const breached =
        APP.sumRows(rows, "Delivery Breached");

    const rejected =
        APP.sumRows(rows, "Transaction REJECTED");

    const loss =
        APP.sumRows(rows, "Transaction Loss(customer impact)");

    return {
        delayed,
        breached,
        breachRate: APP.percent(breached, delayed, 1),
        rejected,
        loss
    };
};

APP.renderImpactBreakdown = () => {
    const metrics =
        APP.getImpactMetrics();

    const entries = [
        ["Delayed Txns", APP.formatNum(metrics.delayed)],
        ["Delivery Breached", APP.formatNum(metrics.breached)],
        ["Breach Rate", metrics.breachRate],
        ["Rejected Txns", APP.formatNum(metrics.rejected)],
        ["Loss Impact", APP.formatNum(metrics.loss)]
    ];

    const box =
        APP.g("impactBreakdown");

    if (!box) return;

    box.innerHTML =
        entries.map(([label, value]) => `
<div class="mini-breakdown-row">
    <span>${APP.escape(label)}</span>
    <strong>${APP.escape(value)}</strong>
</div>
`).join("");
};

APP.renderSecondaryBreakdowns = () => {
    const total =
        APP.DATA.length;

    APP.renderMiniBreakdown(
        "resolutionBreakdown",
        APP.topEntries(
            APP.cb("Time Taken for Resolution"),
            6
        ),
        total
    );

    APP.renderImpactBreakdown();
};

APP.norm = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

APP.rowValue = (row, keys) =>
    APP.value
        ? APP.value(row, keys)
        : (Array.isArray(keys) ? keys : [keys])
            .map(key => row[key])
            .find(value => value !== undefined && value !== null && value !== "") || "";

APP.countByRows = (rows, key) => {
    const map = {};

    rows.forEach((row) => {
        const value =
            APP.rowValue(row, key) || "Unknown";

        map[value] =
            (map[value] || 0) + 1;
    });

    return map;
};

APP.sumRows = (rows, key) =>
    rows.reduce(
        (sum, row) =>
            sum +
            APP.n(
                APP.rowValue(row, key)
            ),
        0
    );

APP.uniqueList = (rows, key) =>
    APP.u(
        rows.map(row => APP.rowValue(row, key))
    );

APP.formatNum = (value) =>
    APP.n(value).toLocaleString();

APP.isPartnerSideCategory = (row) =>
    APP.norm(
        APP.rowValue(row, ["Issue Category", "issue category"])
    ) === APP.norm("Partner Side");

APP.isVendorIssue = (row) =>
    APP.norm(
        APP.rowValue(row, ["Issue(WU/Partner)", "Issue (WU issue/Partner side)"])
    ) === APP.norm("Vendor issue");

APP.isWuIssue = (row) =>
    /wu|internal/i.test(
        APP.rowValue(row, ["Issue(WU/Partner)", "Issue (WU issue/Partner side)"])
    ) ||
    APP.norm(
        APP.rowValue(row, ["Issue Category", "issue category"])
    ) === APP.norm("WU Side") ||
    APP.issueOwner(row) === "WU side";

APP.isFundingIssue = (row) =>
    /funding|insufficient/i.test(
        [
            APP.rowValue(row, "issue category"),
            APP.rowValue(row, "Issue subcategory"),
            APP.rowValue(row, "Issue Type"),
            APP.rowValue(row, "Issue type"),
            APP.rowValue(row, "Issue Category"),
            APP.rowValue(row, "Issue summary"),
            APP.rowValue(row, "RCA description"),
            APP.rowValue(row, "Actual RCA")
        ].join(" ")
    );

APP.getSelectedMonths = () => {
    const selectedMonths =
        APP.filterValues
            ? APP.filterValues("fMonth")
            : [];

    if (selectedMonths.length) {
        return APP.monthOrder.filter(month => selectedMonths.includes(month));
    }

    return APP.sortedMonths
        ? APP.sortedMonths(APP.DATA)
        : APP.u(
            APP.DATA.map(
                row =>
                    APP.rowValue(
                        row,
                        "Month"
                    )
            )
        );
};

APP.getReviewPeriod = () => {
    const months =
        APP.getSelectedMonths();

    if (!months.length) {
        return "All Periods";
    }

    if (months.length === 1) {
        return months[0];
    }

    const indexes =
        months.map((month) => APP.monthOrder.indexOf(month))
            .filter((index) => index >= 0)
            .sort((a, b) => a - b);

    if (!indexes.length) {
        return months.join(", ");
    }

    const isContiguous =
        indexes.every((index, position) =>
            position === 0 ||
            index === indexes[position - 1] + 1
        );

    if (isContiguous) {
        if (indexes.length === 3) {
            const quarter =
                Math.floor(indexes[0] / 3) + 1;

            if ((indexes[0] % 3) === 0) {
                return `Q${quarter}`;
            }
        }

        return `${months[0]}-${months[months.length - 1]}`;
    }

    return months.join(", ");
};

APP.matchesTrendBaseFilters = (row) => {
    const q =
        APP.g("search")
            ? APP.g("search").value.toLowerCase()
            : "";

    return (
        APP.matchesFilter("fPartner", APP.rowValue(row, "Partner")) &&
        APP.matchesFilter("fStatus", APP.rowValue(row, "Status")) &&
        APP.matchesFilter("fPriority", APP.rowValue(row, "PRIORITY")) &&
        APP.matchesFilter("fRegion", APP.rowValue(row, "Region")) &&
        APP.matchesFilter("fCountry", APP.rowValue(row, "Receive Country")) &&
        APP.matchesFilter("fOwner", APP.issueOwner(row)) &&
        APP.matchesFilter("fCategory", APP.value(row, ["Issue Category", "issue category", "Issue subcategory"])) &&
        APP.matchesFilter("fImpact", APP.rowValue(row, "Impact type")) &&
        (!q || JSON.stringify(row).toLowerCase().includes(q))
    );
};

APP.getFundingTrendLabel = () => {
    const months =
        APP.getSelectedMonths();

    if (!months.length) return "";

    const indexes =
        months.map(month => APP.monthOrder.indexOf(month))
            .filter(index => index >= 0);

    if (!indexes.length) return "";

    const startIndex =
        Math.min(...indexes);

    const previousMonths =
        APP.monthOrder.slice(
            Math.max(0, startIndex - months.length),
            startIndex
        );

    const baseRows =
        APP.RAW.filter(APP.matchesTrendBaseFilters);

    const countFundingForMonths = (monthList) =>
        baseRows.filter(row =>
            monthList.includes(
                APP.rowValue(
                    row,
                    "Month"
                )
            ) &&
            APP.isWuIssue(row) &&
            APP.isFundingIssue(row)
        ).length;

    const current =
        countFundingForMonths(months);

    if (!current) return "";

    const previous =
        previousMonths.length === months.length
            ? countFundingForMonths(previousMonths)
            : 0;

    const movement =
        current > previous
            ? "Spike"
            : current < previous
                ? "Drop"
                : "Flat";

    const period =
        APP.getReviewPeriod();

    return ``;
};

APP.getOverviewMetrics = () => {
    const rows =
        APP.DATA;

    const total =
        rows.length;

    const partnerSideRows =
        rows.filter(APP.isPartnerSideCategory);

    const vendorRows =
        rows.filter(
            row =>
                APP.isPartnerSideCategory(row) &&
                APP.isVendorIssue(row)
        );

    const fundingRows =
        rows.filter(APP.isFundingIssue);

    const delayed =
        APP.sumRows(rows, "Delayed Transaction");

    const breached =
        APP.sumRows(rows, "Delivery Breached");

    const resolvedWithinOneDay =
        rows.filter(
            row =>
                /within 1 day|less than 1 day/i.test(
                    APP.rowValue(row, "Time Taken for Resolution")
                )
        ).length;

    const moreThanTwoDays =
        rows.filter(
            row =>
                /more than 2 days|more than 3 days|3 days|4 days|5 days/i.test(
                    APP.rowValue(row, "Time Taken for Resolution")
                )
        ).length;

    const rootCauseCounts =
        APP.countByRows(
            rows,
            ["issue category", "Issue subcategory"]
        );

    const primaryRootCauses =
        APP.topEntries(rootCauseCounts, 2)
            .map(([name]) => name)
            .join(" & ") || "N/A";

    const topPartnerEntries =
        APP.topEntries(
            APP.countByRows(vendorRows.length ? vendorRows : rows, "Partner"),
            3
        );

    const topPartners =
        topPartnerEntries
            .map(([partner]) => partner)
            .join(", ") || "N/A";

    const topPartnerShare =
        total && topPartnerEntries.length
            ? Math.round(
                topPartnerEntries.reduce((sum, [, count]) => sum + count, 0) / total * 100
            )
            : 0;

    const countries =
        APP.topEntries(
            APP.countByRows(rows, "Receive Country"),
            6
        )
            .map(([country]) => country)
            .filter(country => country !== "Unknown")
            .join(", ") || "N/A";

    const regionImpact =
        Object.entries(
            rows.reduce((map, row) => {
                const region =
                    APP.rowValue(row, "Region") || "Unknown";

                if (!map[region]) {
                    map[region] = {
                        delayed: 0,
                        breached: 0
                    };
                }

                map[region].delayed +=
                    APP.n(
                        APP.rowValue(row, "Delayed Transaction")
                    );

                map[region].breached +=
                    APP.n(
                        APP.rowValue(row, "Delivery Breached")
                    );

                return map;
            }, {})
        )
            .sort((a, b) => b[1].delayed - a[1].delayed)[0];

    const reroute =
        APP.getRerouteMetrics();

    return {
        total,
        partnerSideCount: partnerSideRows.length,
        partnerSidePct: APP.percent(partnerSideRows.length, total),
        vendorCount: vendorRows.length,
        fundingCount: fundingRows.length,
        fundingPct: APP.percent(fundingRows.length, total),
        fundingTrendLabel: APP.getFundingTrendLabel(),
        delayed,
        breached,
        breachedPct: APP.percent(breached, delayed),
        resolvedWithinOneDay,
        resolvedWithinOneDayPct: APP.percent(resolvedWithinOneDay, total),
        moreThanTwoDays,
        moreThanTwoDaysPct: APP.percent(moreThanTwoDays, total),
        primaryRootCauses,
        topPartners,
        topPartnerShare,
        countries,
        topRegion: regionImpact
            ? regionImpact[0]
            : "N/A",
        topRegionDelayed: regionImpact
            ? regionImpact[1].delayed
            : 0,
        topRegionBreached: regionImpact
            ? regionImpact[1].breached
            : 0,
        reroute
    };
};

APP.getOverviewTab = () =>
    APP.activeOverviewTab || "summary";

APP.setOverviewTab = (tab) => {
    APP.activeOverviewTab =
        tab;

    APP.renderOverviewTabs();
};

APP.renderOverviewTabs = () => {
    const content =
        APP.g("overviewTabContent");

    if (!content) return;

    const periodLabel =
        APP.getReviewPeriod();

    if (APP.g("overviewPeriodTabLabel")) {
        APP.g("overviewPeriodTabLabel").textContent =
            periodLabel;
    }

    const active =
        APP.getOverviewTab();

    document
        .querySelectorAll(".overview-subtab")
        .forEach((button) => {
            const isActive =
                button.dataset.overviewTab === active;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", String(isActive));
            button.onclick = () =>
                APP.setOverviewTab(button.dataset.overviewTab);
        });

    const renderers = {
        summary: APP.renderOverviewSummaryTab,
        insights: APP.renderOverviewInsights,
        suggestions: APP.renderOverviewSuggestionsTab,
        metrics: APP.renderOverviewMetricTable,
        platform: APP.renderOverviewPlatformTable,
        vendor: APP.renderOverviewVendorTable
    };

    content.innerHTML =
        (renderers[active] || renderers.summary)();
};

APP.renderOverviewSummaryTab = () => {
    const metrics =
        APP.getOverviewMetrics();
    const summaryLines = [
        `${metrics.partnerSidePct} partner-side incidents in the filtered period`,
        `Funding failures count is ${APP.formatNum(metrics.fundingCount)}, representing ${metrics.fundingPct} of incidents`,
        `Top partners (${metrics.topPartners}) cause ${metrics.topPartnerShare}% of incidents`,
        `Mostly impacted region is ${metrics.topRegion} with ${APP.formatNum(metrics.topRegionDelayed)} delayed transactions${metrics.topRegionBreached ? ` and ${APP.formatNum(metrics.topRegionBreached)} breached transactions` : ""}`,
        `Repeated geographies: ${metrics.countries}`,
        `${metrics.breachedPct} of delayed transactions breached delivery sla`,
        `${metrics.resolvedWithinOneDayPct} issues were resolved within 1 day`,
        `Approx ${APP.formatNum(metrics.reroute.txnCount)} transactions worth ${APP.formatNum(metrics.reroute.usd)} USD were manually rerouted to save transactions`
    ];

    return `
<div class="summary-box">
    <p><b>${APP.formatNum(metrics.total)}</b> incidents and <b>${APP.formatNum(APP.filteredRejections.length)}</b> rejection rows are currently in scope.</p>
    <p>Top partners: <b>${APP.escape(metrics.topPartners)}</b>. Primary root causes: <b>${APP.escape(metrics.primaryRootCauses)}</b>.</p>
</div>
<ul class="overview-bullets summary-detail-list">
    ${summaryLines.map((line) => `<li>${APP.escape(line)}</li>`).join("")}
</ul>
`;
};

APP.renderOverviewSuggestionsTab = () => {
    const suggestions =
        APP.SUGGESTIONS.length
            ? APP.SUGGESTIONS.map((row) =>
                APP.rowValue(row, ["Suggestion", "suggestion", "Recommendation", "recommendation"])
            ).filter(Boolean)
            : [
                "Review the highest-volume partner-side incidents first.",
                "Investigate the top rejection partner and bank combination in the current filter scope.",
                "Use the pivot builder to compare impacted countries and issue categories before export."
            ];

    return `
<ul class="overview-bullets">
    ${suggestions.map((item) => `<li>${APP.escape(item)}</li>`).join("")}
</ul>
`;
};

APP.renderOverviewInsights = () => {
    const metrics =
        APP.getOverviewMetrics();

    return `
<ul class="overview-bullets">
    <li><b>${metrics.partnerSidePct}</b> partner-side incidents in the filtered period</li>
    <li>Funding failures count is <b>${APP.formatNum(metrics.fundingCount)}</b>, representing <b>${metrics.fundingPct}</b> of incidents</li>
    <li>Top partners (<b>${APP.escape(metrics.topPartners)}</b>) cause <b>${metrics.topPartnerShare}%</b> of incidents</li>
    <li>Mostly impacted region is <b>${APP.escape(metrics.topRegion)}</b> with <b>${APP.formatNum(metrics.topRegionDelayed)}</b> delayed transactions${metrics.topRegionBreached ? ` and <b>${APP.formatNum(metrics.topRegionBreached)}</b> breached transactions` : ""}</li>
    <li>Repeated geographies: <b>${metrics.countries}</b></li>
    <li><b>${metrics.breachedPct}</b> of delayed transactions breached delivery sla</li>
    <li><b>${metrics.resolvedWithinOneDayPct}</b> issues were resolved within 1 day</li>
    <li>Approx <b>${APP.formatNum(metrics.reroute.txnCount)}</b> transactions worth <b>${APP.formatNum(metrics.reroute.usd)} USD</b> were manually rerouted to save transactions</li>
</ul>
`;
};

APP.renderOverviewMetricTable = () => {
    const table =
        APP.getOverviewMetricTable();

    return `
<div class="overview-table-scroll compact-scroll">
    <table class="overview-metric-table">
        <thead>
            <tr>
                ${table.headers.map(header => `<th>${APP.escape(header)}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${table.rows.map((row, index) => `
            <tr class="${index % 2 === 0 ? "metric-blue-row" : "metric-white-row"}">
                <td class="${index % 2 === 0 ? "bg-sky-100" : "bg-cyan-50"}">${APP.escape(row[0])}</td>
                <td class="${index % 2 === 0 ? "bg-sky-100" : "bg-cyan-50"}">${APP.escape(row[1])}</td>
            </tr>
            `).join("")}
        </tbody>
    </table>
</div>
`;
};

APP.firstNonEmpty = (rows, keys) => {
    for (const row of rows) {
        const value =
            APP.rowValue(row, keys);

        if (value !== "") return value;
    }

    return "";
};

APP.getPlatformRcaTable = () => {
    const rows =
        APP.DATA.filter(
            row => APP.isWuIssue(row)
        );

    const grouped = {};

    rows.forEach((row) => {
        const platform =
            APP.rowValue(row, ["Platform", "platform"]) || "Unknown";

        grouped[platform] =
            grouped[platform] || {
                platform,
                countries: new Set(),
                summaries: new Set(),
                preventions: new Set(),
                items: []
            };

        const group =
            grouped[platform];

        group.items.push(row);
        group.countries.add(
            APP.rowValue(row, "Receive Country") || "Unknown"
        );

        const summary =
            APP.rowValue(row, ["Actual RCA", "RCA description", "Issue Summary", "Issue summary"]);

        if (summary) {
            group.summaries.add(summary);
        }

        const prevention =
            APP.rowValue(row, ["Prevention", "prevention"]);

        if (prevention) {
            group.preventions.add(prevention);
        }
    });

    const tableRows =
        Object.values(grouped)
            .map((group) => {
                const items =
                    group.items;

                const delayed =
                    APP.sumRows(items, "Delayed Transaction");

                const breached =
                    APP.sumRows(items, "Delivery Breached");

                return {
                    ...group,
                    delayed,
                    breached,
                    items
                };
            })
            .sort((a, b) => b.delayed - a.delayed)
            .slice(0, 5)
            .map((group) => {
                const impact =
                    `Transaction delayed : ${APP.formatNum(group.delayed)}\nTransaction breached : ${APP.formatNum(group.breached)}`;

                return [
                    group.platform,
                    [...group.countries].join(", ") || "Unknown",
                    impact,
                    [...group.summaries].join("\n"),
                    [...group.preventions].join("\n")
                ];
            });

    return {
        id: "overview-platform-rca",
        title: "Platform RCA",
        headers: [
            "Platform",
            "Country",
            "Impact",
            "Issue Summary & RCA",
            "Prevention"
        ],
        rows: tableRows
    };
};

APP.renderOverviewPlatformTable = () => {
    const table =
        APP.getPlatformRcaTable();

    if (!table.rows.length) {
        return `<div class="empty-state">No WU/internal platform incidents match the current filters.</div>`;
    }

    return `
<div class="overview-table-scroll">
    <table class="overview-rca-table blue-rca-table">
        <thead>
            <tr>
                ${table.headers.map(header => `<th>${APP.escape(header)}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${table.rows.map(row => `
            <tr>
                ${row.map(cell => `<td>${APP.escape(cell).replace(/\n/g, "<br>")}</td>`).join("")}
            </tr>
            `).join("")}
        </tbody>
    </table>
</div>
`;
};

APP.getVendorRcaTable = () => {
    const rows =
        APP.DATA.filter(
            row =>
                APP.isPartnerSideCategory(row) &&
                APP.isVendorIssue(row)
        );

    const grouped = {};

    rows.forEach((row) => {
        const partner =
            APP.rowValue(row, "Partner") || "Unknown";

        grouped[partner] =
            grouped[partner] || {
                partner,
                countries: new Set(),
                issueTypes: {},
                items: []
            };

        const group =
            grouped[partner];

        group.items.push(row);

        group.countries.add(
            APP.rowValue(row, "Receive Country") || "Unknown"
        );

        const issueType =
            APP.rowValue(row, ["Issue Type", "Issue type", "Issue subcategory"]) ||
            "Unknown";

        group.issueTypes[issueType] =
            (group.issueTypes[issueType] || 0) + 1;
    });

    const tableRows =
        Object.values(grouped)
            .map((group) => {
                const items =
                    group.items;

                const delayed =
                    APP.sumRows(items, "Delayed Transaction");

                const breached =
                    APP.sumRows(items, "Delivery Breached");

                return {
                    ...group,
                    incidentCount: items.length,
                    delayed,
                    breached
                };
            })
            .sort((a, b) => b.delayed - a.delayed)
            .slice(0, 5)
            .sort((a, b) => b.incidentCount - a.incidentCount)
            .map((group) => {
                const countryList =
                    [...group.countries]
                        .filter(Boolean)
                        .join(", ") || "Unknown";

                const impact =
                    `Delayed: ${APP.formatNum(group.delayed)} | Breached: ${APP.formatNum(group.breached)}`;

                const rca =
                    Object.entries(group.issueTypes)
                        .sort((a, b) => b[1] - a[1])
                        .map(([issueType, count]) =>
                            `${APP.formatNum(count)} ${count === 1 ? "incident" : "incidents"} occurred due to ${String(issueType).toLowerCase()}`
                        )
                        .join("\n") || "Unknown";

                return [
                    countryList,
                    group.partner,
                    APP.formatNum(group.incidentCount),
                    impact,
                    rca
                ];
            });

    return {
        id: "overview-vendor-rca",
        title: "Vendor RCA",
        headers: [
            "Country",
            "Partner",
            "# Incidents",
            "Impact",
            "RCA"
        ],
        rows: tableRows
    };
};

APP.renderOverviewVendorTable = () => {
    const table =
        APP.getVendorRcaTable();

    if (!table.rows.length) {
        return `<div class="empty-state">No vendor issue rows match Partner Side + Vendor issue for the current filters.</div>`;
    }

    return `
<div class="overview-table-scroll">
    <table class="overview-rca-table overview-vendor-table">
        <thead>
            <tr>
                ${table.headers.map(header => `<th>${APP.escape(header)}</th>`).join("")}
            </tr>
        </thead>
        <tbody>
            ${table.rows.map((row, rowIndex) => `
            <tr class="${rowIndex % 2 ? "vendor-alt-row" : ""}">
                ${row.map((cell, cellIndex) => `
                    <td class="${cellIndex === 2 ? "num-cell" : ""}">${APP.escape(cell).replace(/\n/g, "<br>")}</td>
                `).join("")}
            </tr>
            `).join("")}
        </tbody>
    </table>
</div>
`;
};

APP.getOverviewMetricTable = () => {
    const metrics =
        APP.getOverviewMetrics();

    const period =
        APP.getReviewPeriod();

    return {
        id: "overview-period-metrics",
        title: `${period} View`,
        headers: [
            "Metric",
            `${period} View`
        ],
        rows: [
            ["Total Incidents", `${APP.formatNum(metrics.total)}${metrics.fundingTrendLabel ? ` (${metrics.fundingTrendLabel})` : ""}`],
            ["Partner-side Incidents", metrics.partnerSidePct + " of total"],
            ["Incidents >2 Days", metrics.moreThanTwoDaysPct],
            ["Primary Root Causes", metrics.primaryRootCauses]
        ]
    };
};

APP.getOverviewInsightTable = () => {
    const metrics =
        APP.getOverviewMetrics();

    return {
        id: "overview-insights",
        title: "Executive Insights",
        headers: [
            "Insight"
        ],
        rows: [
            [`${metrics.partnerSidePct} partner-side incidents in the filtered period`],
            [`Funding failures count is ${APP.formatNum(metrics.fundingCount)}, representing ${metrics.fundingPct} of incidents`],
            [`Top partners (${metrics.topPartners}) cause ${metrics.topPartnerShare}% of incidents`],
            [`Mostly impacted region is ${metrics.topRegion} with ${APP.formatNum(metrics.topRegionDelayed)} delayed transactions${metrics.topRegionBreached ? ` and ${APP.formatNum(metrics.topRegionBreached)} breached transactions` : ""}`],
            [`Repeated geographies: ${metrics.countries}`],
            [`${metrics.breachedPct} of delayed transactions breached delivery sla`],
            [`${metrics.resolvedWithinOneDayPct} issues were resolved within 1 day`],
            [`Approx ${APP.formatNum(metrics.reroute.txnCount)} transactions worth ${APP.formatNum(metrics.reroute.usd)} USD were manually rerouted to save transactions`]
        ]
    };
};

APP.getOverviewTables = () => [
    APP.getOverviewInsightTable(),
    APP.getOverviewMetricTable(),
    APP.getPlatformRcaTable(),
    APP.getVendorRcaTable()
].filter(table => table.rows && table.rows.length);

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

APP.getPivotColumns = () =>
    (() => {
        const rows =
            APP.getDataRows();

        return rows.length
            ? Object.keys(rows[0]).filter(Boolean)
            : [];
    })();

APP.getDataRows = () =>
    APP.pivotDataset === "rejections"
        ? (APP.filteredRejections || [])
        : (APP.DATA || []);

APP.getPivotState = () => {
    const columns =
        APP.getPivotColumns();
    const numericFallback =
        columns.find(column =>
            APP.getDataRows().some(
                row =>
                    APP.n(
                        APP.rowValue(
                            row,
                            column
                        )
                    ) > 0
            )
        ) || "";

    if (!APP.PIVOT) {
        APP.PIVOT = {
            row: columns.includes(APP.pivotDataset === "rejections" ? "PARTNERNAME" : "Partner")
                ? (APP.pivotDataset === "rejections" ? "PARTNERNAME" : "Partner")
                : (columns[0] || ""),
            column: "",
            value: numericFallback,
            agg: "count",
            chartType: "bar"
        };
    }

    if (
        APP.PIVOT.row &&
        !columns.includes(APP.PIVOT.row)
    ) {
        APP.PIVOT.row = columns[0] || "";
    }

    if (
        APP.PIVOT.column &&
        !columns.includes(APP.PIVOT.column)
    ) {
        APP.PIVOT.column = "";
    }

    if (
        APP.PIVOT.value &&
        !columns.includes(APP.PIVOT.value)
    ) {
        APP.PIVOT.value = numericFallback;
    }

    return APP.PIVOT;
};

APP.pivotOptions = (
    columns,
    selected,
    allowBlank = false
) =>
    `${allowBlank ? `<option value="">None</option>` : ""}` +
    columns.map(column => `
<option value="${APP.escape(column)}" ${selected === column ? "selected" : ""}>${APP.escape(column)}</option>
`).join("");

APP.getPivotResult = () => {
    const state =
        APP.getPivotState();
    const rows =
        APP.getDataRows();
    const rowKey =
        state.row;

    if (!rowKey) {
        return {
            title: "Pivot Result",
            headers: [],
            rows: [],
            chart: null
        };
    }

    const columnKey =
        state.column;
    const valueKey =
        state.value;
    const useCount =
        state.agg === "count" ||
        !valueKey;
    const matrix = {};
    const columnLabels =
        new Set();

    rows.forEach((row) => {
        const rowLabel =
            APP.rowValue(row, rowKey) || "Unknown";
        const columnLabel =
            columnKey
                ? APP.rowValue(
                    row,
                    columnKey
                ) || "Unknown"
                : "Value";
        const measure =
            useCount
                ? 1
                : APP.n(
                    APP.rowValue(
                        row,
                        valueKey
                    )
                );

        if (!matrix[rowLabel]) {
            matrix[rowLabel] = {};
        }

        matrix[rowLabel][columnLabel] =
            (matrix[rowLabel][columnLabel] || 0) +
            measure;

        columnLabels.add(columnLabel);
    });

    const orderedColumns =
        [...columnLabels];
    const bodyRows =
        Object.entries(matrix)
            .map(([label, values]) => {
                const cells =
                    orderedColumns.map(
                        key =>
                            APP.n(
                                values[key]
                            )
                    );
                return [
                    label,
                    ...cells,
                    cells.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    )
                ];
            })
            .sort(
                (a, b) =>
                    APP.n(
                        b[b.length - 1]
                    ) -
                    APP.n(
                        a[a.length - 1]
                    )
            )
            .slice(0, 20);

    const title =
        `${useCount ? "Count" : "Sum"} of ${valueKey || "Rows"} by ${rowKey}${columnKey ? ` and ${columnKey}` : ""}`;

    return {
        title,
        headers: [
            rowKey,
            ...orderedColumns,
            "Total"
        ],
        rows:
            bodyRows.map(row => [
                row[0],
                ...row.slice(1).map(
                    value =>
                        APP.formatNum(value)
                )
            ]),
        chart: {
            labels:
                bodyRows.map(row => row[0]),
            datasets:
                orderedColumns.map((label, index) => ({
                    label,
                    data:
                        bodyRows.map(
                            row =>
                                APP.n(
                                    row[index + 1]
                                )
                        ),
                    backgroundColor:
                        APP.colors[index % APP.colors.length],
                    borderColor:
                        APP.colors[index % APP.colors.length],
                    borderRadius: 6
                }))
        }
    };
};

APP.drawPivotChart = () => {
    const pivot =
        APP.getPivotResult();
    const canvas =
        APP.g("pivotChart");

    if (!canvas || !pivot.chart) return;

    if (APP.pivotChart) {
        APP.pivotChart.destroy();
    }

    const state =
        APP.getPivotState();
    const isCircular =
        state.chartType === "pie" ||
        state.chartType === "doughnut";
    const chartData =
        isCircular
            ? {
                labels:
                    pivot.chart.labels,
                datasets: [{
                    label:
                        pivot.chart.datasets[0]?.label || pivot.title,
                    data:
                        pivot.chart.datasets[0]?.data || [],
                    backgroundColor:
                        pivot.chart.labels.map(
                            (_, index) =>
                                APP.colors[index % APP.colors.length]
                        )
                }]
            }
            : pivot.chart;

    APP.pivotChart =
        new Chart(canvas, {
            type: state.chartType,
            data: chartData,
            options: APP.chartOptions(
                pivot.title,
                isCircular
                    ? { scales: {} }
                    : {}
            )
        });
    APP.registerChartForOverlays?.("pivotChart", APP.pivotChart);
};

APP.renderPivotBuilder = () => {
    const toggle =
        APP.g("pivotDatasetToggle");
    const panel =
        APP.g("pivotBuilder");
    const tableBox =
        APP.g("pivotTableWrap");

    if (!toggle || !panel || !tableBox) return;

    toggle.innerHTML = `
<label><input type="radio" name="pivotDataset" value="incidents" ${APP.pivotDataset !== "rejections" ? "checked" : ""}> Pivot on: Incidents</label>
<label><input type="radio" name="pivotDataset" value="rejections" ${APP.pivotDataset === "rejections" ? "checked" : ""}> Pivot on: Rejections</label>
`;

    document
        .querySelectorAll('input[name="pivotDataset"]')
        .forEach((input) => {
            input.onchange = () => {
                APP.pivotDataset =
                    input.value;
                APP.PIVOT = null;
                APP.renderPivotBuilder();
            };
        });

    const columns =
        APP.getPivotColumns();
    const state =
        APP.getPivotState();

    panel.innerHTML =
        columns.length
            ? `
<label class="pivot-field"><span>Rows</span><select id="pivotRow">${APP.pivotOptions(columns, state.row)}</select></label>
<label class="pivot-field"><span>Columns</span><select id="pivotColumn">${APP.pivotOptions(columns, state.column, true)}</select></label>
<label class="pivot-field"><span>Values</span><select id="pivotValue">${APP.pivotOptions(columns, state.value, true)}</select></label>
<label class="pivot-field"><span>Aggregation</span><select id="pivotAgg"><option value="count" ${state.agg === "count" ? "selected" : ""}>Count</option><option value="sum" ${state.agg === "sum" ? "selected" : ""}>Sum</option></select></label>
<label class="pivot-field"><span>Chart Type</span><select id="pivotChartType"><option value="bar" ${state.chartType === "bar" ? "selected" : ""}>Bar</option><option value="line" ${state.chartType === "line" ? "selected" : ""}>Line</option><option value="doughnut" ${state.chartType === "doughnut" ? "selected" : ""}>Doughnut</option><option value="pie" ${state.chartType === "pie" ? "selected" : ""}>Pie</option></select></label>
<label class="pivot-field"><span>Top rows</span><select id="pivotTopN">
<option value="5" ${String(state.topN || "20") === "5" ? "selected" : ""}>5</option>
<option value="10" ${String(state.topN || "20") === "10" ? "selected" : ""}>10</option>
<option value="20" ${String(state.topN || "20") === "20" ? "selected" : ""}>20</option>
<option value="50" ${String(state.topN || "20") === "50" ? "selected" : ""}>50</option>
<option value="all" ${String(state.topN || "20") === "all" ? "selected" : ""}>All</option>
</select></label>
`
            : `<div class="empty-state">Load workbook data to build pivot-style charts and tables.</div>`;

    const syncPivot = () => {
        APP.PIVOT = {
            dataset: APP.pivotDataset,
            row: APP.g("pivotRow")?.value || "",
            column: APP.g("pivotColumn")?.value || "",
            value: APP.g("pivotValue")?.value || "",
            agg: APP.g("pivotAgg")?.value || "count",
            chartType: APP.g("pivotChartType")?.value || "bar",
            topN: APP.g("pivotTopN")?.value || "20"
        };

        const pivot =
            APP.getPivotResult();

        tableBox.innerHTML =
            pivot.rows.length
                ? `
<div class="data-table-card">
    <div class="data-table-head">
        <h4>${APP.escape(pivot.title)}</h4>
        <span>${pivot.rows.length} rows</span>
    </div>
    <div class="data-table-scroll">
        <table class="data-table">
            <thead><tr>${pivot.headers.map((header) => `<th>${APP.escape(header)}</th>`).join("")}</tr></thead>
            <tbody>${pivot.rows.map((row) => `<tr>${row.map((cell) => `<td>${APP.escape(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
    </div>
</div>`
                : `<div class="empty-state">No pivot output is available for the current setup.</div>`;

        APP.drawPivotChart();
    };

    ["pivotRow", "pivotColumn", "pivotValue", "pivotAgg", "pivotChartType", "pivotTopN"].forEach((id) => {
        const el =
            APP.g(id);
        if (el) {
            el.onchange = syncPivot;
        }
    });

    syncPivot();
    void APP.renderPivotSavedWidgetsList();
};

APP.savePivotBuilderToDashboardConfig = async () => {
    if (!window.ConfigService) {
        alert("Config service is not loaded.");
        return;
    }

    const pivot =
        APP.getPivotResult();

    if (!pivot.rows.length) {
        alert("Build a pivot with at least one row before saving.");
        return;
    }

    const state =
        APP.getPivotState();
    const rowKey =
        state.row;
    const columnKey =
        state.column;
    const valueKey =
        state.value;
    const useCount =
        state.agg === "count" ||
        !valueKey;

    try {
        const config =
            await ConfigService.loadDashboardConfig();

        if (!config.widgets) {
            config.widgets = [];
        }

        const widget = {
            id: ConfigService.createWidgetId(),
            dataset: APP.pivotDataset === "rejections"
                ? "rejections"
                : "incidents",
            dataVersion: "2026.05",
            section: "Pivot",
            type: "chart",
            title: pivot.title,
            chartType: state.chartType || "bar",
            rows: [rowKey],
            columns: columnKey
                ? [columnKey]
                : [],
            values: [useCount
                ? "COUNT"
                : valueKey],
            topN: APP.getPivotRowLimit(state) === Number.POSITIVE_INFINITY
                ? null
                : APP.getPivotRowLimit(state),
            layout: {
                width: 12,
                height: 4,
                order: config.widgets.length + 1
            },
            visible: true,
            createdBy: "pivot-builder",
            source: "pivot-builder",
            exportable: true,
            slideTitle: pivot.title,
            pivotSpec: {
                row: rowKey,
                column: columnKey,
                value: valueKey,
                agg: state.agg,
                chartType: state.chartType,
                topN: state.topN
            }
        };

        config.widgets.push(widget);
        ConfigService.saveDashboardConfig(config);
        await APP.renderPivotSavedWidgetsList();
        alert("Saved pivot chart to dashboard config in this browser.");
    } catch (err) {
        console.error(err);
        alert("Could not save dashboard config. See console for details.");
    }
};

APP.renderPivotSavedWidgetsList = async () => {
    const ul =
        APP.g("pivotSavedWidgetsList");

    if (!ul || !window.ConfigService) {
        return;
    }

    try {
        const config =
            await ConfigService.loadDashboardConfig();
        const pivots =
            (config.widgets || []).filter((w) => w.source === "pivot-builder");

        ul.innerHTML =
            pivots.length
                ? pivots.map((w) =>
                    `<li><span class="pivot-saved-title-text">${APP.escape(w.title || w.id)}</span> <code class="pivot-saved-id">${APP.escape(w.id)}</code></li>`
                ).join("")
                : `<li class="empty-state">No saved pivot widgets yet.</li>`;
    } catch {
        ul.innerHTML =
            `<li class="empty-state">Could not read saved config.</li>`;
    }
};

APP.getRejectionRegisterTable = () => {
    const columns =
        APP.getRejectionColumns();

    return {
        id: "rejection-register",
        title: "Rejection Register",
        headers: columns,
        rows:
            APP.filteredRejections.map((row) =>
                columns.map((column) =>
                    APP.rowValue(row, column) ?? ""
                )
            )
    };
};

APP.getGlobalExportComponents = () => {
    const chartIds =
        (APP.exportOrder || [])
            .filter((id) => APP.charts[id]);
    const charts =
        chartIds.map((id) => ({
            type: "chart",
            id,
            title: APP.chartTitles?.[id] || id,
            exportGroup: String(id).startsWith("rc")
                ? "charts-rejection"
                : "charts-incident"
        }));
    const builderTables =
        APP.getOverviewTables().map((table) => ({
            ...table,
            type: "table",
            exportGroup: "builder"
        }));
    const graphTables = [
        ...(APP.getGraphTables?.() || []).map((table, index) => ({
            ...table,
            id: `graph-table-${index}`,
            type: "table",
            exportGroup: "tables"
        })),
        ...(APP.getRejectionGraphTables?.() || []).map((table, index) => ({
            ...table,
            id: `rejection-graph-table-${index}`,
            type: "table",
            exportGroup: "tables"
        }))
    ];
    const builderBundle =
        builderTables.length
            ? [{
                type: "tableBundle",
                id: "overview-builder-all-tables",
                title: "All Executive View Builder Tables",
                tables: builderTables,
                exportGroup: "builder"
            }]
            : [];
    const builderSections =
        APP.g("overviewBuilderSection")
            ? [{
                type: "section",
                id: "overview-builder",
                elementId: "overviewBuilderSection",
                title: "Current Executive View Builder Tab",
                checked: false,
                exportGroup: "builder"
            }]
            : [];
    const tables = [
        ...graphTables,
        {
            ...APP.getIncidentRegisterTable(),
            type: "table",
            exportGroup: "tables"
        },
        {
            ...APP.getRejectionRegisterTable(),
            type: "table",
            exportGroup: "tables"
        }
    ].filter((table) => table.rows && table.rows.length);

    return {
        sections:
            APP.getOverviewExportSections()
                .filter((section) => section.id !== "overview-builder")
                .map((section) => ({
                    ...section,
                    exportGroup: "overview"
                })),
        builder: [
            ...builderBundle,
            ...builderSections,
            ...builderTables.map((table) => ({
                ...table,
                type: "table",
                checked: false,
                exportGroup: "builder"
            }))
        ],
        charts,
        tables
    };
};

APP.analyticsMode = APP.analyticsMode || "charts";
APP.sidebarStorageKey = "payments-dashboard-sidebar-collapsed";
APP.collapsibleStorageKey = "payments-dashboard-collapsible-state";
APP.showChartLabels = APP.showChartLabels !== false;

APP.setPivotSaveStatus = (message, tone = "muted") => {
    const el =
        APP.g("pivotSaveStatus");

    if (!el) return;

    el.textContent = message;
    el.dataset.tone = tone;
};

APP.getPivotIdentity = (widgetOrSpec) =>
    JSON.stringify({
        dataset: widgetOrSpec.dataset || APP.pivotDataset || "incidents",
        section: widgetOrSpec.section || "Pivot",
        title: widgetOrSpec.title || "",
        chartType: widgetOrSpec.chartType || "",
        rows: widgetOrSpec.rows || [],
        columns: widgetOrSpec.columns || [],
        values: widgetOrSpec.values || [],
        topN: widgetOrSpec.topN || null,
        pivotSpec: widgetOrSpec.pivotSpec || null
    });

APP.shortenMiddle = (value, limit = 46) => {
    const text =
        String(value || "");

    if (text.length <= limit) {
        return text;
    }

    const edge =
        Math.max(8, Math.floor((limit - 3) / 2));

    return `${text.slice(0, edge)}...${text.slice(-edge)}`;
};

APP.download = (href, filename) => {
    const link =
        document.createElement("a");
    link.href = href;
    link.download = filename;
    link.click();
};

APP.renderSummary = APP.renderSummary || (() => {
    return;
});

APP.renderSuggestions = APP.renderSuggestions || (() => {
    return;
});

APP.getIncidentRegisterTable = () => {
    const columns =
        APP.getIncidentColumns();

    return {
        id: "incident-register",
        title: "Incident Register",
        headers: columns,
        rows:
            APP.DATA.map((row) =>
                columns.map((column) =>
                    APP.rowValue(row, column) ?? ""
                )
            )
    };
};

APP.defaultRejectionColumns = APP.defaultRejectionColumns || [
    "MONTH",
    "PARTNERNAME",
    "BANKNAME",
    "BANKCODE",
    "RECEIVECOUNTRYCODE",
    "STATUS",
    "SUBSTATE",
    "PARTNER_REJECTREASON"
];

APP.selectedRejectionColumns = APP.selectedRejectionColumns || null;

APP.getRejectionExcelColumns = () =>
    APP.REJECTIONS.length
        ? Object.keys(APP.REJECTIONS[0])
        : [];

APP.getRejectionColumns = () => {
    const excelColumns =
        APP.getRejectionExcelColumns();

    if (APP.selectedRejectionColumns === null) {
        APP.selectedRejectionColumns =
            APP.defaultRejectionColumns.filter((column) =>
                excelColumns.includes(column)
            );
    }

    return APP.selectedRejectionColumns.filter((column) =>
        excelColumns.includes(column)
    );
};

APP.renderRejectionColumnPicker = APP.renderRejectionColumnPicker || (() => {});

APP.renderRejectionTable = APP.renderRejectionTable || (() => {});

APP.tableViewState = APP.tableViewState || {};
APP.rejectionTableState = APP.rejectionTableState || {
    page: 1,
    pageSize: 100
};

APP.getTableState = (tableId) => {
    if (!APP.tableViewState[tableId]) {
        APP.tableViewState[tableId] = {
            topN: "",
            bottomN: "",
            sortBy: "value",
            sortDir: "desc",
            labelFilter: "",
            excludedLabels: [],
            controlsOpen: false
        };
    }

    return APP.tableViewState[tableId];
};

APP.tableCellValue = (value) => {
    const raw =
        String(value ?? "").replace(/,/g, "").trim();
    const numeric =
        Number(raw);

    return Number.isFinite(numeric) && raw !== ""
        ? numeric
        : String(value ?? "");
};

APP.applyTableState = (table, state) => {
    const labelIndex = 0;
    const valueIndex = Math.max(0, (table.headers?.length || 1) - 1);
    let rows =
        [...(table.rows || [])];

    if (state.labelFilter) {
        const needle =
            state.labelFilter.toLowerCase();
        rows =
            rows.filter((row) =>
                String(row[labelIndex] ?? "")
                    .toLowerCase()
                    .includes(needle)
            );
    }

    if (state.excludedLabels?.length) {
        const excluded =
            new Set(state.excludedLabels);
        rows =
            rows.filter((row) =>
                !excluded.has(String(row[labelIndex] ?? ""))
            );
    }

    rows.sort((a, b) => {
        const aValue =
            state.sortBy === "label"
                ? String(a[labelIndex] ?? "").toLowerCase()
                : APP.tableCellValue(a[valueIndex]);
        const bValue =
            state.sortBy === "label"
                ? String(b[labelIndex] ?? "").toLowerCase()
                : APP.tableCellValue(b[valueIndex]);

        if (aValue === bValue) return 0;

        const direction =
            state.sortDir === "asc"
                ? 1
                : -1;

        return aValue > bValue
            ? direction
            : -direction;
    });

    if (state.topN) {
        rows =
            rows.slice(0, Number(state.topN));
    } else if (state.bottomN) {
        rows =
            rows.slice(Math.max(0, rows.length - Number(state.bottomN)));
    }

    return {
        ...table,
        rows
    };
};

APP.tableLabelOptions = (table) =>
    APP.u((table.rows || []).map((row) => String(row[0] ?? ""))).slice(0, 40);

APP.renderTableControls = (tableId, table) => {
    const state =
        APP.getTableState(tableId);
    const labelOptions =
        APP.tableLabelOptions(table);

    return `
<div class="data-table-controls" data-table-controls="${APP.escape(tableId)}">
    <label class="pivot-field">
        <span>Top N</span>
        <select data-table-input="topN" data-table-id="${APP.escape(tableId)}">
            <option value="" ${!state.topN ? "selected" : ""}>All</option>
            <option value="5" ${state.topN === "5" ? "selected" : ""}>5</option>
            <option value="10" ${state.topN === "10" ? "selected" : ""}>10</option>
            <option value="20" ${state.topN === "20" ? "selected" : ""}>20</option>
        </select>
    </label>
    <label class="pivot-field">
        <span>Bottom N</span>
        <select data-table-input="bottomN" data-table-id="${APP.escape(tableId)}">
            <option value="" ${!state.bottomN ? "selected" : ""}>None</option>
            <option value="5" ${state.bottomN === "5" ? "selected" : ""}>5</option>
            <option value="10" ${state.bottomN === "10" ? "selected" : ""}>10</option>
            <option value="20" ${state.bottomN === "20" ? "selected" : ""}>20</option>
        </select>
    </label>
    <label class="pivot-field">
        <span>Sort By</span>
        <select data-table-input="sortBy" data-table-id="${APP.escape(tableId)}">
            <option value="value" ${state.sortBy === "value" ? "selected" : ""}>Value</option>
            <option value="label" ${state.sortBy === "label" ? "selected" : ""}>Label</option>
        </select>
    </label>
    <label class="pivot-field">
        <span>Direction</span>
        <select data-table-input="sortDir" data-table-id="${APP.escape(tableId)}">
            <option value="desc" ${state.sortDir === "desc" ? "selected" : ""}>Descending</option>
            <option value="asc" ${state.sortDir === "asc" ? "selected" : ""}>Ascending</option>
        </select>
    </label>
    <label class="pivot-field">
        <span>Label Filter</span>
        <input type="text" value="${APP.escape(state.labelFilter)}" placeholder="Contains text" data-table-input="labelFilter" data-table-id="${APP.escape(tableId)}">
    </label>
</div>
${labelOptions.length ? `
<div class="table-exclude-list">
    ${labelOptions.map((label) => `
    <button type="button" class="table-exclude-chip ${state.excludedLabels.includes(label) ? "active" : ""}" data-table-exclude="${APP.escape(label)}" data-table-id="${APP.escape(tableId)}">${APP.escape(APP.shortenMiddle(label, 28))}</button>
    `).join("")}
</div>
<div class="table-control-note">Filter first, then exclude labels, then sort, then apply Top N or Bottom N.</div>` : ""}
`;
};

APP.renderManagedTableCard = (table, tableId, titleOverride = "") => {
    const managed =
        APP.applyTableState(table, APP.getTableState(tableId));
    const state =
        APP.getTableState(tableId);

    return `
<article class="data-table-card" data-table-card="${APP.escape(tableId)}">
    <div class="data-table-head">
        <div class="data-table-head-main">
            <button type="button" class="table-controls-toggle" data-table-toggle="${APP.escape(tableId)}">${state.controlsOpen ? "Hide controls" : "Table controls"}</button>
            <h4>${APP.escape(titleOverride || table.title)}</h4>
        </div>
        <span>${managed.rows.length} rows</span>
    </div>
    ${APP.renderTableControls(tableId, table)
        .replace('data-table-controls"', `data-table-controls${state.controlsOpen ? "" : " hide"}"`)
        .replace('table-exclude-list"', `table-exclude-list${state.controlsOpen ? "" : " hide"}"`)
        .replace('table-control-note"', `table-control-note${state.controlsOpen ? "" : " hide"}"`)}
    <div class="data-table-scroll">
        <table class="data-table">
            <thead>
                <tr>${managed.headers.map((header) => `<th>${APP.escape(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${managed.rows.length
                    ? managed.rows.map((row) => `<tr>${row.map((cell) => `<td>${APP.escape(cell)}</td>`).join("")}</tr>`).join("")
                    : `<tr><td colspan="${Math.max(1, managed.headers.length)}">No rows match the active table controls.</td></tr>`}
            </tbody>
        </table>
    </div>
</article>
`;
};

APP.mergeIncidentSectionIntoAnalytics = () => {
    return;
};

APP.bindTableControlEvents = (scope = document) => {
    scope.querySelectorAll("[data-table-toggle]").forEach((button) => {
        if (button.dataset.bound === "1") return;
        button.dataset.bound = "1";
        button.addEventListener("click", APP.handleTableToggle);
    });
    scope.querySelectorAll("[data-table-input]").forEach((input) => {
        if (input.dataset.bound === "1") return;
        input.dataset.bound = "1";
        input.addEventListener("input", APP.handleTableControlInput);
        input.addEventListener("change", APP.handleTableControlInput);
    });

    scope.querySelectorAll("[data-table-exclude]").forEach((button) => {
        if (button.dataset.bound === "1") return;
        button.dataset.bound = "1";
        button.addEventListener("click", APP.handleTableExcludeToggle);
    });
};

APP.handleTableToggle = (event) => {
    const tableId =
        event.currentTarget.dataset.tableToggle;

    if (!tableId) return;

    const state =
        APP.getTableState(tableId);
    state.controlsOpen =
        !state.controlsOpen;
    APP.render();
};

APP.handleTableControlInput = (event) => {
    const tableId =
        event.target.dataset.tableId;
    const key =
        event.target.dataset.tableInput;

    if (!tableId || !key) return;

    const state =
        APP.getTableState(tableId);
    state[key] =
        event.target.value;

    if (key === "topN" && state.topN) {
        state.bottomN = "";
    }

    if (key === "bottomN" && state.bottomN) {
        state.topN = "";
    }

    APP.render();
};

APP.handleTableExcludeToggle = (event) => {
    const tableId =
        event.currentTarget.dataset.tableId;
    const label =
        event.currentTarget.dataset.tableExclude;

    if (!tableId) return;

    const state =
        APP.getTableState(tableId);
    const excluded =
        new Set(state.excludedLabels || []);

    if (excluded.has(label)) {
        excluded.delete(label);
    } else {
        excluded.add(label);
    }

    state.excludedLabels =
        [...excluded];
    APP.render();
};

APP.getOverviewExportSections = () => [
    {
        id: "overview-kpis",
        title: "Key Performance Indicators",
        elementId: "overviewKpiSection"
    },
    {
        id: "overview-priority",
        title: "Priority Breakdown",
        elementId: "overviewPrioritySection"
    },
    {
        id: "overview-impact",
        title: "Resolution and Impact Breakdown",
        elementId: "overviewImpactSection"
    },
    {
        id: "overview-builder",
        title: "Operational Insights",
        elementId: "overviewBuilderSection"
    }
];

APP.exportPresetStorageKey = APP.exportPresetStorageKey || "dashboardExportPresetsV1";
APP.exportProfileStorageKey = APP.exportProfileStorageKey || "dashboardExportLastProfileV1";
APP.exportPresetSelectionKey = APP.exportPresetSelectionKey || "dashboardExportLastPresetV1";
APP.themeStorageKey = APP.themeStorageKey || "payments-dashboard-theme";

APP.getDefaultExportProfiles = () => [
    {
        id: "base-profile",
        title: "Base Profile",
        itemIds: [
            "overview-kpis",
            "overview-priority",
            "overview-impact",
            "overview-builder",
            "c1",
            "c2",
            "rc1",
            "rc10",
            "incident-register",
            "rejection-register"
        ]
    }
];

APP.getDefaultExportPresets = () => [
    {
        id: "base-preset",
        title: "Base Preset",
        itemIds: [
            "overview-kpis",
            "overview-priority",
            "overview-impact",
            "overview-builder",
            "c1",
            "rc1",
            "incident-register",
            "rejection-register"
        ]
    }
];

APP.getStoredExportPresets = () => {
    try {
        const saved =
            JSON.parse(localStorage.getItem(APP.exportPresetStorageKey) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn("Could not read saved export presets.", error);
        return [];
    }
};

APP.saveStoredExportPresets = (presets) => {
    localStorage.setItem(
        APP.exportPresetStorageKey,
        JSON.stringify(presets)
    );
};

APP.exportProfileAliasMap = APP.exportProfileAliasMap || {
    "overview-summary": ["overview-kpis", "overview-priority", "overview-impact"],
    "overview-kpi-incidents": ["overview-kpis"],
    "overview-kpi-rejections": ["overview-kpis"],
    "overview-kpi-partner": ["overview-kpis"],
    "executive-summary-text": ["overview-builder"],
    "incidents-monthly-trend": ["c1"],
    "incidents-by-partner": ["c2"],
    "rejections-monthly-trend": ["rc1"],
    "rejections-by-bank": ["rc10"],
    "rejections-register": ["rejection-register"],
    "vendor-rca-table": ["overview-builder"]
};

APP.resolveExportProfileIds = (profile) => {
    const directIds =
        Array.isArray(profile?.itemIds) ? profile.itemIds : [];
    const widgetIds =
        Array.isArray(profile?.widgetIds) ? profile.widgetIds : [];

    return [
        ...directIds,
        ...widgetIds.flatMap((id) => APP.exportProfileAliasMap[id] || [id])
    ];
};

APP.applyExportSelection = (itemIds) => {
    const selected =
        new Set((itemIds || []).map(String));

    document.querySelectorAll(".global-export-check").forEach((input) => {
        input.checked =
            selected.has(input.value);
    });
};

APP.getExportModalProfiles = async () => {
    const defaults =
        APP.getDefaultExportProfiles();

    if (!window.ConfigService?.getExportProfiles) {
        return defaults;
    }

    try {
        const loaded =
            await ConfigService.getExportProfiles();
        const deduped =
            new Map();

        [...defaults, ...loaded].forEach((profile) => {
            if (profile?.id) {
                deduped.set(profile.id, profile);
            }
        });

        return [...deduped.values()];
    } catch (error) {
        console.warn("Could not load export profiles.", error);
        return defaults;
    }
};

APP.getExportModalPresets = () => {
    const defaults =
        APP.getDefaultExportPresets();
    const stored =
        APP.getStoredExportPresets();
    const existing =
        new Set(defaults.map((preset) => preset.id));

    return [
        ...defaults,
        ...stored.filter((preset) => !existing.has(preset.id))
    ];
};

APP.populateExportProfileSelect = async () => {
    const select =
        APP.g("exportProfileSelect");

    if (!select) return;

    const profiles =
        await APP.getExportModalProfiles();

    select.innerHTML = [
        `<option value="">Choose profile</option>`,
        ...profiles.map((profile) =>
            `<option value="${APP.escape(profile.id)}">${APP.escape(profile.title || profile.id)}</option>`
        )
    ].join("");

    const preferredId =
        localStorage.getItem(APP.exportProfileStorageKey) || "base-profile";
    const hasPreferred =
        profiles.some((profile) => profile.id === preferredId);

    select.value =
        hasPreferred ? preferredId : "";

    if (select.value) {
        const chosen =
            profiles.find((profile) => profile.id === select.value);
        APP.applyExportSelection(APP.resolveExportProfileIds(chosen));
    }
};

APP.populateExportPresetSelect = () => {
    const select =
        APP.g("exportUserPresetSelect");

    if (!select) return;

    const presets =
        APP.getExportModalPresets();

    select.innerHTML = [
        `<option value="">Choose preset</option>`,
        ...presets.map((preset) =>
            `<option value="${APP.escape(preset.id)}">${APP.escape(preset.title || preset.id)}</option>`
        )
    ].join("");

    const preferredId =
        localStorage.getItem(APP.exportPresetSelectionKey) || "base-preset";
    const hasPreferred =
        presets.some((preset) => preset.id === preferredId);

    select.value =
        hasPreferred ? preferredId : "";
};

APP.applyExportProfileById = async (profileId) => {
    if (!profileId) return;

    const profiles =
        await APP.getExportModalProfiles();
    const profile =
        profiles.find((item) => item.id === profileId);

    if (!profile) return;

    APP.applyExportSelection(APP.resolveExportProfileIds(profile));
    localStorage.setItem(APP.exportProfileStorageKey, profileId);

    const presetSelect =
        APP.g("exportUserPresetSelect");
    if (presetSelect) {
        presetSelect.value = "";
    }
};

APP.applyExportPresetById = (presetId) => {
    if (!presetId) return;

    const presets =
        APP.getExportModalPresets();
    const preset =
        presets.find((item) => item.id === presetId);

    if (!preset) return;

    APP.applyExportSelection(preset.itemIds || []);
    localStorage.setItem(APP.exportPresetSelectionKey, presetId);

    const profileSelect =
        APP.g("exportProfileSelect");
    if (profileSelect) {
        profileSelect.value = "";
    }
};

APP.saveCurrentExportPreset = () => {
    const input =
        APP.g("exportPresetNameInput");

    if (!input) return;

    const title =
        input.value.trim();

    if (!title) {
        alert("Enter a preset name first.");
        return;
    }

    const itemIds =
        [...document.querySelectorAll(".global-export-check:checked")]
            .map((inputEl) => inputEl.value);

    const presets =
        APP.getStoredExportPresets();

    if (presets.some((preset) => String(preset.title || "").trim().toLowerCase() === title.toLowerCase())) {
        alert("A preset with that name already exists.");
        return;
    }

    if (!itemIds.length) {
        alert("Select at least one export item before saving a preset.");
        return;
    }

    const id =
        `preset-${APP.slug(title)}-${Date.now()}`;

    presets.push({
        id,
        title,
        itemIds
    });
    APP.saveStoredExportPresets(presets);
    APP.populateExportPresetSelect();

    const presetSelect =
        APP.g("exportUserPresetSelect");
    if (presetSelect) {
        presetSelect.value = id;
    }

    localStorage.setItem(APP.exportPresetSelectionKey, id);
    input.value = "";
};

APP.getRejectionRegisterTable = () => {
    const columns =
        APP.getRejectionColumns();

    return {
        id: "rejection-register",
        title: "Rejection Register",
        headers: columns,
        rows:
            (APP.filteredRejections || []).map((row) =>
                columns.map((column) =>
                    APP.rowValue(row, column) ?? ""
                )
            )
    };
};

APP.getRejectionGraphTables = () => {
    const rejectionRows =
        APP.rejectionRows?.() || [];
    const byPartner =
        APP.groupCountEntries
            ? APP.groupCountEntries(rejectionRows, "PARTNERNAME", "rejections")
            : [];
    const byBank =
        APP.groupCountEntries
            ? APP.groupCountEntries(rejectionRows, "BANKNAME", "rejections")
            : [];
    const byStatus =
        APP.groupCountEntries
            ? APP.groupCountEntries(APP.filteredRejections, "STATUS", "rejections")
            : [];

    return [
        {
            title: "Rejected Transactions by Partner",
            headers: ["Partner", "Rejected Transactions"],
            rows: byPartner.map(([label, value]) => [label, APP.formatNum(value)])
        },
        {
            title: "Top Rejection Banks",
            headers: ["Bank", "Rejected Transactions"],
            rows: byBank.map(([label, value]) => [label, APP.formatNum(value)])
        },
        {
            title: "Rejection Status Distribution",
            headers: ["Status", "Rows"],
            rows: byStatus.map(([label, value]) => [label, APP.formatNum(value)])
        }
    ].filter((table) => table.rows.length);
};

APP.renderRejectionKPIs = () => {
    const box =
        APP.g("rejectionKpis");

    if (!box) return;

    const rows =
        APP.filteredRejections || [];
    const rejected =
        APP.rejectionRows?.() || [];
    const partnerCount =
        APP.u(rows.map((row) => APP.rowValue(row, "PARTNERNAME"))).length;
    const topBank =
        (APP.groupCountEntries?.(rejected, "BANKNAME", "rejections") || [])[0];

    const cards = [
        ["Filtered Rows", APP.formatNum(rows.length)],
        ["Rejected Rows", APP.formatNum(rejected.length)],
        ["Partners", APP.formatNum(partnerCount)],
        ["Top Bank", topBank ? `${topBank[0]} (${APP.formatNum(topBank[1])})` : "N/A"]
    ];

    box.innerHTML =
        cards.map(([label, value], index) => `
<article class="kpi-card kpi-${index}">
    <div class="kpi-label">${APP.escape(label)}</div>
    <div class="kpi-number">${APP.escape(value)}</div>
</article>
`).join("");
};

APP.renderRejectionColumnPicker = () => {
    const box =
        APP.g("rejectionColumnList");

    if (!box) return;

    const columns =
        APP.getRejectionExcelColumns();
    const selected =
        new Set(APP.getRejectionColumns());

    box.innerHTML =
        columns.length
            ? columns.map((column) => `
<label class="column-item">
    <input type="checkbox" class="rejection-column-check" value="${APP.escape(column)}" ${selected.has(column) ? "checked" : ""}>
    <span>${APP.escape(column)}</span>
</label>
`).join("")
            : `<div class="empty-state">Load a workbook to choose rejection columns.</div>`;

    box.querySelectorAll(".rejection-column-check").forEach((input) => {
        input.onchange = () => {
            APP.selectedRejectionColumns =
                [...box.querySelectorAll(".rejection-column-check:checked")]
                    .map((item) => item.value);
            APP.rejectionTableState.page = 1;
            APP.renderRejectionTable();
        };
    });
};

APP.renderRejectionTable = () => {
    const head =
        APP.g("rejectionHead");
    const body =
        APP.g("rejectionBody");

    if (!head || !body) return;

    const table =
        APP.getRejectionRegisterTable();
    const pageSize =
        Number(APP.rejectionTableState.pageSize) || 100;
    const totalRows =
        table.rows.length;
    const totalPages =
        Math.max(1, Math.ceil(totalRows / pageSize));

    APP.rejectionTableState.page =
        Math.min(
            Math.max(1, APP.rejectionTableState.page || 1),
            totalPages
        );

    const page =
        APP.rejectionTableState.page;
    const start =
        (page - 1) * pageSize;
    const visibleRows =
        table.rows.slice(start, start + pageSize);

    head.innerHTML =
        `<tr>${table.headers.map((header) => `<th>${APP.escape(header)}</th>`).join("")}</tr>`;
    body.innerHTML =
        visibleRows.length
            ? visibleRows.map((row) => `<tr>${row.map((cell) => `<td>${APP.escape(cell)}</td>`).join("")}</tr>`).join("")
            : `<tr><td colspan="${Math.max(1, table.headers.length)}">No rejection rows match the current filters.</td></tr>`;

    if (APP.g("rejectionShown")) {
        APP.g("rejectionShown").textContent =
            `${visibleRows.length} shown`;
    }

    if (APP.g("rejectionFilteredCount")) {
        APP.g("rejectionFilteredCount").textContent =
            `${totalRows} filtered`;
    }

    if (APP.g("rejectionPageInfo")) {
        APP.g("rejectionPageInfo").textContent =
            `Page ${page} of ${totalPages}`;
    }

    if (APP.g("rejectionPageSize")) {
        APP.g("rejectionPageSize").value =
            String(pageSize);
    }

    if (APP.g("btnRejectionPrevPage")) {
        APP.g("btnRejectionPrevPage").disabled =
            page <= 1;
    }

    if (APP.g("btnRejectionNextPage")) {
        APP.g("btnRejectionNextPage").disabled =
            page >= totalPages;
    }
};

APP.renderAnalyticsTables = () => {
    const incidentContainer =
        APP.g("analyticsIncidentTables");
    const rejectionContainer =
        APP.g("analyticsRejectionTables");

    const incidentTables =
        APP.getGraphTables?.() || [];
    const rejectionTables =
        APP.getRejectionGraphTables?.() || [];

    if (incidentContainer) {
        incidentContainer.innerHTML =
            incidentTables.length
                ? incidentTables.map((table, index) =>
                    APP.renderManagedTableCard(
                        table,
                        table.id || `incident-table-${index}`
                    )
                ).join("")
                : `<div class="empty-state">No incident table data available for the current filter selection.</div>`;
        APP.bindTableControlEvents(incidentContainer);
    }

    if (rejectionContainer) {
        rejectionContainer.innerHTML =
            rejectionTables.length
                ? rejectionTables.map((table, index) =>
                    APP.renderManagedTableCard(
                        table,
                        table.id || `rejection-table-${index}`
                    )
                ).join("")
                : `<div class="empty-state">No rejection table data available for the current filter selection.</div>`;
        APP.bindTableControlEvents(rejectionContainer);
    }
};

APP.renderRejectionTables = APP.renderAnalyticsTables;

APP.renderExportOptions = async () => {
    const list =
        APP.g("globalExportList");

    if (!list) return;

    const groups =
        APP.getGlobalExportComponents();

    const entries = [
        ["Overview sections", groups.sections],
        ["Builder tables", groups.builder],
        ["Charts", groups.charts],
        ["Tables", groups.tables]
    ].filter(([, items]) => items.length);

    list.innerHTML =
        entries.map(([label, items], groupIndex) => `
<div class="global-export-group" data-export-group="${groupIndex}">
    <div class="global-export-group-head">
        <h4>${APP.escape(label)}</h4>
        <div class="export-group-actions">
            <button type="button" data-export-select="${groupIndex}">All</button>
            <button type="button" data-export-clear="${groupIndex}">None</button>
        </div>
    </div>
    <div class="global-export-items">
        ${items.map((item) => `
        <label class="global-export-item">
            <input type="checkbox" class="global-export-check" data-export-group-index="${groupIndex}" data-export-key="${APP.escape(item.id)}" value="${APP.escape(item.id)}" ${item.checked === false ? "" : "checked"}>
            <span>${APP.escape(item.title)}</span>
        </label>`).join("")}
    </div>
</div>`).join("");

    list.querySelectorAll("[data-export-select]").forEach((button) => {
        button.onclick = () => {
            const groupIndex =
                button.dataset.exportSelect;
            list.querySelectorAll(`.global-export-check[data-export-group-index="${groupIndex}"]`)
                .forEach((input) => {
                    input.checked = true;
                });
        };
    });

    list.querySelectorAll("[data-export-clear]").forEach((button) => {
        button.onclick = () => {
            const groupIndex =
                button.dataset.exportClear;
            list.querySelectorAll(`.global-export-check[data-export-group-index="${groupIndex}"]`)
                .forEach((input) => {
                    input.checked = false;
                });
        };
    });

    await APP.populateExportProfileSelect();
    APP.populateExportPresetSelect();

    const presetSelect =
        APP.g("exportUserPresetSelect");
    if (presetSelect?.value) {
        APP.applyExportPresetById(presetSelect.value);
    }
};

APP.getSelectedExportItems = () => {
    const selectedIds =
        [...document.querySelectorAll(".global-export-check:checked")]
            .map((input) => input.value);
    const groups =
        APP.getGlobalExportComponents();

    return [
        ...groups.sections,
        ...groups.builder,
        ...groups.charts,
        ...groups.tables
    ].filter((item) => selectedIds.includes(item.id));
};

APP.exportTableToWorksheet = (table) => {
    const rows =
        table.rows.map((row) => {
            const out = {};
            table.headers.forEach((header, index) => {
                out[header] = row[index] ?? "";
            });
            return out;
        });

    return XLSX.utils.json_to_sheet(rows);
};

APP.addNativeTableSlide = (slide, item) => {
    const body =
        (item.rows || []).slice(0, 20).map((row) => row.map((cell) => String(cell ?? "")));
    const tableRows =
        [item.headers, ...body];

    slide.addTable(tableRows, {
        x: 0.4,
        y: 0.9,
        w: 12.4,
        h: 5.9,
        fontSize: 10,
        border: { type: "solid", pt: 1, color: "D8E1EC" },
        color: "1E293B",
        fill: "FFFFFF",
        bold: false,
        autoFit: true,
        margin: 0.06,
        rowH: 0.28
    });
};

APP.addNativeTextSlide = (slide, item) => {
    const lines =
        item.rows?.map((row) => row.join(" ")) || [];
    slide.addText(lines.join("\n"), {
        x: 0.55,
        y: 1.0,
        w: 12.0,
        h: 5.5,
        fontSize: 16,
        color: "0F172A",
        breakLine: false,
        valign: "top",
        margin: 0.08
    });
};

APP.addNativeChartSlide = (slide, item) => {
    const chart =
        APP.charts[item.id];

    if (!chart) {
        throw new Error(`Chart ${item.title} is not available.`);
    }

    const labels =
        chart.data?.labels || [];
    const chartData =
        (chart.data?.datasets || []).map((dataset) => ({
            name: dataset.label || item.title,
            labels,
            values: dataset.data || []
        }));
    const typeMap = {
        bar: PptxGenJS.ChartType.bar,
        line: PptxGenJS.ChartType.line,
        pie: PptxGenJS.ChartType.pie,
        doughnut: PptxGenJS.ChartType.doughnut
    };
    const chartType =
        typeMap[chart.config?.type || "bar"];

    if (!chartType) {
        throw new Error("Unsupported native chart type.");
    }

    slide.addChart(chartType, chartData, {
        x: 0.45,
        y: 0.95,
        w: 12.2,
        h: 5.8,
        showLegend: true,
        showTitle: false,
        catAxisLabelFontSize: 10,
        valAxisLabelFontSize: 10
    });
};

APP.captureElementPng = async (element) => {
    const canvas =
        await html2canvas(element, {
            backgroundColor: "#f8fafc",
            scale: 2,
            useCORS: true
        });

    return canvas.toDataURL("image/png");
};

APP.resolveExportTextItem = (item) => {
    if (item.type === "text") {
        return item;
    }

    if (item.type === "section") {
        if (item.id === "overview-summary") {
            const text =
                APP.g("execSummary")?.innerText?.trim();
            return text
                ? {
                    ...item,
                    type: "text",
                    rows: text.split(/\n+/).map((line) => [line.trim()]).filter((row) => row[0])
                }
                : null;
        }

        if (item.id === "overview-suggestions") {
            const rows =
                [...(APP.g("suggestions")?.querySelectorAll("li") || [])]
                    .map((li) => [li.textContent.trim()])
                    .filter((row) => row[0]);
            return rows.length
                ? {
                    ...item,
                    type: "text",
                    rows
                }
                : null;
        }
    }

    if (
        item.rows?.length &&
        (
            item.headers?.length === 1 ||
            (item.headers?.length === 2 && item.rows.length <= 12 && item.type !== "tableBundle")
        )
    ) {
        return {
            ...item,
            type: "text"
        };
    }

    return null;
};

APP.expandPptExportItems = (items) =>
    items.flatMap((item) => {
        if (item.type === "tableBundle" && item.tables?.length) {
            return item.tables.map((table, index) => ({
                ...table,
                id: `${item.id}-${index + 1}`,
                type: "table",
                title: table.title || `${item.title} ${index + 1}`
            }));
        }

        return [item];
    });

APP.exportSelectedItemsToPpt = async () => {
    const items =
        APP.expandPptExportItems(
            APP.getSelectedExportItems()
        );

    if (!items.length) {
        alert("Select at least one export item.");
        return;
    }

    const pres =
        new PptxGenJS();
    pres.layout = "LAYOUT_WIDE";
    pres.author = "Payments Dashboard";
    pres.title = "Payments Dashboard Export";

    for (const item of items) {
        const slide =
            pres.addSlide();
        slide.background = { color: "F8FAFC" };
        slide.addText(item.title, {
            x: 0.45,
            y: 0.25,
            w: 12.3,
            h: 0.35,
            fontSize: 18,
            bold: true,
            color: "0F172A"
        });

        try {
            const textItem =
                APP.resolveExportTextItem(item);

            if (textItem) {
                APP.addNativeTextSlide(slide, textItem);
                continue;
            }

            if (item.type === "table") {
                APP.addNativeTableSlide(slide, item);
                continue;
            }

            if (item.type === "chart") {
                APP.addNativeChartSlide(slide, item);
                continue;
            }

            if (item.type === "section" && item.elementId) {
                const sectionEl =
                    APP.g(item.elementId);
                if (sectionEl) {
                    const image =
                        await APP.captureElementPng(sectionEl);
                    slide.addImage({
                        data: image,
                        x: 0.45,
                        y: 0.85,
                        w: 12.2,
                        h: 5.9
                    });
                    continue;
                }
            }
        } catch (error) {
            console.warn(`Falling back to image export for ${item.title}.`, error);
        }

        const fallbackEl =
            item.elementId
                ? APP.g(item.elementId)
                : document.querySelector(`[data-export-id="${item.id}"]`) ||
                    document.getElementById(item.id);

        if (fallbackEl) {
            const image =
                await APP.captureElementPng(fallbackEl);
            slide.addImage({
                data: image,
                x: 0.45,
                y: 0.85,
                w: 12.2,
                h: 5.9
            });
        } else if (item.rows?.length) {
            APP.addNativeTableSlide(slide, item);
        }
    }

    await pres.writeFile({
        fileName: `payments-dashboard-${new Date().toISOString().slice(0, 10)}.pptx`
    });
};

APP.exportSelectedItemsToExcel = () => {
    const items =
        APP.getSelectedExportItems();

    if (!items.length) {
        alert("Select at least one export item.");
        return;
    }

    const workbook =
        XLSX.utils.book_new();

    items.forEach((item, index) => {
        if (item.type === "tableBundle") {
            (item.tables || []).forEach((table, tableIndex) => {
                XLSX.utils.book_append_sheet(
                    workbook,
                    APP.exportTableToWorksheet(table),
                    APP.shortenMiddle(`${table.title || item.title}-${tableIndex + 1}`, 28)
                );
            });
            return;
        }

        if (item.rows?.length && item.headers?.length) {
            XLSX.utils.book_append_sheet(
                workbook,
                APP.exportTableToWorksheet(item),
                APP.shortenMiddle(item.title || `Sheet ${index + 1}`, 28)
            );
        }
    });

    XLSX.writeFile(workbook, "payments-dashboard-export.xlsx");
};

APP.exportSelectedItemsToPng = async () => {
    const items =
        APP.getSelectedExportItems();

    if (!items.length) {
        alert("Select at least one export item.");
        return;
    }

    for (const item of items) {
        const el =
            item.elementId
                ? APP.g(item.elementId)
                : document.getElementById(item.id);

        if (!el) continue;

        const image =
            await APP.captureElementPng(el);
        APP.download(image, `${APP.slug(item.title)}.png`);
    }
};

APP.bindSettingsModal = () => {
    const modal =
        APP.g("settingsModal");
    const open = () => modal?.classList.remove("hide");
    const close = () => modal?.classList.add("hide");

    APP.g("btnSettings")?.addEventListener("click", open);
    APP.g("btnCloseSettings")?.addEventListener("click", close);
    APP.g("btnCloseSettingsModal")?.addEventListener("click", close);

    APP.g("btnDownloadDashboardConfig")?.addEventListener("click", async () => {
        const config =
            await ConfigService.loadDashboardConfig();
        ConfigService.downloadDashboardConfig(config);
    });

    APP.g("btnDownloadExportProfiles")?.addEventListener("click", async () => {
        const profiles =
            await ConfigService.loadExportProfiles();
        ConfigService.downloadExportProfiles(profiles);
    });

    APP.g("inputImportDashboardConfig")?.addEventListener("change", async (event) => {
        try {
            await ConfigService.importDashboardConfig(event.target.files?.[0]);
            APP.setPivotSaveStatus("Dashboard config imported.", "success");
            void APP.renderPivotSavedWidgetsList();
        } catch (error) {
            alert(error.message);
        }
        event.target.value = "";
    });

    APP.g("inputImportExportProfiles")?.addEventListener("change", async (event) => {
        try {
            await ConfigService.importExportProfiles(event.target.files?.[0]);
            APP.setPivotSaveStatus("Export profiles imported.", "success");
        } catch (error) {
            alert(error.message);
        }
        event.target.value = "";
    });

    APP.g("btnResetDashboardConfig")?.addEventListener("click", () => {
        localStorage.removeItem("payments-dashboard-config");
        void APP.clearWorkbookCache?.();
        APP.setPivotSaveStatus("Dashboard config reset to bundled defaults.", "success");
        void APP.renderPivotSavedWidgetsList();
    });

    APP.g("btnResetExportProfiles")?.addEventListener("click", () => {
        localStorage.removeItem("payments-dashboard-export-profiles");
        localStorage.removeItem(APP.exportProfileStorageKey);
        localStorage.removeItem(APP.exportPresetSelectionKey);
        APP.setPivotSaveStatus("Export profiles reset to bundled defaults.", "success");
    });

    APP.g("btnDownloadNormalizedWorkbook")?.addEventListener("click", () => {
        const workbook =
            XLSX.utils.book_new();

        if (APP.RAW.length) {
            XLSX.utils.book_append_sheet(
                workbook,
                XLSX.utils.json_to_sheet(APP.RAW),
                "DATA"
            );
        }

        if (APP.REJECTIONS.length) {
            XLSX.utils.book_append_sheet(
                workbook,
                XLSX.utils.json_to_sheet(APP.REJECTIONS),
                "REJECTIONS"
            );
        }

        ConfigService.exportWorkbook(
            "payments-dashboard-normalized.xlsx",
            workbook
        );
    });
};

APP.bindExportModal = () => {
    const modal =
        APP.g("exportModal");
    const open = async () => {
        await APP.renderExportOptions();
        modal?.classList.remove("hide");
    };
    const close = () => modal?.classList.add("hide");

    APP.g("btnGlobalExport")?.addEventListener("click", open);
    APP.g("btnCloseExportModal")?.addEventListener("click", close);
    APP.g("btnExportSelectAll")?.addEventListener("click", () => {
        document.querySelectorAll(".global-export-check").forEach((input) => {
            input.checked = true;
        });
    });
    APP.g("btnExportClearAll")?.addEventListener("click", () => {
        document.querySelectorAll(".global-export-check").forEach((input) => {
            input.checked = false;
        });
    });
    APP.g("btnExportPptGlobal")?.addEventListener("click", () => {
        void APP.exportSelectedItemsToPpt();
    });
    APP.g("btnExportExcelGlobal")?.addEventListener("click", APP.exportSelectedItemsToExcel);
    APP.g("btnExportPngGlobal")?.addEventListener("click", () => {
        void APP.exportSelectedItemsToPng();
    });
    APP.g("exportProfileSelect")?.addEventListener("change", (event) => {
        void APP.applyExportProfileById(event.target.value);
    });
    APP.g("exportUserPresetSelect")?.addEventListener("change", (event) => {
        APP.applyExportPresetById(event.target.value);
    });
    APP.g("btnSaveExportPreset")?.addEventListener("click", APP.saveCurrentExportPreset);
};

APP.renderPivotBuilder = () => {
    const toggle =
        APP.g("pivotDatasetToggle");
    const panel =
        APP.g("pivotBuilder");
    const tableBox =
        APP.g("pivotTableWrap");

    if (!toggle || !panel || !tableBox) return;

    toggle.innerHTML = `
<label><input type="radio" name="pivotDataset" value="incidents" ${APP.pivotDataset !== "rejections" ? "checked" : ""}> Pivot on: Incidents</label>
<label><input type="radio" name="pivotDataset" value="rejections" ${APP.pivotDataset === "rejections" ? "checked" : ""}> Pivot on: Rejections</label>
`;

    document
        .querySelectorAll('input[name="pivotDataset"]')
        .forEach((input) => {
            input.onchange = () => {
                APP.pivotDataset =
                    input.value;
                APP.PIVOT = null;
                APP.renderPivotBuilder();
            };
        });

    const columns =
        APP.getPivotColumns();
    const state =
        APP.getPivotState();

    panel.innerHTML =
        columns.length
            ? `
<label class="pivot-field"><span>Rows</span><select id="pivotRow">${APP.pivotOptions(columns, state.row)}</select></label>
<label class="pivot-field"><span>Columns</span><select id="pivotColumn">${APP.pivotOptions(columns, state.column, true)}</select></label>
<label class="pivot-field"><span>Values</span><select id="pivotValue">${APP.pivotOptions(columns, state.value, true)}</select></label>
<label class="pivot-field"><span>Aggregation</span><select id="pivotAgg"><option value="count" ${state.agg === "count" ? "selected" : ""}>Count</option><option value="sum" ${state.agg === "sum" ? "selected" : ""}>Sum</option></select></label>
<label class="pivot-field"><span>Chart Type</span><select id="pivotChartType"><option value="bar" ${state.chartType === "bar" ? "selected" : ""}>Bar</option><option value="line" ${state.chartType === "line" ? "selected" : ""}>Line</option><option value="doughnut" ${state.chartType === "doughnut" ? "selected" : ""}>Doughnut</option><option value="pie" ${state.chartType === "pie" ? "selected" : ""}>Pie</option></select></label>
<label class="pivot-field"><span>Top rows</span><select id="pivotTopN">
<option value="5" ${String(state.topN || "20") === "5" ? "selected" : ""}>5</option>
<option value="10" ${String(state.topN || "20") === "10" ? "selected" : ""}>10</option>
<option value="20" ${String(state.topN || "20") === "20" ? "selected" : ""}>20</option>
<option value="50" ${String(state.topN || "20") === "50" ? "selected" : ""}>50</option>
<option value="all" ${String(state.topN || "20") === "all" ? "selected" : ""}>All</option>
</select></label>
`
            : `<div class="empty-state">Load workbook data to build pivot-style charts and tables.</div>`;

    const syncPivot = () => {
        APP.PIVOT = {
            dataset: APP.pivotDataset,
            row: APP.g("pivotRow")?.value || "",
            column: APP.g("pivotColumn")?.value || "",
            value: APP.g("pivotValue")?.value || "",
            agg: APP.g("pivotAgg")?.value || "count",
            chartType: APP.g("pivotChartType")?.value || "bar",
            topN: APP.g("pivotTopN")?.value || "20"
        };

        const pivot =
            APP.getPivotResult();

        tableBox.innerHTML =
            pivot.rows.length
                ? APP.renderManagedTableCard(
                    {
                        ...pivot,
                        id: "pivot-output-table"
                    },
                    "pivot-output-table",
                    pivot.title
                )
                : `<div class="empty-state">No pivot output is available for the current setup.</div>`;

        APP.drawPivotChart();
        APP.bindTableControlEvents(tableBox);
    };

    ["pivotRow", "pivotColumn", "pivotValue", "pivotAgg", "pivotChartType", "pivotTopN"].forEach((id) => {
        const el =
            APP.g(id);
        if (el) {
            el.onchange = syncPivot;
        }
    });

    syncPivot();
    void APP.renderPivotSavedWidgetsList();
};

APP.pivotViewState = APP.pivotViewState || {
    incidents: null,
    rejections: null
};
APP.embeddedPivotCharts = APP.embeddedPivotCharts || {};

APP.getPivotRowsFor = (dataset) =>
    dataset === "rejections"
        ? (APP.filteredRejections || [])
        : (APP.DATA || []);

APP.getPivotColumnsFor = (dataset) => {
    const rows =
        APP.getPivotRowsFor(dataset);

    return rows.length
        ? Object.keys(rows[0]).filter(Boolean)
        : [];
};

APP.getPivotStateFor = (dataset) => {
    const columns =
        APP.getPivotColumnsFor(dataset);
    const rows =
        APP.getPivotRowsFor(dataset);
    const numericFallback =
        columns.find((column) =>
            rows.some((row) =>
                APP.n(APP.rowValue(row, column)) > 0
            )
        ) || "";
    const defaultRow =
        columns.includes(dataset === "rejections" ? "PARTNERNAME" : "Partner")
            ? (dataset === "rejections" ? "PARTNERNAME" : "Partner")
            : (columns[0] || "");

    if (!APP.pivotViewState[dataset]) {
        APP.pivotViewState[dataset] = {
            row: defaultRow,
            column: "",
            value: numericFallback,
            agg: "count",
            chartType: "bar",
            topN: "20"
        };
    }

    const state =
        APP.pivotViewState[dataset];

    if (state.row && !columns.includes(state.row)) {
        state.row = defaultRow;
    }

    if (state.column && !columns.includes(state.column)) {
        state.column = "";
    }

    if (state.value && !columns.includes(state.value)) {
        state.value = numericFallback;
    }

    return state;
};

APP.getPivotRowLimitFor = (state) =>
    String(state.topN || "20").toLowerCase() === "all"
        ? Number.POSITIVE_INFINITY
        : Math.max(1, Number(state.topN) || 20);

APP.getPivotResultFor = (dataset) => {
    const state =
        APP.getPivotStateFor(dataset);
    const rows =
        APP.getPivotRowsFor(dataset);
    const rowKey =
        state.row;

    if (!rowKey) {
        return {
            title: "Pivot Result",
            headers: [],
            rows: [],
            chart: null
        };
    }

    const columnKey =
        state.column;
    const valueKey =
        state.value;
    const useCount =
        state.agg === "count" ||
        !valueKey;
    const matrix = {};
    const columnLabels =
        new Set();

    rows.forEach((row) => {
        const rowLabel =
            APP.rowValue(row, rowKey) || "Unknown";
        const columnLabel =
            columnKey
                ? (APP.rowValue(row, columnKey) || "Unknown")
                : "Value";

        matrix[rowLabel] =
            matrix[rowLabel] || {};
        matrix[rowLabel][columnLabel] =
            (matrix[rowLabel][columnLabel] || 0) +
            (useCount ? 1 : APP.n(APP.rowValue(row, valueKey)));
        columnLabels.add(columnLabel);
    });

    const orderedColumns =
        [...columnLabels];
    const limit =
        APP.getPivotRowLimitFor(state);
    const bodyRows =
        Object.entries(matrix)
            .map(([label, values]) => {
                const cells =
                    orderedColumns.map((key) => APP.n(values[key]));
                return [
                    label,
                    ...cells,
                    cells.reduce((sum, value) => sum + value, 0)
                ];
            })
            .sort((a, b) => APP.n(b[b.length - 1]) - APP.n(a[a.length - 1]))
            .slice(0, limit === Number.POSITIVE_INFINITY ? undefined : limit);

    const title =
        `${useCount ? "Count" : "Sum"} of ${valueKey || "Rows"} by ${rowKey}${columnKey ? ` and ${columnKey}` : ""}`;

    return {
        title,
        headers: [
            rowKey,
            ...orderedColumns,
            "Total"
        ],
        rows: bodyRows.map((row) => [
            row[0],
            ...row.slice(1).map((value) => APP.formatNum(value))
        ]),
        chart: {
            labels: bodyRows.map((row) => row[0]),
            datasets: orderedColumns.map((label, index) => ({
                label,
                data: bodyRows.map((row) => APP.n(row[index + 1])),
                backgroundColor: APP.colors[index % APP.colors.length],
                borderColor: APP.colors[index % APP.colors.length],
                borderRadius: 6
            }))
        }
    };
};

APP.drawPivotChartFor = (dataset, canvasId) => {
    const pivot =
        APP.getPivotResultFor(dataset);
    const canvas =
        APP.g(canvasId);

    if (!canvas || !pivot.chart) return;

    if (APP.embeddedPivotCharts[dataset]) {
        APP.embeddedPivotCharts[dataset].destroy();
    }

    const state =
        APP.getPivotStateFor(dataset);
    const isCircular =
        state.chartType === "pie" ||
        state.chartType === "doughnut";
    const chartData =
        isCircular
            ? {
                labels: pivot.chart.labels,
                datasets: [{
                    label: pivot.chart.datasets[0]?.label || pivot.title,
                    data: pivot.chart.datasets[0]?.data || [],
                    backgroundColor: pivot.chart.labels.map((_, index) => APP.colors[index % APP.colors.length])
                }]
            }
            : pivot.chart;

    APP.embeddedPivotCharts[dataset] =
        new Chart(canvas, {
            type: state.chartType,
            data: chartData,
            options: APP.chartOptions(
                pivot.title,
                isCircular ? { scales: {} } : {}
            )
        });
    APP.registerChartForOverlays?.(canvasId, APP.embeddedPivotCharts[dataset]);
};

APP.renderScopedPivotBuilder = ({ dataset, builderId, tableWrapId, canvasId }) => {
    const panel =
        APP.g(builderId);
    const tableBox =
        APP.g(tableWrapId);

    if (!panel || !tableBox) return;

    const columns =
        APP.getPivotColumnsFor(dataset);
    const state =
        APP.getPivotStateFor(dataset);

    panel.innerHTML =
        columns.length
            ? `
<label class="pivot-field"><span>Rows</span><select data-pivot-input="${dataset}" data-pivot-key="row">${APP.pivotOptions(columns, state.row)}</select></label>
<label class="pivot-field"><span>Columns</span><select data-pivot-input="${dataset}" data-pivot-key="column">${APP.pivotOptions(columns, state.column, true)}</select></label>
<label class="pivot-field"><span>Values</span><select data-pivot-input="${dataset}" data-pivot-key="value">${APP.pivotOptions(columns, state.value, true)}</select></label>
<label class="pivot-field"><span>Aggregation</span><select data-pivot-input="${dataset}" data-pivot-key="agg"><option value="count" ${state.agg === "count" ? "selected" : ""}>Count</option><option value="sum" ${state.agg === "sum" ? "selected" : ""}>Sum</option></select></label>
<label class="pivot-field"><span>Chart Type</span><select data-pivot-input="${dataset}" data-pivot-key="chartType"><option value="bar" ${state.chartType === "bar" ? "selected" : ""}>Bar</option><option value="line" ${state.chartType === "line" ? "selected" : ""}>Line</option><option value="doughnut" ${state.chartType === "doughnut" ? "selected" : ""}>Doughnut</option><option value="pie" ${state.chartType === "pie" ? "selected" : ""}>Pie</option></select></label>
<label class="pivot-field"><span>Top Rows</span><select data-pivot-input="${dataset}" data-pivot-key="topN"><option value="5" ${String(state.topN) === "5" ? "selected" : ""}>5</option><option value="10" ${String(state.topN) === "10" ? "selected" : ""}>10</option><option value="20" ${String(state.topN) === "20" ? "selected" : ""}>20</option><option value="50" ${String(state.topN) === "50" ? "selected" : ""}>50</option><option value="all" ${String(state.topN) === "all" ? "selected" : ""}>All</option></select></label>
`
            : `<div class="empty-state">Load workbook data to build pivot-style charts and tables.</div>`;

    const syncPivot = () => {
        const pivot =
            APP.getPivotResultFor(dataset);

        tableBox.innerHTML =
            pivot.rows.length
                ? APP.renderManagedTableCard(
                    {
                        ...pivot,
                        id: `${dataset}-pivot-output-table`
                    },
                    `${dataset}-pivot-output-table`,
                    pivot.title
                )
                : `<div class="empty-state">No pivot output is available for the current setup.</div>`;

        APP.drawPivotChartFor(dataset, canvasId);
        APP.bindTableControlEvents(tableBox);
    };

    panel.querySelectorAll(`[data-pivot-input="${dataset}"]`).forEach((input) => {
        input.onchange = () => {
            APP.pivotViewState[dataset][input.dataset.pivotKey] = input.value;
            syncPivot();
        };
    });

    syncPivot();
};

APP.renderEmbeddedPivots = () => {
    APP.renderScopedPivotBuilder({
        dataset: "incidents",
        builderId: "incidentPivotBuilder",
        tableWrapId: "incidentPivotTableWrap",
        canvasId: "incidentPivotChart"
    });
    APP.renderScopedPivotBuilder({
        dataset: "rejections",
        builderId: "rejectionPivotBuilder",
        tableWrapId: "rejectionPivotTableWrap",
        canvasId: "rejectionPivotChart"
    });
};

APP.setAnalyticsMode = (mode) => {
    APP.analyticsMode =
        mode === "tables" || mode === "pivot"
            ? mode
            : "charts";

    APP.g("analyticsChartPanel")?.classList.toggle("hide", APP.analyticsMode !== "charts");
    APP.g("analyticsTablePanel")?.classList.toggle("hide", APP.analyticsMode !== "tables");
    APP.g("analyticsPivotPanel")?.classList.toggle("hide", APP.analyticsMode !== "pivot");

    document.querySelectorAll(".analytics-mode-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.analyticsMode === APP.analyticsMode);
    });
};

APP.bindAnalyticsMode = () => {
    document.querySelectorAll(".analytics-mode-btn").forEach((button) => {
        button.addEventListener("click", () => {
            APP.setAnalyticsMode(button.dataset.analyticsMode);
        });
    });
    APP.setAnalyticsMode(APP.analyticsMode);
};

APP.setSidebarCollapsed = (collapsed) => {
    APP.g("filterSidebar")?.closest(".layout")?.classList.toggle("sidebar-collapsed", collapsed);
    APP.g("btnOpenSidebar")?.classList.toggle("hide", !collapsed);
    APP.g("btnOpenSidebar")?.setAttribute("aria-expanded", String(!collapsed));
    APP.g("btnCloseSidebar")?.setAttribute("aria-expanded", String(!collapsed));
    localStorage.setItem(APP.sidebarStorageKey, collapsed ? "1" : "0");
};

APP.sectionCollapseState = APP.sectionCollapseState || {};

APP.loadSectionCollapseState = () => {
    if (APP.sectionCollapseStateLoaded) {
        return APP.sectionCollapseState;
    }

    try {
        APP.sectionCollapseState =
            JSON.parse(localStorage.getItem(APP.collapsibleStorageKey) || "{}") || {};
    } catch {
        APP.sectionCollapseState = {};
    }

    APP.sectionCollapseStateLoaded = true;
    return APP.sectionCollapseState;
};

APP.saveSectionCollapseState = () => {
    localStorage.setItem(
        APP.collapsibleStorageKey,
        JSON.stringify(APP.sectionCollapseState || {})
    );
};

APP.getCollapsibleSectionId = (section, index) =>
    section.dataset.sectionKey ||
    section.dataset.collapseId ||
    section.id ||
    `collapsible-section-${index}`;

APP.handleSectionCollapseToggle = (event) => {
    const button =
        event.currentTarget;
    const sectionId =
        button.dataset.sectionToggle;

    if (!sectionId) return;

    APP.sectionCollapseState[sectionId] =
        !APP.sectionCollapseState[sectionId];
    APP.saveSectionCollapseState();
    APP.enhanceCollapsibleSections?.();
};

APP.enhanceCollapsibleSections = () => {
    APP.loadSectionCollapseState();
    const sections =
        [...document.querySelectorAll("[data-collapsible]")];

    sections.forEach((section, index) => {
        const sectionId =
            APP.getCollapsibleSectionId(section, index);
        section.dataset.collapseId = sectionId;

        let header =
            section.querySelector(":scope > .section-collapse-header");
        let body =
            section.querySelector(":scope > .section-collapse-body");

        if (!header) {
            const existingHeader =
                [
                    ".table-section-head",
                    ".column-panel-head",
                    ".export-head",
                    ".analytics-view-mode__head",
                    ".overview-builder-head",
                    ".incident-toolbar",
                    "h3"
                ]
                    .map((selector) => section.querySelector(`:scope > ${selector}`))
                    .find(Boolean);

            if (existingHeader) {
                header =
                    existingHeader;
                header.classList.add("section-collapse-header");
            } else {
                header =
                    document.createElement("div");
                header.className = "section-collapse-header";
                header.innerHTML = `<h3>${APP.escape(section.dataset.collapsibleTitle || "Section")}</h3>`;
                section.prepend(header);
            }
        }

        if (!body) {
            body =
                document.createElement("div");
            body.className = "section-collapse-body";
            const children =
                [...section.children].filter((child) => child !== header);
            children.forEach((child) => body.appendChild(child));
            section.appendChild(body);
        }

        let actions =
            header.querySelector(".section-collapse-actions");
        if (!actions) {
            actions =
                document.createElement("div");
            actions.className = "section-collapse-actions";
            header.appendChild(actions);
        }

        let button =
            actions.querySelector(`[data-section-toggle="${sectionId}"]`);
        if (!button) {
            button =
                document.createElement("button");
            button.type = "button";
            button.className = "section-collapse-toggle";
            button.dataset.sectionToggle = sectionId;
            button.addEventListener("click", APP.handleSectionCollapseToggle);
            actions.appendChild(button);
        }

        const collapsed =
            APP.sectionCollapseState[sectionId] === true;

        section.classList.toggle("is-collapsed", collapsed);
        body.classList.toggle("hide", collapsed);
        button.textContent = collapsed ? "Show" : "Hide";
        button.setAttribute("aria-expanded", String(!collapsed));
    });
};

APP.updateFilterStats = (incidentCount, rejectionCount) => {
    const el =
        APP.g("filterDataStats");

    if (!el) return;

    el.innerHTML = `
<span class="stat-pill stat-pill--incidents"><b>${Number(incidentCount || 0).toLocaleString()}</b> incidents</span>
<span class="stat-pill stat-pill--rejections"><b>${Number(rejectionCount || 0).toLocaleString()}</b> rejections</span>
`;
};

APP.bindSidebar = () => {
    const collapsed =
        localStorage.getItem(APP.sidebarStorageKey) === "1";

    APP.g("btnCloseSidebar")?.addEventListener("click", () => {
        APP.setSidebarCollapsed(true);
    });
    APP.g("btnOpenSidebar")?.addEventListener("click", () => {
        APP.setSidebarCollapsed(false);
    });

    APP.setSidebarCollapsed(window.innerWidth <= 1000 ? true : collapsed);
};

APP.renderOverviewInsights = () => {
    const metrics =
        APP.getOverviewMetrics();

    return `
<ul class="overview-bullets">
    <li><b>${metrics.partnerSidePct}</b> partner-side incidents in the filtered period</li>
    <li>Funding failures count is <b>${APP.formatNum(metrics.fundingCount)}</b>, representing <b>${metrics.fundingPct}</b> of incidents</li>
    <li>Top partners (<b>${APP.escape(metrics.topPartners)}</b>) cause <b>${metrics.topPartnerShare}%</b> of incidents</li>
    <li>Mostly impacted region is <b>${APP.escape(metrics.topRegion)}</b> with <b>${APP.formatNum(metrics.topRegionDelayed)}</b> delayed transactions${metrics.topRegionBreached ? ` and <b>${APP.formatNum(metrics.topRegionBreached)}</b> breached transactions` : ""}</li>
    <li>Repeated geographies: <b>${metrics.countries}</b></li>
    <li><b>${metrics.breachedPct}</b> of delayed transactions breached delivery sla</li>
    <li><b>${metrics.resolvedWithinOneDayPct}</b> issues were resolved within 1 day</li>
    <li>Approx <b>${APP.formatNum(metrics.reroute.txnCount)}</b> transactions worth <b>${APP.formatNum(metrics.reroute.usd)} USD</b> were manually rerouted to save transactions</li>
</ul>
`;
};

APP.savePivotBuilderToDashboardConfig = async () => {
    if (!window.ConfigService) {
        alert("Config service is not loaded.");
        return;
    }

    const pivot =
        APP.getPivotResult();

    if (!pivot.rows.length) {
        alert("Build a pivot with at least one row before saving.");
        return;
    }

    const state =
        APP.getPivotState();
    const rowKey =
        state.row;
    const columnKey =
        state.column;
    const valueKey =
        state.value;
    const useCount =
        state.agg === "count" ||
        !valueKey;

    try {
        const config =
            await ConfigService.loadDashboardConfig();

        if (!config.widgets) {
            config.widgets = [];
        }

        const draft = {
            dataset: APP.pivotDataset === "rejections" ? "rejections" : "incidents",
            section: "Pivot",
            title: pivot.title,
            chartType: state.chartType || "bar",
            rows: [rowKey],
            columns: columnKey ? [columnKey] : [],
            values: [useCount ? "COUNT" : valueKey],
            topN: APP.getPivotRowLimit(state) === Number.POSITIVE_INFINITY ? null : APP.getPivotRowLimit(state),
            pivotSpec: {
                row: rowKey,
                column: columnKey,
                value: valueKey,
                agg: state.agg,
                chartType: state.chartType,
                topN: state.topN
            }
        };
        const duplicate =
            config.widgets.find((widget) =>
                widget.source === "pivot-builder" &&
                APP.getPivotIdentity(widget) === APP.getPivotIdentity(draft)
            );

        if (duplicate) {
            APP.setPivotSaveStatus("This pivot chart is already saved in the dashboard config.", "warning");
            alert("This pivot chart is already saved.");
            return;
        }

        config.widgets.push({
            id: ConfigService.createWidgetId(),
            dataVersion: "2026.05",
            layout: {
                width: 12,
                height: 4,
                order: config.widgets.length + 1
            },
            visible: true,
            createdBy: "pivot-builder",
            source: "pivot-builder",
            exportable: true,
            slideTitle: pivot.title,
            ...draft
        });
        ConfigService.saveDashboardConfig(config);
        await APP.renderPivotSavedWidgetsList();
        APP.setPivotSaveStatus("Pivot chart saved to dashboard config.", "success");
    } catch (err) {
        console.error(err);
        APP.setPivotSaveStatus("Could not save dashboard config.", "error");
        alert("Could not save dashboard config. See console for details.");
    }
};

APP.renderPivotSavedWidgetsList = async () => {
    const ul =
        APP.g("pivotSavedWidgetsList");

    if (!ul || !window.ConfigService) {
        return;
    }

    try {
        const config =
            await ConfigService.loadDashboardConfig();
        const pivots =
            (config.widgets || []).filter((w) => w.source === "pivot-builder");

        ul.innerHTML =
            pivots.length
                ? pivots.map((w) => {
                    const title =
                        w.title || w.id;
                    const detail =
                        `${w.dataset || "incidents"} | ${w.chartType || "chart"} | ${w.pivotSpec?.row || "row"}${w.pivotSpec?.column ? ` x ${w.pivotSpec.column}` : ""}`;
                    return `<li title="${APP.escape(`${title} (${w.id})`)}"><span class="pivot-saved-title-text">${APP.escape(APP.shortenMiddle(title, 56))}</span><span class="pivot-saved-meta">${APP.escape(detail)}</span><code class="pivot-saved-id">${APP.escape(APP.shortenMiddle(w.id, 34))}</code></li>`;
                }).join("")
                : `<li class="empty-state">No saved pivot widgets yet.</li>`;
    } catch {
        ul.innerHTML =
            `<li class="empty-state">Could not read saved config.</li>`;
    }
};

APP.render = () => {
    APP.g("count").textContent =
        `${APP.DATA.length} records`;

    APP.updateFilterStats?.(APP.DATA.length, APP.filteredRejections.length);

    APP.renderSummary?.();
    APP.renderKPIs?.();
    APP.renderPriorityBreakdown?.();
    APP.renderSecondaryBreakdowns?.();
    APP.renderOverviewTabs?.();
    APP.renderSuggestions?.();
    APP.renderRejectionKPIs?.();
    APP.renderIncidentColumnPicker?.();
    APP.renderRejectionColumnPicker?.();
    APP.renderTable?.();
    APP.renderRejectionTable?.();
    APP.draw?.();
    APP.renderAnalyticsTables?.();
    APP.renderRejectionTables?.();
    APP.renderPivotBuilder?.();
    APP.renderEmbeddedPivots?.();
    APP.renderExportOptions?.();
    APP.syncChartFilterMirrors?.();
    APP.setAnalyticsMode?.(APP.analyticsMode);
    APP.enhanceCollapsibleSections?.();
};

APP.syncThemeToggleIcons = () => {
    const isDark =
        document.documentElement.classList.contains("dark");
    APP.g("iconSun")?.classList.toggle("hide", !isDark);
    APP.g("iconMoon")?.classList.toggle("hide", isDark);
};

APP.initTheme = () => {
    const root =
        document.documentElement;
    const stored =
        localStorage.getItem(APP.themeStorageKey);
    const prefersDark =
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const useDark =
        stored
            ? stored === "dark"
            : Boolean(prefersDark);

    root.classList.toggle("dark", useDark);
    APP.syncThemeToggleIcons();

    APP.g("btnDarkMode")?.addEventListener("click", () => {
        root.classList.toggle("dark");
        localStorage.setItem(
            APP.themeStorageKey,
            root.classList.contains("dark")
                ? "dark"
                : "light"
        );
        APP.syncThemeToggleIcons();
        APP.draw?.();
    });
};

APP.bindLegacyControls = () => {
    document.querySelectorAll(".tab[data-view]").forEach((button) => {
        button.addEventListener("click", () => {
            APP.view(button.dataset.view);
        });
    });
    APP.g("btnApply")?.addEventListener("click", APP.apply);
    APP.g("btnReset")?.addEventListener("click", APP.reset);
    APP.g("btnOpenIncidentFilters")?.addEventListener("click", () => {
        APP.setSidebarCollapsed(false);
        APP.g("filterSidebar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    APP.g("btnOpenRejectionFilters")?.addEventListener("click", () => {
        APP.setSidebarCollapsed(false);
        APP.g("filterSidebar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    APP.g("btnDefaultColumns")?.addEventListener("click", () => {
        const excelColumns =
            APP.getExcelColumns();
        APP.selectedIncidentColumns =
            APP.defaultIncidentColumns
                .map((column) =>
                    APP.findColumnName(
                        APP.RAW,
                        column
                    )
                )
                .filter((column) => excelColumns.includes(column));
        APP.renderIncidentColumnPicker();
        APP.renderTable();
    });
    APP.g("btnAllColumns")?.addEventListener("click", () => {
        APP.selectedIncidentColumns =
            APP.getExcelColumns();
        APP.renderIncidentColumnPicker();
        APP.renderTable();
    });
    APP.g("btnClearColumns")?.addEventListener("click", () => {
        APP.selectedIncidentColumns = [];
        document.querySelectorAll(".incident-column-check").forEach((input) => {
            input.checked = false;
        });
        APP.renderTable();
    });
    APP.g("analyticsTopN")?.addEventListener("change", (e) => {
        APP.analyticsTopN = e.target.value ? Number(e.target.value) : null;
        APP.render();
    });
    APP.g("toggleChartLabels")?.addEventListener("change", (event) => {
        APP.showChartLabels = event.target.checked;
        APP.draw?.();
    });
    APP.g("toggleGlobalAvg")?.addEventListener("change", (event) => {
        APP.applyGlobalOverlayToggle?.("avg", event.target.checked);
    });
    APP.g("toggleGlobalTrend")?.addEventListener("change", (event) => {
        APP.applyGlobalOverlayToggle?.("trend", event.target.checked);
    });
    APP.g("rejectionsTopN")?.addEventListener("change", (e) => {
        APP.rejectionsTopN = e.target.value ? Number(e.target.value) : null;
        APP.render();
    });
    APP.g("btnRejFiltersResetAll")?.addEventListener("click", () => {
        APP.resetRejectionFilters?.();
    });
    APP.g("btnSavePivotToConfig")?.addEventListener("click", () => {
        void APP.savePivotBuilderToDashboardConfig();
    });
    APP.g("rejectionPageSize")?.addEventListener("change", (event) => {
        APP.rejectionTableState.pageSize =
            Number(event.target.value) || 100;
        APP.rejectionTableState.page = 1;
        APP.renderRejectionTable();
    });
    APP.g("btnRejectionPrevPage")?.addEventListener("click", () => {
        APP.rejectionTableState.page =
            Math.max(1, (APP.rejectionTableState.page || 1) - 1);
        APP.renderRejectionTable();
    });
    APP.g("btnRejectionNextPage")?.addEventListener("click", () => {
        APP.rejectionTableState.page =
            (APP.rejectionTableState.page || 1) + 1;
        APP.renderRejectionTable();
    });
    APP.g("btnDefaultRejectionColumns")?.addEventListener("click", () => {
        const excelColumns =
            APP.getRejectionExcelColumns();
        APP.selectedRejectionColumns =
            APP.defaultRejectionColumns.filter((column) =>
                excelColumns.includes(column)
            );
        APP.rejectionTableState.page = 1;
        APP.renderRejectionColumnPicker();
        APP.renderRejectionTable();
    });
    APP.g("btnAllRejectionColumns")?.addEventListener("click", () => {
        APP.selectedRejectionColumns =
            APP.getRejectionExcelColumns();
        APP.rejectionTableState.page = 1;
        APP.renderRejectionColumnPicker();
        APP.renderRejectionTable();
    });
    APP.g("btnClearRejectionColumns")?.addEventListener("click", () => {
        APP.selectedRejectionColumns = [];
        APP.rejectionTableState.page = 1;
        APP.renderRejectionColumnPicker();
        APP.renderRejectionTable();
    });
};

APP.initLegacyDashboard = () => {
    APP.bindUpload?.();
    APP.bindLegacyControls();
    APP.bindSidebar();
    APP.bindAnalyticsMode();
    APP.initTheme?.();
    APP.bindSettingsModal();
    APP.bindExportModal();
    APP.setPivotSaveStatus("Unique pivot charts only.");
    void APP.renderPivotSavedWidgetsList();
    const initialView =
        String(window.location.hash || "").replace(/^#/, "").trim();
    if (initialView) {
        APP.view(initialView);
    }
    if (APP.g("toggleChartLabels")) {
        APP.g("toggleChartLabels").checked = APP.showChartLabels;
    }
    if (APP.g("toggleGlobalAvg")) {
        APP.g("toggleGlobalAvg").checked = Boolean(APP.globalChartOverlays?.avg);
    }
    if (APP.g("toggleGlobalTrend")) {
        APP.g("toggleGlobalTrend").checked = Boolean(APP.globalChartOverlays?.trend);
    }
    APP.updateFilterStats?.(APP.DATA.length || 0, APP.filteredRejections?.length || 0);
    APP.setSidebarFilterContext?.(initialView || "overview");
    void APP.loadLocal();
};

APP.initLegacyDashboard();
