/**
 * Chart Configuration & Plugins — Sets up Chart.js instances with custom data labels, responsive sizing, and styling.
 * Registers plugin hooks for post-render label drawing and exports utility functions for chart creation and manipulation.
 * Handles visual theming, color schemes, and chart-to-image export for PPT generation workflows.
 */

// Custom Chart.js plugin for drawing data labels
Chart.register({
    id: 'customDataLabels',
    afterDatasetsDraw(chart) {
        if (!APP.showChartLabels) return;

        const { ctx, data, chartArea } = chart;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            
            if (meta.hidden) return;

            meta.data.forEach((element, index) => {
                const value = dataset.data[index];
                if (value === null || value === undefined) return;

                let x, y;
                
                if (element.x !== undefined && element.y !== undefined) {
                    x = element.x;
                    y = element.y;
                } else {
                    return;
                }

                // Draw background
                ctx.fillStyle = 'rgba(15, 45, 82, 0.8)';
                const textWidth = ctx.measureText(value).width + 8;
                ctx.fillRect(x - textWidth/2, y - 10, textWidth, 20);

                // Draw text
                ctx.fillStyle = '#fff';
                ctx.fillText(value, x, y);
            });
        });
    }
});

APP.cb = (key, rows = APP.DATA) => {
    const map = {};

    rows.forEach((row) => {
        const value =
            APP.value(row, key) || "Unknown";

        map[value] =
            (map[value] || 0) + 1;
    });

    return map;
};

APP.value = (row, keys) => {
    const list =
        Array.isArray(keys)
            ? keys
            : [keys];

    for (const key of list) {
        const value =
            APP.getValue(row, key);

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return "";
};

APP.sumBy = (
    groupKey,
    valueKey,
    rows = APP.DATA
) => {
    const map = {};

    rows.forEach((row) => {
        const key =
            APP.value(row, groupKey) || "Unknown";

        const val =
            APP.n(
                APP.value(row, valueKey)
            );

        map[key] =
            (map[key] || 0) + val;
    });

    return map;
};

APP.monthOrder = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

APP.sortedMonths = (rows = APP.DATA) =>
    APP.monthOrder.filter(
        month =>
            rows.some(
                row =>
                    APP.value(
                        row,
                        "Month"
                    ) === month
            )
    );

APP.issueOwner = (row) => {
    const value =
        APP.value(row, ["Issue(WU/Partner)", "Issue (WU issue/Partner side)"]) || "";

    if (/wu/i.test(value)) return "WU side";
    if (/vendor|partner/i.test(value)) return "Partner side";

    return value || "Unknown";
};

APP.topEntries = (map, limit = 8) =>
    Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

APP.destroy = () => {
    Object.values(APP.charts)
        .forEach(
            c => c.destroy()
        );

    APP.charts = {};
    APP.chartRegistry?.clear?.();
};

APP.colors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#ea580c",
    "#0f766e",
    "#be123c",
    "#4f46e5"
];

APP.exportOrder = [
    "c1", "c2", "c3", "c4", "c5", "c6", "c7",
    "c10", "c12", "c13", "c14", "c15", "c16",
    "c17", "c18", "c19", "c20", "c21", "c22",
    "c23", "c24", "c11"
];

APP.chartOptions = (title, overrides = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                boxWidth: 12,
                color: document.documentElement.classList.contains("dark") ? "#cbd5e1" : "#475569",
                font: {
                    size: 12,
                    weight: "600"
                }
            }
        },
        title: {
            display: true,
            text: title,
            align: "start",
            font: {
                size: 16,
                weight: "800"
            },
            color: document.documentElement.classList.contains("dark") ? "#e2e8f0" : "#0f172a",
            padding: {
                bottom: 14
            }
        },
        tooltip: {
            enabled: true,
            backgroundColor: document.documentElement.classList.contains("dark") ? "#020617" : "#0f172a",
            padding: 12
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: document.documentElement.classList.contains("dark") ? "#334155" : "#e5e7eb"
            },
            ticks: {
                color: document.documentElement.classList.contains("dark") ? "#94a3b8" : "#64748b"
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: document.documentElement.classList.contains("dark") ? "#94a3b8" : "#64748b"
            }
        }
    },
    ...overrides
});

APP.chart = (id, config) => {
    const el =
        APP.g(id);

    if (!el) return;

    APP.charts[id] =
        new Chart(el, config);

    APP.registerChartForOverlays?.(
        id,
        APP.charts[id]
    );

    APP.chartTitles =
        APP.chartTitles || {};

    APP.chartTitles[id] =
        config.options?.plugins?.title?.text || id;
};

APP.percent = (part, total, digits = 0) =>
    total
        ? ((part / total) * 100).toFixed(digits) + "%"
        : "0%";

APP.mapTable = (
    title,
    labelHeader,
    valueHeader,
    map,
    limit = null
) => {
    const entries =
        limit
            ? APP.topEntries(map, limit)
            : Object.entries(map);

    return {
        title,
        headers: [
            labelHeader,
            valueHeader,
            "% of Filtered"
        ],
        rows:
            entries.map(([label, value]) => [
                label,
                APP.n(value).toLocaleString(),
                APP.percent(value, APP.DATA.length)
            ])
    };
};

APP.getReceiveCountryImpactEntries = (limit = 10) =>
    Object.entries(
        APP.DATA.reduce((map, row) => {
            const country =
                APP.value(row, "Receive Country") || "Unknown";

            if (!map[country]) {
                map[country] = {
                    incidents: 0,
                    delayed: 0,
                    breached: 0
                };
            }

            map[country].incidents += 1;
            map[country].delayed +=
                APP.n(
                    APP.value(row, "Delayed Transaction")
                );
            map[country].breached +=
                APP.n(
                    APP.value(row, "Delivery Breached")
                );

            return map;
        }, {})
    )
        .sort((a, b) => b[1].delayed - a[1].delayed)
        .slice(0, limit);

