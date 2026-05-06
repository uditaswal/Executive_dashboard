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
                color: "#475569",
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
            color: "#0f172a",
            padding: {
                bottom: 14
            }
        },
        tooltip: {
            enabled: true,
            backgroundColor: "#0f172a",
            padding: 12
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: "#e5e7eb"
            },
            ticks: {
                color: "#64748b"
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: "#64748b"
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
