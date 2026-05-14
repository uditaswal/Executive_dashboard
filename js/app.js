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
    APP.renderSecondaryBreakdowns();
    APP.renderOverviewTabs();
    APP.renderSuggestions();
    APP.renderAnalyticsTables();
    APP.renderPivotBuilder();
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
    APP.activeOverviewTab || "insights";

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
        insights: APP.renderOverviewInsights,
        metrics: APP.renderOverviewMetricTable,
        platform: APP.renderOverviewPlatformTable,
        vendor: APP.renderOverviewVendorTable
    };

    content.innerHTML =
        (renderers[active] || renderers.insights)();
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
            <tr class="${index % 2 === 0 ? "metric-blue-row" : ""}">
                <td>${APP.escape(row[0])}</td>
                <td>${APP.escape(row[1])}</td>
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
    APP.getExcelColumns().filter(Boolean);

APP.getPivotState = () => {
    const columns =
        APP.getPivotColumns();
    const numericFallback =
        columns.find(column =>
            APP.DATA.some(
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
            row: columns.includes("Partner") ? "Partner" : (columns[0] || ""),
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
        APP.DATA;
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
};

APP.renderPivotBuilder = () => {
    const panel =
        APP.g("pivotBuilder");
    const tableBox =
        APP.g("pivotTableWrap");

    if (!panel || !tableBox) return;

    const columns =
        APP.getPivotColumns();
    const state =
        APP.getPivotState();

    panel.innerHTML =
        columns.length
            ? `
<label class="pivot-field">
    <span>Rows</span>
    <select id="pivotRow">${APP.pivotOptions(columns, state.row)}</select>
</label>
<label class="pivot-field">
    <span>Columns</span>
    <select id="pivotColumn">${APP.pivotOptions(columns, state.column, true)}</select>
</label>
<label class="pivot-field">
    <span>Values</span>
    <select id="pivotValue">${APP.pivotOptions(columns, state.value, true)}</select>
</label>
<label class="pivot-field">
    <span>Aggregation</span>
    <select id="pivotAgg">
        <option value="count" ${state.agg === "count" ? "selected" : ""}>Count</option>
        <option value="sum" ${state.agg === "sum" ? "selected" : ""}>Sum</option>
    </select>
</label>
<label class="pivot-field">
    <span>Chart Type</span>
    <select id="pivotChartType">
        <option value="bar" ${state.chartType === "bar" ? "selected" : ""}>Bar</option>
        <option value="line" ${state.chartType === "line" ? "selected" : ""}>Line</option>
        <option value="doughnut" ${state.chartType === "doughnut" ? "selected" : ""}>Doughnut</option>
        <option value="pie" ${state.chartType === "pie" ? "selected" : ""}>Pie</option>
    </select>
</label>
`
            : `<div class="empty-state">Load workbook data to build pivot-style charts and tables.</div>`;

    const syncPivot = () => {
        APP.PIVOT = {
            row:
                APP.g("pivotRow")?.value || "",
            column:
                APP.g("pivotColumn")?.value || "",
            value:
                APP.g("pivotValue")?.value || "",
            agg:
                APP.g("pivotAgg")?.value || "count",
            chartType:
                APP.g("pivotChartType")?.value || "bar"
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
            <thead>
                <tr>${pivot.headers.map(header => `<th>${APP.escape(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${pivot.rows.map(row => `<tr>${row.map(cell => `<td>${APP.escape(cell)}</td>`).join("")}</tr>`).join("")}
            </tbody>
        </table>
    </div>
</div>
`
                : `<div class="empty-state">No pivot output is available for the current setup.</div>`;

        APP.drawPivotChart();
    };

    [
        "pivotRow",
        "pivotColumn",
        "pivotValue",
        "pivotAgg",
        "pivotChartType"
    ].forEach((id) => {
        const el =
            APP.g(id);
        if (el) {
            el.onchange = syncPivot;
        }
    });

    syncPivot();
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

APP.tableToObjects = (table) =>
    table.rows.map((row) => {
        const out = {};

        table.headers.forEach((header, i) => {
            out[header] =
                row[i] ?? "";
        });

        return out;
    });

APP.sheetFromTable = (table) => {
    const ws =
        XLSX.utils.json_to_sheet(APP.tableToObjects(table));

    ws["!cols"] =
        table.headers.map((header) => ({
            wch:
                /RCA/i.test(header)
                    ? 48
                    : /Impact|Country/i.test(header)
                        ? 28
                        : 18
        }));

    Object.keys(ws)
        .filter(key => key[0] !== "!")
        .forEach((key) => {
            ws[key].s =
                ws[key].s || {};

            ws[key].s.alignment = {
                wrapText: true,
                vertical: "top"
            };
        });

    return ws;
};

APP.getIncidentRegisterTable = () => {
    const columns =
        APP.getIncidentColumns();

    return {
        id: "incident-register",
        title: "Incident Register",
        headers: columns,
        rows:
            APP.DATA.map(row =>
                columns.map(column => APP.rowValue(row, column) ?? "")
            )
    };
};

APP.getOverviewExportSections = () => [
    {
        type: "section",
        id: "overview-page",
        elementId: "overview",
        title: "Entire Overview Page"
    },
    {
        type: "section",
        id: "overview-summary",
        elementId: "overviewSummarySection",
        title: "Executive Summary"
    },
    {
        type: "section",
        id: "overview-kpis",
        elementId: "overviewKpiSection",
        title: "KPI Section"
    },
    {
        type: "section",
        id: "overview-priority",
        elementId: "overviewPrioritySection",
        title: "Priority Breakdown"
    },
    {
        type: "section",
        id: "overview-impact",
        elementId: "overviewImpactSection",
        title: "Resolution & Impact Breakdown"
    },
    {
        type: "section",
        id: "overview-builder",
        elementId: "overviewBuilderSection",
        title: "Executive View Builder"
    },
    {
        type: "section",
        id: "overview-suggestions",
        elementId: "overviewSuggestionsSection",
        title: "Suggestions"
    }
].filter(section => APP.g(section.elementId));

APP.getOverviewSectionTable = (section) => {
    const rows = [];

    if (section.id === "overview-page" || section.id === "overview-kpis") {
        document
            .querySelectorAll("#kpis .kpi")
            .forEach((card) => {
                rows.push([
                    "KPI",
                    card.querySelector("h4")?.textContent || "",
                    card.querySelector("strong")?.textContent || ""
                ]);
            });
    }

    if (section.id === "overview-page" || section.id === "overview-impact") {
        document
            .querySelectorAll("#resolutionBreakdown .mini-breakdown-row, #impactBreakdown .mini-breakdown-row")
            .forEach((row) => {
                rows.push([
                    "Breakdown",
                    row.querySelector("span")?.textContent || "",
                    row.querySelector("strong")?.textContent || ""
                ]);
            });
    }

    if (section.id === "overview-page" || section.id === "overview-priority") {
        document
            .querySelectorAll("#priorityBreakdown .priority-card")
            .forEach((card) => {
                rows.push([
                    "Priority",
                    card.querySelector(".priority-title")?.textContent || "",
                    card.querySelector(".priority-count")?.textContent || ""
                ]);
            });
    }

    if (!rows.length) {
        const el =
            APP.g(section.elementId);

        (el?.innerText || "")
            .split(/\n+/)
            .map(line => line.trim())
            .filter(Boolean)
            .forEach(line => {
                rows.push([
                    section.title,
                    "Content",
                    line
                ]);
            });
    }

    return {
        id: `${section.id}-data`,
        title: section.title,
        headers: ["Section", "Metric", "Value"],
        rows
    };
};

APP.getGlobalExportComponents = () => {
    const chartIds =
        (APP.exportOrder || [])
            .filter(id => APP.charts[id]);

    const charts =
        chartIds.map(id => ({
            type: "chart",
            id,
            title: APP.chartTitles?.[id] || id
        }));

    const graphTables =
        APP.getGraphTables
            ? APP.getGraphTables().map((table, index) => ({
                ...table,
                id: `graph-table-${index}`,
                type: "table"
            }))
            : [];

    const builderTables =
        APP.getOverviewTables().map(table => ({
            ...table,
            type: "table"
        }));

    const builderBundle =
        builderTables.length
            ? [
                {
                    type: "tableBundle",
                    id: "overview-builder-all-tables",
                    title: "All Executive View Builder Tables",
                    tables: builderTables
                }
            ]
            : [];

    const builderSections =
        APP.g("overviewBuilderSection")
            ? [
                {
                    type: "section",
                    id: "overview-builder",
                    elementId: "overviewBuilderSection",
                    title: "Current Executive View Builder Tab",
                    checked: false
                }
            ]
            : [];

    const incidentTable =
        APP.getIncidentRegisterTable();

    const tables = [
        ...graphTables,
        {
            ...incidentTable,
            type: "table"
        }
    ].filter(table => table.rows && table.rows.length);

    return {
        sections:
            APP.getOverviewExportSections()
                .filter(section => section.id !== "overview-builder"),
        builder: [
            ...builderBundle,
            ...builderSections,
            ...builderTables.map(table => ({
                ...table,
                checked: false
            }))
        ],
        charts,
        tables
    };
};

APP.openGlobalExportModal = () => {
    const modal =
        APP.g("exportModal");

    if (!modal) return;

    APP.renderGlobalExportList();
    modal.classList.remove("hide");
};

APP.closeGlobalExportModal = () => {
    const modal =
        APP.g("exportModal");

    if (modal) {
        modal.classList.add("hide");
    }
};

APP.renderGlobalExportList = () => {
    const box =
        APP.g("globalExportList");

    if (!box) return;

    const components =
        APP.getGlobalExportComponents();

    const group = (title, items) => `
<div class="global-export-group">
    <h4>${APP.escape(title)}</h4>
    <div class="global-export-items">
        ${items.map(item => `
        <label class="global-export-item">
            <input type="checkbox" class="global-export-check" value="${APP.escape(`${item.type}:${item.id}`)}" ${item.checked === false ? "" : "checked"}>
            <span>${APP.escape(item.title)}</span>
        </label>
        `).join("") || `<div class="empty-state">No ${APP.escape(title.toLowerCase())} available.</div>`}
    </div>
</div>
`;

    box.innerHTML =
        group("Overview Page & Sections", components.sections) +
        group("Executive View Builder", components.builder) +
        group("Charts", components.charts) +
        group("Tables", components.tables);
};

APP.getSelectedExportComponents = () => {
    const selected =
        new Set(
            [...document.querySelectorAll(".global-export-check:checked")]
                .map(input => input.value)
        );

    const components =
        APP.getGlobalExportComponents();

    return {
        sections:
            components.sections.filter(item =>
                selected.has(`section:${item.id}`)
            ),
        charts:
            components.charts.filter(item =>
                selected.has(`chart:${item.id}`)
            ),
        tableBundles:
            components.builder.filter(item =>
                item.type === "tableBundle" &&
                selected.has(`tableBundle:${item.id}`)
            ),
        builderSections:
            components.builder.filter(item =>
                item.type === "section" &&
                selected.has(`section:${item.id}`)
            ),
        builderTables:
            components.builder.filter(item =>
                item.type === "table" &&
                selected.has(`table:${item.id}`)
            ),
        tables:
            components.tables.filter(item =>
                selected.has(`table:${item.id}`)
            )
    };
};

APP.getSelectedExportSections = (selected) => [
    ...selected.sections,
    ...selected.builderSections
];

APP.getSelectedExportTables = (selected) => {
    const map =
        new Map();

    [
        ...selected.builderTables,
        ...selected.tableBundles.flatMap(bundle => bundle.tables || []),
        ...selected.tables
    ].forEach((table) => {
        if (table.rows && table.rows.length) {
            map.set(table.id || table.title, table);
        }
    });

    return [...map.values()];
};

APP.safeSheetName = (name, fallback) =>
    String(name || fallback)
        .replace(/[\\/?*[\]:]/g, "")
        .slice(0, 31) ||
    fallback;

APP.appendSheet = (wb, ws, name, fallback) => {
    const base =
        APP.safeSheetName(name, fallback);

    let sheetName =
        base;

    let suffix =
        2;

    while (wb.SheetNames.includes(sheetName)) {
        const tail =
            ` ${suffix}`;

        sheetName =
            base.slice(0, 31 - tail.length) + tail;

        suffix += 1;
    }

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        sheetName
    );
};

APP.exportGlobalExcel = () => {
    const selected =
        APP.getSelectedExportComponents();

    const sections =
        APP.getSelectedExportSections(selected);

    const tables =
        APP.getSelectedExportTables(selected);

    if (!sections.length && !selected.charts.length && !tables.length) {
        alert("Select at least one overview section, chart, or table to export.");
        return;
    }

    const wb =
        XLSX.utils.book_new();

    selected.charts.forEach((chart, index) => {
        APP.appendSheet(
            wb,
            XLSX.utils.json_to_sheet(APP.chartDataRows(chart.id)),
            chart.title,
            `Chart ${index + 1}`
        );
    });

    sections.forEach((section, index) => {
        const table =
            APP.getOverviewSectionTable(section);

        if (!table.rows.length && section.id !== "overview-page") return;

        APP.appendSheet(
            wb,
            APP.sheetFromTable(table),
            table.title,
            `Overview ${index + 1}`
        );
    });

    tables.forEach((table, index) => {
        APP.appendSheet(
            wb,
            APP.sheetFromTable(table),
            table.title,
            `Table ${index + 1}`
        );
    });

    XLSX.writeFile(
        wb,
        `dashboard-export-${APP.slug(APP.getReviewPeriod())}.xlsx`
    );
};

APP.tableHtml = (table) => `
<table xmlns="http://www.w3.org/1999/xhtml" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;background:#ffffff;">
    <thead>
        <tr>
            ${table.headers.map(header => `<th style="background:#0f2d52;color:#ffffff;border:1px solid #d1d5db;padding:8px;text-align:left;">${APP.escape(header)}</th>`).join("")}
        </tr>
    </thead>
    <tbody>
        ${table.rows.map((row, rowIndex) => `
        <tr style="background:${rowIndex % 2 ? "#eaf6ff" : "#ffffff"};">
            ${row.map(cell => `<td style="border:1px solid #d1d5db;padding:8px;vertical-align:top;white-space:normal;overflow-wrap:anywhere;">${APP.escape(cell).replace(/\n/g, "<br>")}</td>`).join("")}
        </tr>
        `).join("")}
    </tbody>
</table>
`;

APP.tableSvgImage = (table) => {
    const width =
        Math.max(900, table.headers.length * 170);

    const height =
        Math.max(180, Math.min(1200, (table.rows.length + 2) * 42));

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;background:#ffffff;padding:12px;">
            <h3 style="margin:0 0 10px;font-family:Arial,sans-serif;color:#0f172a;">${APP.escape(table.title)}</h3>
            ${APP.tableHtml(table)}
        </div>
    </foreignObject>
</svg>`;

    return "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(svg);
};

APP.tablePngImage = (table) =>
    new Promise((resolve) => {
        const img =
            new Image();

        img.onload = () => {
            const canvas =
                document.createElement("canvas");

            canvas.width =
                img.width;

            canvas.height =
                img.height;

            const ctx =
                canvas.getContext("2d");

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = () =>
            resolve(APP.tableSvgImage(table));

        img.src =
            APP.tableSvgImage(table);
    });

APP.sectionFallbackImage = (section) => {
    const el =
        APP.g(section.elementId);

    const width =
        Math.max(900, Math.min(1400, el?.scrollWidth || 1000));

    const height =
        Math.max(320, Math.min(1800, el?.scrollHeight || 700));

    const html =
        APP.escape(el?.innerText || section.title)
            .replace(/\n/g, "<br>");

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;width:${width}px;min-height:${height}px;background:#f4f7fb;padding:18px;font-family:Arial,sans-serif;color:#111827;">
            <h2 style="margin:0 0 12px;color:#0f172a;">${APP.escape(section.title)}</h2>
            <div style="line-height:1.55;font-size:13px;background:#ffffff;border:1px solid #e8edf4;border-radius:8px;padding:16px;">${html}</div>
        </div>
    </foreignObject>
</svg>`;

    return "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(svg);
};

APP.captureElementImage = async (section) => {
    const el =
        APP.g(section.elementId);

    if (!el) return "";

    const hiddenViews =
        [...document.querySelectorAll(".view.hide")];

    hiddenViews.forEach(view => view.classList.remove("hide"));

    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
        if (window.html2canvas) {
            const canvas =
                await html2canvas(el, {
                    backgroundColor: "#f4f7fb",
                    scale: 2,
                    useCORS: true
                });

            return canvas.toDataURL("image/png");
        }
    } catch (err) {
        console.warn("Overview capture failed, using fallback image.", err);
    } finally {
        hiddenViews.forEach(view => view.classList.add("hide"));
    }

    return APP.sectionFallbackImage(section);
};

APP.exportGlobalPng = async () => {
    const selected =
        APP.getSelectedExportComponents();

    const sections =
        APP.getSelectedExportSections(selected);

    const tables =
        APP.getSelectedExportTables(selected);

    if (!sections.length && !selected.charts.length && !tables.length) {
        alert("Select at least one overview section, chart, or table to export.");
        return;
    }

    const sectionImages =
        await Promise.all(
            sections.map(section =>
                APP.captureElementImage(section)
                    .then(data => ({
                        section,
                        data
                    }))
            )
        );

    sectionImages.forEach(({ section, data }) => {
        APP.download(
            data,
            `${APP.slug(section.title)}.png`
        );
    });

    selected.charts.forEach((chart) => {
        APP.download(
            APP.chartImage(chart.id, "image/png"),
            `${APP.slug(chart.title)}.png`
        );
    });

    const tableImages =
        await Promise.all(
            tables.map(table =>
                APP.tablePngImage(table)
                    .then(data => ({
                        table,
                        data
                    }))
            )
        );

    tableImages.forEach(({ table, data }) => {
        APP.download(
            data,
            `${APP.slug(table.title)}.png`
        );
    });
};

APP.addTableToSlide = (slide, table) => {
    const rows = [
        table.headers,
        ...table.rows.slice(0, 18)
    ];

    if (slide.addTable) {
        slide.addTable(rows, {
            x: 0.45,
            y: 0.85,
            w: 12.4,
            h: 6.25,
            border: {
                color: "D1D5DB",
                pt: 1
            },
            fontSize: 8,
            color: "111827",
            fill: "FFFFFF",
            margin: 0.04
        });
    } else {
        slide.addText(
            rows.map(row => row.join(" | ")).join("\n"),
            {
                x: 0.55,
                y: 0.9,
                w: 12,
                h: 6,
                fontSize: 8,
                color: "111827",
                breakLine: false
            }
        );
    }
};

APP.exportGlobalPpt = async () => {
    const selected =
        APP.getSelectedExportComponents();

    const sections =
        APP.getSelectedExportSections(selected);

    const tables =
        APP.getSelectedExportTables(selected);

    if (!sections.length && !selected.charts.length && !tables.length) {
        alert("Select at least one overview section, chart, or table to export.");
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
    pptx.subject = "Filtered dashboard export";
    pptx.title = "Payments Dashboard Export";

    const sectionImages =
        await Promise.all(
            sections.map(section =>
                APP.captureElementImage(section)
                    .then(data => ({
                        section,
                        data
                    }))
            )
        );

    sectionImages.forEach(({ section, data }) => {
        const slide =
            pptx.addSlide();

        slide.background = {
            color: "F8FAFC"
        };

        slide.addText(section.title, {
            x: 0.45,
            y: 0.25,
            w: 12.4,
            h: 0.35,
            fontSize: 18,
            bold: true,
            color: "0F172A"
        });

        slide.addImage({
            data,
            x: 0.35,
            y: 0.75,
            w: 12.65,
            h: 6.35,
            sizingCrop: true
        });
    });

    selected.charts.forEach((chart) => {
        const slide =
            pptx.addSlide();

        slide.background = {
            color: "F8FAFC"
        };

        slide.addText(chart.title, {
            x: 0.45,
            y: 0.25,
            w: 12.4,
            h: 0.35,
            fontSize: 18,
            bold: true,
            color: "0F172A"
        });

        slide.addImage({
            data: APP.chartImage(chart.id, "image/png"),
            x: 0.65,
            y: 0.8,
            w: 12,
            h: 6.25
        });
    });

    tables.forEach((table) => {
        const slide =
            pptx.addSlide();

        slide.background = {
            color: "F8FAFC"
        };

        slide.addText(table.title, {
            x: 0.45,
            y: 0.25,
            w: 12.4,
            h: 0.35,
            fontSize: 18,
            bold: true,
            color: "0F172A"
        });

        APP.addTableToSlide(slide, table);
    });

    await pptx.writeFile({
        fileName: `dashboard-export-${APP.slug(APP.getReviewPeriod())}.pptx`
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

APP.getReviewPeriod = () => {
    const monthOrder = APP.monthOrder || [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const selectedMonths =
        APP.filterValues
            ? APP.filterValues("fMonth")
            : [];

    if (selectedMonths.length === 1) return selectedMonths[0];
    if (selectedMonths.length > 1) return selectedMonths.join(", ");

    const months =
        APP.u(
            APP.DATA.map(
                r =>
                    APP.rowValue(
                        r,
                        "Month"
                    )
            )
        );

    const sorted =
        monthOrder.filter(
            month => months.includes(month)
        );

    if (!sorted.length) return "Current";
    if (sorted.length === 1) return sorted[0];

    const indexes =
        sorted.map(month => monthOrder.indexOf(month));

    const isContiguous =
        indexes.every(
            (index, i) =>
                i === 0 ||
                index === indexes[i - 1] + 1
        );

    const quarterMap = {
        "Jan,Feb,Mar": "Q1",
        "Apr,May,Jun": "Q2",
        "Jul,Aug,Sep": "Q3",
        "Oct,Nov,Dec": "Q4"
    };

    const quarter =
        quarterMap[sorted.join(",")];

    if (quarter) return quarter;

    if (!isContiguous) {
        return sorted.join(", ");
    }

    return `${sorted[0]}-${sorted[sorted.length - 1]}`;
};

APP.renderSummary = () => {
    const total = APP.DATA.length;

    const vendor =
        APP.DATA.filter(
            x =>
                APP.isPartnerSideCategory(x) &&
                APP.isVendorIssue(x)
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
                String(
                    APP.rowValue(
                        x,
                        "PRIORITY"
                    )
                ) === "1"
        ).length;

    const open =
        APP.DATA.filter(
            x =>
                APP.rowValue(
                    x,
                    "Status"
                ) === "Open"
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
 <li> APN transaction volumes are on a steady upward trajectory, averaging 7 million transactions per month in 2026 with 75% real time.</li>
<li>Processing mix is balanced, with 55% of volume from retail channels and 45% from digital channels.</li>
<li>Overall rejection rate is stable at ~1.38% of total volume, with most rejections originating from processors and beneficiary banks.</li>
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
                    APP.n(
                        APP.rowValue(
                            a,
                            "priority"
                        )
                    ) -
                    APP.n(
                        APP.rowValue(
                            b,
                            "priority"
                        )
                    )
            )
            .map(
                row =>
                    APP.rowValue(
                        row,
                        "suggestion"
                    )
                        ? `<li>${APP.rowValue(row, "suggestion")}</li>`
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

if (APP.g("btnGlobalExport")) {
    APP.g("btnGlobalExport").onclick =
        APP.openGlobalExportModal;
}

if (APP.g("btnCloseExportModal")) {
    APP.g("btnCloseExportModal").onclick =
        APP.closeGlobalExportModal;
}

if (APP.g("exportModal")) {
    APP.g("exportModal").onclick = (event) => {
        if (event.target === APP.g("exportModal")) {
            APP.closeGlobalExportModal();
        }
    };
}

if (APP.g("btnExportSelectAll")) {
    APP.g("btnExportSelectAll").onclick = () => {
        document
            .querySelectorAll(".global-export-check")
            .forEach(
                input => input.checked = true
            );
    };
}

if (APP.g("btnExportClearAll")) {
    APP.g("btnExportClearAll").onclick = () => {
        document
            .querySelectorAll(".global-export-check")
            .forEach(
                input => input.checked = false
            );
    };
}

if (APP.g("btnExportPngGlobal")) {
    APP.g("btnExportPngGlobal").onclick =
        APP.exportGlobalPng;
}

if (APP.g("btnExportPptGlobal")) {
    APP.g("btnExportPptGlobal").onclick =
        APP.exportGlobalPpt;
}

if (APP.g("btnExportExcelGlobal")) {
    APP.g("btnExportExcelGlobal").onclick =
        APP.exportGlobalExcel;
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
            APP.defaultIncidentColumns
                .map(column =>
                    APP.findColumnName(
                        APP.RAW,
                        column
                    )
                )
                .filter(column => excelColumns.includes(column));

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

APP.selectedRejectionColumns = null;
APP.defaultRejectionColumns = [
    "MONTH",
    "PARTNERNAME",
    "RECEIVECOUNTRYCODE",
    "DELIVERYSERVICE",
    "CHANNEL",
    "SUBSTATE",
    "PARTNER_REJECTREASON",
    "APN_REJECTREASON",
    "DESCRIPTION",
    "PURPOSE"
];

APP.getRejectionExcelColumns = () =>
    APP.REJECTIONS.length
        ? Object.keys(APP.REJECTIONS[0])
        : [];

APP.getRejectionColumns = () => {
    const excelColumns =
        APP.getRejectionExcelColumns();

    if (APP.selectedRejectionColumns === null) {
        APP.selectedRejectionColumns =
            APP.defaultRejectionColumns
                .map((column) =>
                    APP.findColumnName(
                        APP.REJECTIONS,
                        column
                    )
                )
                .filter(Boolean);
    }

    return APP.selectedRejectionColumns.filter((column) =>
        excelColumns.includes(column)
    );
};

APP.isRejectedRow = (row) =>
    APP.rowValue(row, "SUBSTATE") === "Rejected" ||
    !!APP.rowValue(row, "PARTNER_REJECTREASON");

APP.renderRejectionKPIs = () => {
    const box =
        APP.g("rejectionKpis");

    if (!box) return;

    const total =
        APP.filteredRejections.length;
    const rejected =
        APP.filteredRejections.filter(
            APP.isRejectedRow
        ).length;
    const uniquePartners =
        APP.u(
            APP.filteredRejections.map((row) =>
                APP.rowValue(
                    row,
                    "PARTNERNAME"
                )
            )
        ).length;

    box.innerHTML = `
        <div class="kpi"><h4>Total Records</h4><strong>${APP.formatNum(total)}</strong></div>
        <div class="kpi"><h4>Total Rejected</h4><strong>${APP.formatNum(rejected)}</strong></div>
        <div class="kpi"><h4>Rejection Rate %</h4><strong>${APP.percent(rejected, total, 1)}</strong></div>
        <div class="kpi"><h4>Unique Partners</h4><strong>${APP.formatNum(uniquePartners)}</strong></div>
    `;
};

APP.renderRejectionColumnPicker = () => {
    const box =
        APP.g("rejectionColumnList");

    if (!box) return;

    const columns =
        APP.getRejectionExcelColumns();
    const selected =
        new Set(
            APP.getRejectionColumns()
        );

    box.innerHTML =
        columns.map((column) => `
<label class="column-item">
    <input type="checkbox" class="rejection-column-check" value="${APP.escape(column)}" ${selected.has(column) ? "checked" : ""}>
    <span>${APP.escape(column)}</span>
</label>
`).join("") ||
        `<div class="empty-state">Load an Excel workbook to choose rejection columns.</div>`;

    document
        .querySelectorAll(".rejection-column-check")
        .forEach((input) => {
            input.onchange = () => {
                APP.selectedRejectionColumns =
                    [...document.querySelectorAll(".rejection-column-check:checked")]
                        .map((item) => item.value);
                APP.renderRejectionTable();
            };
        });
};

APP.renderRejectionTable = () => {
    const columns =
        APP.getRejectionColumns();
    const rows =
        APP.filteredRejections.slice(0, 500);
    const rejected =
        APP.filteredRejections.filter(
            APP.isRejectedRow
        ).length;
    const partners =
        APP.u(
            APP.filteredRejections.map((row) =>
                APP.rowValue(
                    row,
                    "PARTNERNAME"
                )
            )
        ).length;

    if (APP.g("rejectionShown")) {
        APP.g("rejectionShown").textContent =
            `${APP.filteredRejections.length} shown`;
    }

    if (APP.g("rejectionRejected")) {
        APP.g("rejectionRejected").textContent =
            `${rejected} rejected`;
    }

    if (APP.g("rejectionPartners")) {
        APP.g("rejectionPartners").textContent =
            `${partners} partners`;
    }

    if (APP.g("rejectionHead")) {
        APP.g("rejectionHead").innerHTML = `
<tr>${columns.map((column) => `<th>${APP.escape(column)}</th>`).join("")}</tr>
`;
    }

    if (APP.g("rejectionBody")) {
        APP.g("rejectionBody").innerHTML =
            rows.map((row) => `
<tr>${columns.map((column) => `<td>${APP.escape(APP.rowValue(row, column) ?? "")}</td>`).join("")}</tr>
`).join("") ||
            `<tr><td colspan="${Math.max(columns.length, 1)}">No rejection rows match the current filters.</td></tr>`;
    }
};

APP.tableFromChart = (id) => {
    const rows =
        APP.chartDataRows(id);
    const title =
        APP.chartTitles?.[id] || id;
    const headers =
        rows.length
            ? Object.keys(rows[0])
            : ["Label", "Value"];

    return {
        id: `chart-table-${id}`,
        title,
        headers,
        rows:
            rows.map((row) =>
                headers.map((header) => row[header] ?? "")
            )
    };
};

APP.getGraphTables = () =>
    [
        "c1", "c2", "c3", "c4", "c5", "c6", "c7",
        "c10", "c12", "c13", "c14", "c15", "c16",
        "c17", "c18", "c19", "c20", "c21", "c22",
        "c23", "c24", "c11"
    ].filter((id) => APP.charts[id])
        .map(APP.tableFromChart);

APP.getRejectionGraphTables = () =>
    [
        "rc1", "rc2", "rc3", "rc4", "rc5", "rc6", "rc7",
        "rc8", "rc9", "rc10", "rc11", "rc12", "rc13", "rc14"
    ].filter((id) => APP.charts[id])
        .map(APP.tableFromChart);

APP.renderTableCards = (
    containerId,
    tables,
    topN
) => {
    const container =
        APP.g(containerId);

    if (!container) return;

    container.innerHTML =
        tables.map((table) => `
<article class="data-table-card">
    <div class="data-table-head">
        <h4>${APP.escape(table.title)}</h4>
        <span class="${topN ? "topn-hint" : ""}">${topN ? `Top ${topN}` : `${table.rows.length} rows`}</span>
    </div>
    <div class="data-table-scroll">
        <table class="data-table">
            <thead>
                <tr>${table.headers.map((header) => `<th>${APP.escape(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${APP.escape(cell)}</td>`).join("")}</tr>`).join("")}
            </tbody>
        </table>
    </div>
</article>
`).join("") ||
        `<div class="empty-state">No graph table data available for the current filter selection.</div>`;
};

APP.renderAnalyticsTables = () =>
    APP.renderTableCards(
        "analyticsTables",
        APP.getGraphTables(),
        APP.analyticsTopN
    );

APP.renderRejectionTables = () =>
    APP.renderTableCards(
        "rejectionTables",
        APP.getRejectionGraphTables(),
        APP.rejectionsTopN
    );

APP.getPivotRows = () =>
    APP.pivotDataset === "rejections"
        ? APP.filteredRejections
        : APP.DATA;

APP.getPivotColumns = () => {
    const rows =
        APP.getPivotRows();
    return rows.length
        ? Object.keys(rows[0]).filter(Boolean)
        : [];
};

APP.getPivotState = () => {
    const columns =
        APP.getPivotColumns();
    const rows =
        APP.getPivotRows();
    const numericFallback =
        columns.find((column) =>
            rows.some((row) =>
                APP.n(
                    APP.rowValue(
                        row,
                        column
                    )
                ) > 0
            )
        ) || "";
    const preferredRow =
        APP.pivotDataset === "rejections"
            ? (columns.includes("PARTNERNAME") ? "PARTNERNAME" : (columns[0] || ""))
            : (columns.includes("Partner") ? "Partner" : (columns[0] || ""));

    if (!APP.PIVOT || APP.PIVOT.dataset !== APP.pivotDataset) {
        APP.PIVOT = {
            dataset: APP.pivotDataset,
            row: preferredRow,
            column: "",
            value: numericFallback,
            agg: "count",
            chartType: "bar"
        };
    }

    if (APP.PIVOT.row && !columns.includes(APP.PIVOT.row)) {
        APP.PIVOT.row = preferredRow;
    }

    if (APP.PIVOT.column && !columns.includes(APP.PIVOT.column)) {
        APP.PIVOT.column = "";
    }

    if (APP.PIVOT.value && !columns.includes(APP.PIVOT.value)) {
        APP.PIVOT.value = numericFallback;
    }

    APP.PIVOT.dataset =
        APP.pivotDataset;

    return APP.PIVOT;
};

APP.getPivotResult = () => {
    const state =
        APP.getPivotState();
    const rows =
        APP.getPivotRows();
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
                ? APP.rowValue(row, columnKey) || "Unknown"
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
            (matrix[rowLabel][columnLabel] || 0) + measure;
        columnLabels.add(columnLabel);
    });

    const orderedColumns =
        [...columnLabels];
    const bodyRows =
        Object.entries(matrix)
            .map(([label, values]) => {
                const cells =
                    orderedColumns.map((key) =>
                        APP.n(values[key])
                    );
                return [
                    label,
                    ...cells,
                    cells.reduce((sum, value) => sum + value, 0)
                ];
            })
            .sort((a, b) => APP.n(b[b.length - 1]) - APP.n(a[a.length - 1]))
            .slice(0, 20);

    return {
        title: `${APP.pivotDataset === "rejections" ? "Rejections" : "Incidents"} Pivot: ${useCount ? "Count" : "Sum"} of ${valueKey || "Rows"} by ${rowKey}${columnKey ? ` and ${columnKey}` : ""}`,
        headers: [rowKey, ...orderedColumns, "Total"],
        rows:
            bodyRows.map((row) => [
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
`
            : `<div class="empty-state">Load workbook data to build pivot-style charts and tables.</div>`;

    const syncPivot = () => {
        APP.PIVOT = {
            dataset: APP.pivotDataset,
            row: APP.g("pivotRow")?.value || "",
            column: APP.g("pivotColumn")?.value || "",
            value: APP.g("pivotValue")?.value || "",
            agg: APP.g("pivotAgg")?.value || "count",
            chartType: APP.g("pivotChartType")?.value || "bar"
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

    ["pivotRow", "pivotColumn", "pivotValue", "pivotAgg", "pivotChartType"].forEach((id) => {
        const el =
            APP.g(id);
        if (el) {
            el.onchange = syncPivot;
        }
    });

    syncPivot();
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
            title: APP.chartTitles?.[id] || id
        }));
    const builderTables =
        APP.getOverviewTables().map((table) => ({
            ...table,
            type: "table"
        }));
    const graphTables = [
        ...APP.getGraphTables().map((table, index) => ({
            ...table,
            id: `graph-table-${index}`,
            type: "table"
        })),
        ...APP.getRejectionGraphTables().map((table, index) => ({
            ...table,
            id: `rejection-graph-table-${index}`,
            type: "table"
        }))
    ];
    const builderBundle =
        builderTables.length
            ? [{
                type: "tableBundle",
                id: "overview-builder-all-tables",
                title: "All Executive View Builder Tables",
                tables: builderTables
            }]
            : [];
    const builderSections =
        APP.g("overviewBuilderSection")
            ? [{
                type: "section",
                id: "overview-builder",
                elementId: "overviewBuilderSection",
                title: "Current Executive View Builder Tab",
                checked: false
            }]
            : [];
    const tables = [
        ...graphTables,
        {
            ...APP.getIncidentRegisterTable(),
            type: "table"
        },
        {
            ...APP.getRejectionRegisterTable(),
            type: "table"
        }
    ].filter((table) => table.rows && table.rows.length);

    return {
        sections:
            APP.getOverviewExportSections()
                .filter((section) => section.id !== "overview-builder"),
        builder: [
            ...builderBundle,
            ...builderSections,
            ...builderTables.map((table) => ({
                ...table,
                checked: false
            }))
        ],
        charts,
        tables
    };
};

APP.render = () => {
    APP.g("count").textContent =
        `${APP.DATA.length} records`;

    if (APP.g("filterRecordHint")) {
        APP.g("filterRecordHint").textContent =
            `${APP.DATA.length} incidents | ${APP.filteredRejections.length} rejections`;
    }

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

["fRejPartner", "fRejCountry", "fRejDelivery"].forEach((id) => {
    const el =
        APP.g(id);
    if (el) {
        el.onchange =
            APP.apply;
    }
});

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

if (APP.g("btnDefaultRejectionColumns")) {
    APP.g("btnDefaultRejectionColumns").onclick = () => {
        const excelColumns =
            APP.getRejectionExcelColumns();
        APP.selectedRejectionColumns =
            APP.defaultRejectionColumns
                .map((column) =>
                    APP.findColumnName(
                        APP.REJECTIONS,
                        column
                    )
                )
                .filter((column) => excelColumns.includes(column));
        APP.renderRejectionColumnPicker();
        APP.renderRejectionTable();
    };
}

if (APP.g("btnAllRejectionColumns")) {
    APP.g("btnAllRejectionColumns").onclick = () => {
        APP.selectedRejectionColumns =
            APP.getRejectionExcelColumns();
        APP.renderRejectionColumnPicker();
        APP.renderRejectionTable();
    };
}

if (APP.g("btnClearRejectionColumns")) {
    APP.g("btnClearRejectionColumns").onclick = () => {
        APP.selectedRejectionColumns = [];
        document
            .querySelectorAll(".rejection-column-check")
            .forEach((input) => input.checked = false);
        APP.renderRejectionTable();
    };
}

APP.loadLocal();