APP.monthMetricRows = (
    title,
    metricMaps
) => {
    const months =
        APP.sortedMonths();

    return {
        title,
        headers: [
            "Month",
            ...metricMaps.map(metric => metric.label)
        ],
        rows:
            months.map(month => [
                month,
                ...metricMaps.map(
                    metric =>
                        APP.n(metric.map[month]).toLocaleString()
                )
            ])
    };
};

APP.stackedMonthRows = (
    title,
    groupLabels,
    countFor
) => {
    const months =
        APP.sortedMonths();

    return {
        title,
        headers: [
            "Group",
            ...months,
            "Total"
        ],
        rows:
            groupLabels.map((label) => {
                const values =
                    months.map(
                        month =>
                            countFor(label, month)
                    );

                return [
                    label,
                    ...values.map(value => value.toLocaleString()),
                    values.reduce((sum, value) => sum + value, 0).toLocaleString()
                ];
            })
    };
};

APP.getGraphTables = () => {
    const total =
        APP.DATA.length;

    const partnerSideRows =
        APP.DATA.filter(
            row =>
                APP.issueOwner(row) === "Partner side"
        );

    const partnerSideCategories =
        APP.topEntries(
            APP.cb(
                ["issue category", "Issue subcategory"],
                partnerSideRows
            ),
            6
        )
            .map(([category]) => category);

    const issueCategories =
        APP.topEntries(
            APP.cb(["issue category", "Issue subcategory"]),
            6
        )
            .map(([category]) => category);

    const wallets =
        APP.topEntries(
            APP.cb("Wallet Name/Specific Bank"),
            6
        )
            .map(([wallet]) => wallet);

    const insufficientRows =
        APP.DATA.filter(
            row =>
                (
                    row["Issue subcategory"] || ""
                )
                    .toLowerCase()
                    .includes("insufficient")
        );

    const insufficientPartners =
        APP.topEntries(
            APP.cb("Partner", insufficientRows),
            8
        )
            .map(([partner]) => partner);

    const ownerMap = {};
    APP.DATA.forEach((row) => {
        const owner =
            APP.issueOwner(row);

        ownerMap[owner] =
            (ownerMap[owner] || 0) + 1;
    });

    return [
        APP.monthMetricRows(
            "Monthly Incident Trend",
            [
                {
                    label: "Incidents",
                    map: APP.cb("Month")
                }
            ]
        ),
        APP.mapTable(
            "Incident Status Split",
            "Status",
            "Incidents",
            APP.cb("Status")
        ),
        APP.mapTable(
            "Priority Distribution",
            "Priority",
            "Incidents",
            APP.cb("PRIORITY")
        ),
        APP.mapTable(
            "Top Partner Incident Ranking",
            "Partner",
            "Incidents",
            APP.cb("Partner"),
            8
        ),
        APP.mapTable(
            "Top Receive Countries",
            "Country",
            "Incidents",
            APP.cb("Receive Country"),
            8
        ),
        {
            title: "Receive Country Impact",
            headers: [
                "Receive Country",
                "Incidents",
                "Delayed Transactions",
                "Breached Transactions"
            ],
            rows:
                APP.getReceiveCountryImpactEntries(10)
                    .map(([country, metrics]) => [
                        country,
                        APP.n(metrics.incidents).toLocaleString(),
                        APP.n(metrics.delayed).toLocaleString(),
                        APP.n(metrics.breached).toLocaleString()
                    ])
        },
        APP.monthMetricRows(
            "Delayed vs Breached Trend",
            [
                {
                    label: "Delayed Transactions",
                    map: APP.sumBy(
                        "Month",
                        "Delayed Transaction"
                    )
                },
                {
                    label: "Delivery Breached",
                    map: APP.sumBy(
                        "Month",
                        "Delivery Breached"
                    )
                }
            ]
        ),
        APP.mapTable(
            "Transaction Loss by Partner",
            "Partner",
            "Loss Impact",
            APP.sumBy(
                "Partner",
                "Transaction Loss(customer impact)"
            ),
            8
        ),
        {
            title: "APN Monthly Transaction Volume",
            headers: [
                "Month",
                "Transactions"
            ],
            rows:
                APP.VOLUME.map(row => [
                    APP.value(row, "CREATED_DATE") || "Unknown",
                    APP.n(
                        APP.value(
                            row,
                            "COUNT(*)"
                        )
                    ).toLocaleString()
                ])
        },
        APP.mapTable(
            "WU vs Partner Side Issues",
            "Owner",
            "Incidents",
            ownerMap
        ),
        APP.stackedMonthRows(
            "Partner Side Issue Category Trend",
            partnerSideCategories,
            (category, month) =>
                partnerSideRows.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        APP.value(row, ["issue category", "Issue subcategory"]) === category
                                ).length
        ),
        APP.stackedMonthRows(
            "Top Impacted Wallet Trend",
            wallets,
            (wallet, month) =>
                APP.DATA.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        (
                                            APP.value(row, "Wallet Name/Specific Bank") ||
                                            "Unknown"
                                        ) === wallet
                                ).length
        ),
        APP.mapTable(
            "Top Partners by Delayed MTCNs",
            "Partner",
            "Delayed MTCNs",
            APP.sumBy(
                "Partner",
                "Delayed Transaction"
            ),
            6
        ),
        APP.mapTable(
            "Top Wallets by Delayed MTCNs",
            "Wallet",
            "Delayed MTCNs",
            APP.sumBy(
                "Wallet Name/Specific Bank",
                "Delayed Transaction"
            ),
            6
        ),
        APP.mapTable(
            "Resolution Time Split",
            "Resolution Band",
            "Incidents",
            APP.cb("Time Taken for Resolution")
        ),
        APP.mapTable(
            "Impact Type Split",
            "Impact Type",
            "Incidents",
            APP.cb("Impact type")
        ),
        APP.stackedMonthRows(
            "Issue Category by Month",
            issueCategories,
            (category, month) =>
                APP.DATA.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        APP.value(row, ["issue category", "Issue subcategory"]) === category
                                ).length
        ),
        APP.mapTable(
            "Monitoring Gap / Detection Delay",
            "Monitoring Value",
            "Incidents",
            APP.cb("Monitoring Gap / delay In detection")
        ),
        APP.mapTable(
            "Rejected Transactions by Partner",
            "Partner",
            "Rejected Transactions",
            APP.sumBy(
                "Partner",
                "Transaction REJECTED"
            ),
            6
        ),
        APP.monthMetricRows(
            "Operational Impact by Month",
            [
                {
                    label: "Delayed",
                    map: APP.sumBy(
                        "Month",
                        "Delayed Transaction"
                    )
                },
                {
                    label: "Breached",
                    map: APP.sumBy(
                        "Month",
                        "Delivery Breached"
                    )
                },
                {
                    label: "Rejected",
                    map: APP.sumBy(
                        "Month",
                        "Transaction REJECTED"
                    )
                }
            ]
        ),
        APP.stackedMonthRows(
            "Insufficient Funds by Partner",
            insufficientPartners,
            (partner, month) =>
                insufficientRows.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        APP.value(row, "Partner") === partner
                                ).length
        )
    ].filter(
        table =>
            table.rows &&
            table.rows.length
    ).map((table) => ({
        ...table,
        total
    }));
};

function drawMonthlyTrend() {
    const months =
        APP.sortedMonths();

    const data =
        APP.cb("Month");

    APP.chart("c1", {
        type: "bar",
        data: {
            labels: months,
            datasets: [{
                label: "Incidents",
                data: months.map(month => data[month] || 0),
                backgroundColor: "#2563eb",
                borderRadius: 8
            }]
        },
        options:
            APP.chartOptions(
                "Monthly Incident Trend"
            )
    });
}

function drawStatusDonut() {
    const data =
        APP.cb("Status");

    APP.chart("c2", {
        type: "doughnut",
        data: {
            labels:
                Object.keys(data),
            datasets: [{
                data:
                    Object.values(data),
                backgroundColor:
                    APP.colors
            }]
        },
        options:
            APP.chartOptions(
                "Incident Status Split",
                {
                    cutout: "62%",
                    scales: {}
                }
            )
    });
}

function drawPriorityPie() {
    const data =
        APP.cb("PRIORITY");

    APP.chart("c3", {
        type: "pie",
        data: {
            labels:
                Object.keys(data)
                    .map(
                        x =>
                            "P" + x
                    ),
            datasets: [{
                data:
                    Object.values(data),
                backgroundColor: [
                    "#dc2626",
                    "#f97316",
                    "#f59e0b",
                    "#16a34a"
                ]
            }]
        },
        options:
            APP.chartOptions(
                "Priority Distribution",
                {
                    scales: {}
                }
            )
    });
}

function drawPartnerRanking() {
    const data =
        APP.topEntries(
            APP.cb("Partner"),
            8
        );

    APP.chart("c4", {
        type: "bar",
        data: {
            labels:
                data.map(([label]) => label),
            datasets: [{
                label: "Incidents",
                data:
                    data.map(([, value]) => value),
                backgroundColor: "#7c3aed",
                borderRadius: 8
            }]
        },
        options: {
            ...APP.chartOptions(
                "Top Partner Incident Ranking"
            ),
            indexAxis: "y"
        }
    });
}

function drawCountryChart() {
    const data =
        APP.topEntries(
            APP.cb("Receive Country"),
            8
        );

    APP.chart("c5", {
        type: "bar",
        data: {
            labels:
                data.map(([label]) => label),
            datasets: [{
                label: "Incidents",
                data:
                    data.map(([, value]) => value),
                backgroundColor: "#0891b2",
                borderRadius: 8
            }]
        },
        options:
            APP.chartOptions(
                "Top Receive Countries"
            )
    });
}

function drawDelayedTxnChart() {
    const months =
        APP.sortedMonths();

    const delayed =
        APP.sumBy(
            "Month",
            "Delayed Transaction"
        );

    const breached =
        APP.sumBy(
            "Month",
            "Delivery Breached"
        );

    APP.chart("c6", {
        type: "line",
        data: {
            labels: months,
            datasets: [
                {
                    label: "Delayed Transactions",
                    data:
                        months.map(month => delayed[month] || 0),
                    borderColor: "#ea580c",
                    backgroundColor: "#ea580c",
                    tension: 0.35,
                    fill: false
                },
                {
                    label: "Delivery Breached",
                    data:
                        months.map(month => breached[month] || 0),
                    borderColor: "#dc2626",
                    backgroundColor: "#dc2626",
                    tension: 0.35,
                    fill: false
                }
            ]
        },
        options:
            APP.chartOptions(
                "Delayed vs Breached Trend"
            )
    });
}

function drawLossChart() {
    const data =
        APP.topEntries(
            APP.sumBy(
                "Partner",
                "Transaction Loss(customer impact)"
            ),
            8
        );

    APP.chart("c7", {
        type: "bar",
        data: {
            labels:
                data.map(([label]) => label),
            datasets: [{
                label: "Loss Impact",
                data:
                    data.map(([, value]) => value),
                backgroundColor: "#be123c",
                borderRadius: 8
            }]
        },
        options: {
            ...APP.chartOptions(
                "Transaction Loss by Partner"
            ),
            indexAxis: "y"
        }
    });
}

function drawAPNVolume() {
    const labels =
        APP.VOLUME.map(
            x =>
                APP.value(
                    x,
                    "CREATED_DATE"
                )
        );

    const vals =
        APP.VOLUME.map(
            x =>
                APP.n(
                    APP.value(
                        x,
                        "COUNT(*)"
                    )
                )
        );

    APP.chart("c10", {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Transactions",
                data: vals,
                backgroundColor: "#16a34a",
                borderRadius: 8
            }]
        },
        options:
            APP.chartOptions(
                "APN Monthly Transaction Volume"
            )
    });
}

function drawWuPartnerPie() {
    const data = {};

    APP.DATA.forEach((row) => {
        const owner =
            APP.issueOwner(row);

        data[owner] =
            (data[owner] || 0) + 1;
    });

    APP.chart("c12", {
        type: "doughnut",
        data: {
            labels:
                Object.keys(data),
            datasets: [{
                data:
                    Object.values(data),
                backgroundColor: [
                    "#2563eb",
                    "#f59e0b",
                    "#64748b"
                ]
            }]
        },
        options:
            APP.chartOptions(
                "WU vs Partner Side Issues",
                {
                    cutout: "62%",
                    scales: {}
                }
            )
    });
}

function drawWuPartnerTrend() {
    const months =
        APP.sortedMonths();

    const owners =
        ["WU side", "Partner side"];

    APP.chart("c13", {
        type: "line",
        data: {
            labels: months,
            datasets:
                owners.map((owner, i) => ({
                    label: owner,
                    data:
                        months.map(
                            month =>
                                APP.DATA.filter(
                                        row =>
                                        APP.value(row, "Month") === month &&
                                        APP.issueOwner(row) === owner
                                ).length
                        ),
                    borderColor: APP.colors[i],
                    backgroundColor: APP.colors[i],
                    tension: 0.35,
                    fill: false
                }))
        },
        options:
            APP.chartOptions(
                "WU vs Partner Side Trend"
            )
    });
}

function drawVendorIssueCategoryTrend() {
    const rows =
        APP.DATA.filter(
            row =>
                APP.issueOwner(row) === "Partner side"
        );

    const months =
        APP.sortedMonths(rows);

    const counts =
        APP.cb(
            ["issue category", "Issue subcategory"],
            rows
        );

    const categories =
        APP.topEntries(counts, 6)
            .map(([category]) => category);

    APP.chart("c14", {
        type: "bar",
        data: {
            labels: months,
            datasets:
                categories.map((category, i) => ({
                    label: category,
                    data:
                        months.map(
                            month =>
                                rows.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        APP.value(row, ["issue category", "Issue subcategory"]) === category
                                ).length
                        ),
                    backgroundColor:
                        APP.colors[i % APP.colors.length],
                    borderRadius: 5
                }))
        },
        options: {
            ...APP.chartOptions(
                "Partner Side Issue Category Trend"
            ),
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function drawTopWalletTrend() {
    const walletCounts =
        APP.cb("Wallet Name/Specific Bank");

    const wallets =
        APP.topEntries(walletCounts, 6)
            .map(([wallet]) => wallet);

    const months =
        APP.sortedMonths();

    APP.chart("c15", {
        type: "bar",
        data: {
            labels: months,
            datasets:
                wallets.map((wallet, i) => ({
                    label: wallet,
                    data:
                        months.map(
                            month =>
                                APP.DATA.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        (
                                            APP.value(row, "Wallet Name/Specific Bank") ||
                                            "Unknown"
                                        ) === wallet
                                ).length
                        ),
                    backgroundColor:
                        APP.colors[i % APP.colors.length],
                    borderRadius: 5
                }))
        },
        options: {
            ...APP.chartOptions(
                "Top Impacted Wallet Trend"
            ),
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function drawTopDelayedPartners() {
    const data =
        APP.topEntries(
            APP.sumBy(
                "Partner",
                "Delayed Transaction"
            ),
            6
        );

    APP.chart("c16", {
        type: "bar",
        data: {
            labels:
                data.map(([label]) => label),
            datasets: [{
                label: "Delayed MTCNs",
                data:
                    data.map(([, value]) => value),
                backgroundColor: "#dc2626",
                borderRadius: 8
            }]
        },
        options: {
            ...APP.chartOptions(
                "Top Partners by Delayed MTCNs"
            ),
            indexAxis: "y"
        }
    });
}

function drawTopDelayedWallets() {
    const data =
        APP.topEntries(
            APP.sumBy(
                "Wallet Name/Specific Bank",
                "Delayed Transaction"
            ),
            6
        );

    APP.chart("c17", {
        type: "bar",
        data: {
            labels:
                data.map(([label]) => label),
            datasets: [{
                label: "Delayed MTCNs",
                data:
                    data.map(([, value]) => value),
                backgroundColor: "#0891b2",
                borderRadius: 8
            }]
        },
        options: {
            ...APP.chartOptions(
                "Top Wallets by Delayed MTCNs"
            ),
            indexAxis: "y"
        }
    });
}

function drawResolutionSplit() {
    const data =
        APP.cb("Time Taken for Resolution");

    APP.chart("c18", {
        type: "doughnut",
        data: {
            labels:
                Object.keys(data),
            datasets: [{
                data:
                    Object.values(data),
                backgroundColor: [
                    "#16a34a",
                    "#f59e0b",
                    "#dc2626",
                    "#64748b"
                ]
            }]
        },
        options:
            APP.chartOptions(
                "Resolution Time Split",
                {
                    cutout: "62%",
                    scales: {}
                }
            )
    });
}

function drawImpactTypeSplit() {
    const data =
        APP.cb("Impact type");

    APP.chart("c19", {
        type: "pie",
        data: {
            labels:
                Object.keys(data),
            datasets: [{
                data:
                    Object.values(data),
                backgroundColor: [
                    "#dc2626",
                    "#2563eb",
                    "#16a34a"
                ]
            }]
        },
        options:
            APP.chartOptions(
                "Impact Type Split",
                {
                    scales: {}
                }
            )
    });
}

function drawIssueCategoryByMonth() {
    const months =
        APP.sortedMonths();

    const categories =
        APP.topEntries(
            APP.cb(["issue category", "Issue subcategory"]),
            6
        )
            .map(([category]) => category);

    APP.chart("c20", {
        type: "bar",
        data: {
            labels: months,
            datasets:
                categories.map((category, i) => ({
                    label: category,
                    data:
                        months.map(
                            month =>
                                APP.DATA.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        APP.value(row, ["issue category", "Issue subcategory"]) === category
                                ).length
                        ),
                    backgroundColor:
                        APP.colors[i % APP.colors.length],
                    borderRadius: 5
                }))
        },
        options: {
            ...APP.chartOptions(
                "Issue Category by Month"
            ),
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function drawMonitoringGapSplit() {
    const data =
        APP.cb("Monitoring Gap / delay In detection");

    APP.chart("c21", {
        type: "doughnut",
        data: {
            labels:
                Object.keys(data),
            datasets: [{
                data:
                    Object.values(data),
                backgroundColor:
                    APP.colors
            }]
        },
        options:
            APP.chartOptions(
                "Monitoring Gap / Detection Delay",
                {
                    cutout: "62%",
                    scales: {}
                }
            )
    });
}

function drawRejectedByPartner() {
    const data =
        APP.topEntries(
            APP.sumBy(
                "Partner",
                "Transaction REJECTED"
            ),
            6
        );

    APP.chart("c22", {
        type: "bar",
        data: {
            labels:
                data.map(([label]) => label),
            datasets: [{
                label: "Rejected Transactions",
                data:
                    data.map(([, value]) => value),
                backgroundColor: "#f97316",
                borderRadius: 8
            }]
        },
        options: {
            ...APP.chartOptions(
                "Rejected Transactions by Partner"
            ),
            indexAxis: "y"
        }
    });
}

function drawOperationalImpactByMonth() {
    const months =
        APP.sortedMonths();

    const delayed =
        APP.sumBy(
            "Month",
            "Delayed Transaction"
        );

    const breached =
        APP.sumBy(
            "Month",
            "Delivery Breached"
        );

    const rejected =
        APP.sumBy(
            "Month",
            "Transaction REJECTED"
        );

    APP.chart("c23", {
        type: "bar",
        data: {
            labels: months,
            datasets: [
                {
                    label: "Delayed",
                    data:
                        months.map(month => delayed[month] || 0),
                    backgroundColor: "#f59e0b",
                    borderRadius: 6
                },
                {
                    label: "Breached",
                    data:
                        months.map(month => breached[month] || 0),
                    backgroundColor: "#dc2626",
                    borderRadius: 6
                },
                {
                    label: "Rejected",
                    data:
                        months.map(month => rejected[month] || 0),
                    backgroundColor: "#7c3aed",
                    borderRadius: 6
                }
            ]
        },
        options:
            APP.chartOptions(
                "Operational Impact by Month"
            )
    });
}

function drawReceiveCountryImpact() {
    const data =
        APP.getReceiveCountryImpactEntries(10);

    APP.chart("c24", {
        type: "bar",
        data: {
            labels:
                data.map(([country]) => country),
            datasets: [
                {
                    label: "Delayed Transactions",
                    data:
                        data.map(([, metrics]) => metrics.delayed),
                    backgroundColor: "#0891b2",
                    borderRadius: 6
                },
                {
                    label: "Breached Transactions",
                    data:
                        data.map(([, metrics]) => metrics.breached),
                    backgroundColor: "#dc2626",
                    borderRadius: 6
                }
            ]
        },
        options: {
            ...APP.chartOptions(
                "Receive Country Impact"
            ),
            indexAxis: "y"
        }
    });
}

function drawInsufficientFundsTrend() {
    const rows =
        APP.DATA.filter(
            r =>
                (
                    r["Issue subcategory"] || ""
                )
                    .toLowerCase()
                    .includes("insufficient")
        );

    const months =
        APP.sortedMonths(rows);

    const partners =
        APP.topEntries(
            APP.cb("Partner", rows),
            8
        )
            .map(([partner]) => partner);

    APP.chart("c11", {
        type: "bar",
        data: {
            labels: partners,
            datasets:
                months.map((month, i) => ({
                    label: month,
                    data:
                        partners.map(
                            partner =>
                                rows.filter(
                                    row =>
                                        APP.value(row, "Month") === month &&
                                        APP.value(row, "Partner") === partner
                                ).length
                        ),
                    backgroundColor:
                        APP.colors[i % APP.colors.length],
                    borderRadius: 5
                }))
        },
        options:
            APP.chartOptions(
                "Insufficient Funds by Partner"
            )
    });
}

APP.draw = () => {
    APP.destroy();

    drawMonthlyTrend();
    drawStatusDonut();
    drawPriorityPie();
    drawPartnerRanking();
    drawCountryChart();
    drawDelayedTxnChart();
    drawLossChart();
    drawAPNVolume();
    drawWuPartnerPie();
    drawWuPartnerTrend();
    drawVendorIssueCategoryTrend();
    drawTopWalletTrend();
    drawTopDelayedPartners();
    drawTopDelayedWallets();
    drawResolutionSplit();
    drawImpactTypeSplit();
    drawIssueCategoryByMonth();
    drawMonitoringGapSplit();
    drawRejectedByPartner();
    drawOperationalImpactByMonth();
    drawReceiveCountryImpact();
    drawInsufficientFundsTrend();
};

APP.getTopNValue = (section) => {
    const value =
        section === "rejections"
            ? APP.rejectionsTopN
            : APP.analyticsTopN;

    return value
        ? Number(value)
        : null;
};

APP.applyTopN = (entries, n) => {
    const sorted =
        [...entries].sort((a, b) => {
            const aValue =
                typeof a === "object" && a !== null
                    ? APP.n(a.value)
                    : APP.n(a[1]);
            const bValue =
                typeof b === "object" && b !== null
                    ? APP.n(b.value)
                    : APP.n(b[1]);

            return bValue - aValue;
        });

    if (!n) return sorted;

    return sorted.slice(0, n);
};

APP.topMapEntries = (
    map,
    section = "analytics"
) =>
    APP.applyTopN(
        Object.entries(map),
        APP.getTopNValue(section)
    );

APP.chartDataset = (
    label,
    data,
    color
) => ({
    label,
    data,
    backgroundColor: color,
    borderColor: color,
    borderRadius: 8,
    tension: 0.35,
    fill: false
});

APP.rejectionRows = (
    rows = APP.filteredRejections
) =>
    rows.filter((row) =>
        APP.value(row, "SUBSTATE") === "Rejected" ||
        APP.value(row, "PARTNER_REJECTREASON")
    );

APP.rejectionMonths = (
    rows = APP.rejectionRows()
) =>
    APP.monthOrder.filter((month) =>
        rows.some(
            (row) =>
                APP.value(
                    row,
                    "MONTH"
                ) === month
        )
    );

APP.groupCountEntries = (
    rows,
    key,
    section = "analytics"
) =>
    APP.topMapEntries(
        rows.reduce((map, row) => {
            const label =
                APP.value(row, key) || "Unknown";
            map[label] =
                (map[label] || 0) + 1;
            return map;
        }, {}),
        section
    );

APP.monthlyGroupMatrix = (
    rows,
    monthKey,
    seriesKey,
    section = "rejections"
) => {
    const months =
        APP.monthOrder.filter((month) =>
            rows.some(
                (row) =>
                    APP.value(
                        row,
                        monthKey
                    ) === month
            )
        );
    const series =
        APP.groupCountEntries(
            rows,
            seriesKey,
            section
        ).map(([label]) => label);

    return {
        months,
        series,
        datasets:
            series.map((label, index) => ({
                label,
                data:
                    months.map((month) =>
                        rows.filter((row) =>
                            APP.value(
                                row,
                                monthKey
                            ) === month &&
                            APP.value(
                                row,
                                seriesKey
                            ) === label
                        ).length
                    ),
                backgroundColor:
                    APP.colors[index % APP.colors.length],
                borderColor:
                    APP.colors[index % APP.colors.length],
                borderRadius: 6,
                tension: 0.35,
                fill: false
            }))
    };
};

APP.drawChartSafe = (
    id,
    config
) => {
    const el = APP.g(id);

    if (!el) return;

    APP.chart(id, config);
};

APP.buildIncidentCharts = () => {
    const months =
        APP.sortedMonths();
    const monthCounts =
        APP.cb("Month");

    APP.drawChartSafe("c1", {
        type: "bar",
        data: {
            labels: months,
            datasets: [
                APP.chartDataset(
                    "Incidents",
                    months.map((month) => monthCounts[month] || 0),
                    "#2563eb"
                )
            ]
        },
        options: APP.chartOptions("Monthly Incident Trend")
    });

    APP.drawChartSafe("c2", {
        type: "doughnut",
        data: {
            labels: Object.keys(APP.cb("Status")),
            datasets: [{
                data: Object.values(APP.cb("Status")),
                backgroundColor: APP.colors
            }]
        },
        options: APP.chartOptions("Incident Status Split", { cutout: "62%", scales: {} })
    });

    APP.drawChartSafe("c3", {
        type: "pie",
        data: {
            labels: Object.keys(APP.cb("PRIORITY")).map((x) => `P${x}`),
            datasets: [{
                data: Object.values(APP.cb("PRIORITY")),
                backgroundColor: ["#dc2626", "#f97316", "#f59e0b", "#16a34a"]
            }]
        },
        options: APP.chartOptions("Priority Distribution", { scales: {} })
    });

    const incidentCharts = [
        ["c4", "Top Partner Incident Ranking", "Partner", "#7c3aed", true],
        ["c5", "Top Receive Countries", "Receive Country", "#0891b2", false],
        ["c18", "Resolution Time Split", "Time Taken for Resolution", null, false, "doughnut"],
        ["c19", "Impact Type Split", "Impact type", null, false, "pie"],
        ["c21", "Monitoring Gap / Detection Delay", "Monitoring Gap / delay In detection", null, false, "doughnut"]
    ];

    incidentCharts.forEach(([id, title, key, color, horizontal, type]) => {
        const entries =
            APP.groupCountEntries(
                APP.DATA,
                key,
                "analytics"
            );

        APP.drawChartSafe(id, {
            type: type || "bar",
            data: {
                labels: entries.map(([label]) => label),
                datasets: [{
                    label: type ? title : "Incidents",
                    data: entries.map(([, value]) => value),
                    backgroundColor: color ? color : APP.colors,
                    borderRadius: 8
                }]
            },
            options: APP.chartOptions(
                title,
                type
                    ? { cutout: type === "doughnut" ? "62%" : undefined, scales: {} }
                    : horizontal
                        ? { indexAxis: "y" }
                        : {}
            )
        });
    });

    const delayedEntries =
        APP.topMapEntries(
            APP.sumBy(
                "Partner",
                "Delayed Transaction"
            ),
            "analytics"
        );
    const walletEntries =
        APP.topMapEntries(
            APP.sumBy(
                "Wallet Name/Specific Bank",
                "Delayed Transaction"
            ),
            "analytics"
        );
    const lossEntries =
        APP.topMapEntries(
            APP.sumBy(
                "Partner",
                "Transaction Loss(customer impact)"
            ),
            "analytics"
        );
    const rejectedEntries =
        APP.topMapEntries(
            APP.sumBy(
                "Partner",
                "Transaction REJECTED"
            ),
            "analytics"
        );

    [
        ["c7", "Transaction Loss by Partner", lossEntries, "#be123c", "Loss Impact"],
        ["c16", "Top Partners by Delayed MTCNs", delayedEntries, "#dc2626", "Delayed MTCNs"],
        ["c17", "Top Wallets by Delayed MTCNs", walletEntries, "#0891b2", "Delayed MTCNs"],
        ["c22", "Rejected Transactions by Partner", rejectedEntries, "#f97316", "Rejected Transactions"]
    ].forEach(([id, title, entries, color, label]) => {
        APP.drawChartSafe(id, {
            type: "bar",
            data: {
                labels: entries.map(([entry]) => entry),
                datasets: [APP.chartDataset(label, entries.map(([, value]) => value), color)]
            },
            options: APP.chartOptions(title, { indexAxis: "y" })
        });
    });

    const delayed =
        APP.sumBy("Month", "Delayed Transaction");
    const breached =
        APP.sumBy("Month", "Delivery Breached");
    const rejected =
        APP.sumBy("Month", "Transaction REJECTED");

    APP.drawChartSafe("c6", {
        type: "line",
        data: {
            labels: months,
            datasets: [
                APP.chartDataset("Delayed Transactions", months.map((month) => delayed[month] || 0), "#ea580c"),
                APP.chartDataset("Delivery Breached", months.map((month) => breached[month] || 0), "#dc2626")
            ]
        },
        options: APP.chartOptions("Delayed vs Breached Trend")
    });

    APP.drawChartSafe("c23", {
        type: "bar",
        data: {
            labels: months,
            datasets: [
                APP.chartDataset("Delayed", months.map((month) => delayed[month] || 0), "#f59e0b"),
                APP.chartDataset("Breached", months.map((month) => breached[month] || 0), "#dc2626"),
                APP.chartDataset("Rejected", months.map((month) => rejected[month] || 0), "#7c3aed")
            ]
        },
        options: APP.chartOptions("Operational Impact by Month")
    });

    APP.drawChartSafe("c10", {
        type: "bar",
        data: {
            labels: APP.VOLUME.map((row) => APP.value(row, "CREATED_DATE")),
            datasets: [
                APP.chartDataset(
                    "Transactions",
                    APP.VOLUME.map((row) => APP.n(APP.value(row, "COUNT(*)"))),
                    "#16a34a"
                )
            ]
        },
        options: APP.chartOptions("APN Monthly Transaction Volume")
    });

    const ownerMap = {};
    APP.DATA.forEach((row) => {
        const owner = APP.issueOwner(row);
        ownerMap[owner] = (ownerMap[owner] || 0) + 1;
    });

    APP.drawChartSafe("c12", {
        type: "doughnut",
        data: {
            labels: Object.keys(ownerMap),
            datasets: [{
                data: Object.values(ownerMap),
                backgroundColor: ["#2563eb", "#f59e0b", "#64748b"]
            }]
        },
        options: APP.chartOptions("WU vs Partner Side Issues", { cutout: "62%", scales: {} })
    });

    APP.drawChartSafe("c13", {
        type: "line",
        data: {
            labels: months,
            datasets: ["WU side", "Partner side"].map((owner, index) =>
                APP.chartDataset(
                    owner,
                    months.map((month) =>
                        APP.DATA.filter((row) =>
                            APP.value(row, "Month") === month &&
                            APP.issueOwner(row) === owner
                        ).length
                    ),
                    APP.colors[index]
                )
            )
        },
        options: APP.chartOptions("WU vs Partner Side Trend")
    });

    const partnerSideRows =
        APP.DATA.filter((row) => APP.issueOwner(row) === "Partner side");
    const partnerMatrix =
        APP.monthlyGroupMatrix(
            partnerSideRows,
            "Month",
            ["issue category", "Issue subcategory"],
            "analytics"
        );

    APP.drawChartSafe("c14", {
        type: "bar",
        data: {
            labels: partnerMatrix.months,
            datasets: partnerMatrix.datasets
        },
        options: APP.chartOptions("Partner Side Issue Category Trend", {
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        })
    });

    const walletMatrix =
        APP.monthlyGroupMatrix(
            APP.DATA,
            "Month",
            "Wallet Name/Specific Bank",
            "analytics"
        );

    APP.drawChartSafe("c15", {
        type: "bar",
        data: {
            labels: walletMatrix.months,
            datasets: walletMatrix.datasets
        },
        options: APP.chartOptions("Top Impacted Wallet Trend", {
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        })
    });

    const issueCategoryMatrix =
        APP.monthlyGroupMatrix(
            APP.DATA,
            "Month",
            ["issue category", "Issue subcategory"],
            "analytics"
        );

    APP.drawChartSafe("c20", {
        type: "bar",
        data: {
            labels: issueCategoryMatrix.months,
            datasets: issueCategoryMatrix.datasets
        },
        options: APP.chartOptions("Issue Category by Month", {
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        })
    });

    const receiveCountryImpactEntries =
        APP.applyTopN(
            Object.entries(
                APP.DATA.reduce((map, row) => {
                    const country =
                        APP.value(row, "Receive Country") || "Unknown";
                    if (!map[country]) {
                        map[country] = { delayed: 0, breached: 0 };
                    }
                    map[country].delayed += APP.n(APP.value(row, "Delayed Transaction"));
                    map[country].breached += APP.n(APP.value(row, "Delivery Breached"));
                    return map;
                }, {})
            ).map(([label, metrics]) => ({
                label,
                value: metrics.delayed,
                metrics
            })),
            APP.getTopNValue("analytics")
        );

    APP.drawChartSafe("c24", {
        type: "bar",
        data: {
            labels: receiveCountryImpactEntries.map((entry) => entry.label),
            datasets: [
                APP.chartDataset(
                    "Delayed Transactions",
                    receiveCountryImpactEntries.map((entry) => entry.metrics.delayed),
                    "#0891b2"
                ),
                APP.chartDataset(
                    "Breached Transactions",
                    receiveCountryImpactEntries.map((entry) => entry.metrics.breached),
                    "#dc2626"
                )
            ]
        },
        options: APP.chartOptions("Receive Country Impact", { indexAxis: "y" })
    });

    const insufficientRows =
        APP.DATA.filter((row) =>
            (row["Issue subcategory"] || "")
                .toLowerCase()
                .includes("insufficient")
        );
    const insufficientPartners =
        APP.groupCountEntries(
            insufficientRows,
            "Partner",
            "analytics"
        ).map(([label]) => label);
    const insufficientMonths =
        APP.sortedMonths(insufficientRows);

    APP.drawChartSafe("c11", {
        type: "bar",
        data: {
            labels: insufficientPartners,
            datasets: insufficientMonths.map((month, index) => ({
                label: month,
                data: insufficientPartners.map((partner) =>
                    insufficientRows.filter((row) =>
                        APP.value(row, "Month") === month &&
                        APP.value(row, "Partner") === partner
                    ).length
                ),
                backgroundColor: APP.colors[index % APP.colors.length],
                borderRadius: 6
            }))
        },
        options: APP.chartOptions("Insufficient Funds by Partner")
    });
};

APP.buildRejectionCharts = () => {
    const rows =
        APP.rejectionRows();
    const allRows =
        APP.filteredRejections || [];
    const months =
        APP.rejectionMonths(rows);

    APP.drawChartSafe("rc1", {
        type: "bar",
        data: {
            labels: months,
            datasets: [APP.chartDataset("Rejected Rows", months.map((month) =>
                rows.filter((row) => APP.value(row, "MONTH") === month).length
            ), "#dc2626")]
        },
        options: APP.chartOptions("Monthly Rejection Trend")
    });

    [
        ["rc2", "Rejection by Partner", "PARTNERNAME", "bar", true],
        ["rc3", "Rejection by Receive Country", "RECEIVECOUNTRYCODE", "bar", true],
        ["rc4", "Partner Reject Reason Breakdown", "PARTNER_REJECTREASON", "doughnut", false],
        ["rc5", "APN Reject Reason Breakdown", "APN_REJECTREASON", "doughnut", false],
        ["rc6", "Rejection by Delivery Service", "DELIVERYSERVICE", "pie", false],
        ["rc7", "Rejection by Channel", "CHANNEL", "bar", false],
        ["rc8", "Rejection by Purpose", "PURPOSE", "bar", true],
        ["rc9", "Substate Distribution", "SUBSTATE", "doughnut", false],
        ["rc10", "Top Banks by Rejection", "BANKNAME", "bar", true]
    ].forEach(([id, title, key, type, horizontal]) => {
        const sourceRows =
            id === "rc9"
                ? allRows
                : rows;
        const entries =
            APP.groupCountEntries(
                sourceRows,
                key,
                "rejections"
            );

        APP.drawChartSafe(id, {
            type,
            data: {
                labels: entries.map(([label]) => label),
                datasets: [{
                    label: "Count",
                    data: entries.map(([, value]) => value),
                    backgroundColor: type === "bar" ? "#2563eb" : APP.colors,
                    borderRadius: 8
                }]
            },
            options: APP.chartOptions(
                title,
                type === "bar"
                    ? (horizontal ? { indexAxis: "y" } : {})
                    : { cutout: type === "doughnut" ? "62%" : undefined, scales: {} }
            )
        });
    });

    const partnerMatrix =
        APP.monthlyGroupMatrix(
            rows,
            "MONTH",
            "PARTNERNAME",
            "rejections"
        );
    APP.drawChartSafe("rc11", {
        type: "bar",
        data: {
            labels: partnerMatrix.months,
            datasets: partnerMatrix.datasets
        },
        options: APP.chartOptions("Monthly Trend by Partner", {
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        })
    });

    const deliveryMatrix =
        APP.monthlyGroupMatrix(
            rows,
            "MONTH",
            "DELIVERYSERVICE",
            "rejections"
        );
    APP.drawChartSafe("rc12", {
        type: "line",
        data: {
            labels: deliveryMatrix.months,
            datasets: deliveryMatrix.datasets.map((dataset) => ({
                ...dataset,
                fill: false
            }))
        },
        options: APP.chartOptions("Monthly Trend by Delivery Service")
    });

    const partnerReasonLabels =
        APP.groupCountEntries(
            rows,
            "PARTNERNAME",
            "rejections"
        ).map(([label]) => label);
    const partnerReasons =
        APP.groupCountEntries(
            rows,
            "PARTNER_REJECTREASON",
            "rejections"
        ).map(([label]) => label);
    APP.drawChartSafe("rc13", {
        type: "bar",
        data: {
            labels: partnerReasonLabels,
            datasets: partnerReasons.map((reason, index) => ({
                label: reason,
                data: partnerReasonLabels.map((partner) =>
                    rows.filter((row) =>
                        APP.value(row, "PARTNERNAME") === partner &&
                        APP.value(row, "PARTNER_REJECTREASON") === reason
                    ).length
                ),
                backgroundColor: APP.colors[index % APP.colors.length],
                borderRadius: 6
            }))
        },
        options: APP.chartOptions("Partner Reject Reason by Partner", {
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        })
    });

    const receiveCountries =
        APP.groupCountEntries(
            rows,
            "RECEIVECOUNTRYCODE",
            "rejections"
        ).map(([label]) => label);
    const sendCountries =
        APP.groupCountEntries(
            rows,
            "SENDCOUNTRYCODE",
            "rejections"
        ).map(([label]) => label);
    APP.drawChartSafe("rc14", {
        type: "bar",
        data: {
            labels: receiveCountries,
            datasets: sendCountries.map((country, index) => ({
                label: country,
                data: receiveCountries.map((receive) =>
                    rows.filter((row) =>
                        APP.value(row, "RECEIVECOUNTRYCODE") === receive &&
                        APP.value(row, "SENDCOUNTRYCODE") === country
                    ).length
                ),
                backgroundColor: APP.colors[index % APP.colors.length],
                borderRadius: 6
            }))
        },
        options: APP.chartOptions("Send vs Receive Country Matrix", {
            indexAxis: "y"
        })
    });
};

APP.exportOrder = [
    "c1", "c2", "c3", "c4", "c5", "c6", "c7",
    "c10", "c12", "c13", "c14", "c15", "c16",
    "c17", "c18", "c19", "c20", "c21", "c22",
    "c23", "c24", "c11",
    "rc1", "rc2", "rc3", "rc4", "rc5", "rc6", "rc7",
    "rc8", "rc9", "rc10", "rc11", "rc12", "rc13", "rc14"
];

APP.draw = () => {
    APP.destroy();
    APP.buildIncidentCharts();
    APP.buildRejectionCharts();
};
