APP.showDataLabels = true;   // true / false toggle



APP.cb = (key) => {

    let map = {};

    APP.DATA.forEach((row) => {

        const value =
            row[key] || "Unknown";

        map[value] =
            (map[value] || 0) + 1;
    });

    return map;
};



APP.sumBy = (
    groupKey,
    valueKey
) => {

    let map = {};

    APP.DATA.forEach((row) => {

        const key =
            row[groupKey] || "Unknown";

        const val =
            Number(
                row[valueKey]
            ) || 0;

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
                row => row.Month === month
            )
    );

APP.issueOwner = (row) => {
    const value =
        row["Issue (WU issue/Partner side)"] || "";

    if (/wu/i.test(value)) return "WU side";
    if (/vendor|partner/i.test(value)) return "Partner side";

    return value || "Unknown";
};

APP.topEntries = (map, limit = 5) =>
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



APP.chartOptions = (title) => ({

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

        legend: {
            position: "bottom"
        },

        title: {
            display: true,
            text: title,
            font: {
                size: 18,
                weight: "bold"
            },
            color: "#111827",
            padding: 16
        },

        tooltip: {
            enabled: true
        }
    },

    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: "#e5e7eb"
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    }
});



APP.colors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#ea580c",
    "#0f766e"
];



function drawMonthlyTrend() {

    const data =
        APP.cb("Month");

    APP.charts.c1 =
        new Chart(c1, {

            type: "bar",

            data: {
                labels:
                    Object.keys(data),

                datasets: [{
                    label:
                        "Incidents",

                    data:
                        Object.values(data),

                    backgroundColor:
                        "#2563eb",

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

    APP.charts.c2 =
        new Chart(c2, {

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
                    "Incident Status Split"
                )
        });
}



function drawPriorityPie() {

    const data =
        APP.cb("PRIORITY");

    APP.charts.c3 =
        new Chart(c3, {

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

                    backgroundColor:
                        [
                            "#dc2626",
                            "#f59e0b",
                            "#16a34a"
                        ]
                }]
            },

            options:
                APP.chartOptions(
                    "Priority Distribution"
                )
        });
}



function drawPartnerRanking() {

    const data =
        APP.cb("Partner");

    APP.charts.c4 =
        new Chart(c4, {

            type: "bar",

            data: {
                labels:
                    Object.keys(data),

                datasets: [{
                    label:
                        "Incidents",

                    data:
                        Object.values(data),

                    backgroundColor:
                        "#7c3aed",

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

    if (!window.c5) return;

    const data =
        APP.cb(
            "Receive Country"
        );

    APP.charts.c5 =
        new Chart(c5, {

            type: "bar",

            data: {
                labels:
                    Object.keys(data),

                datasets: [{
                    label:
                        "Incidents",

                    data:
                        Object.values(data),

                    backgroundColor:
                        "#0891b2",

                    borderRadius: 8
                }]
            },

            options:
                APP.chartOptions(
                    "Incidents by Country"
                )
        });
}



function drawDelayedTxnChart() {

    if (!window.c6) return;

    const data =
        APP.sumBy(
            "Month",
            "Delayed Transaction"
        );

    APP.charts.c6 =
        new Chart(c6, {

            type: "line",

            data: {
                labels:
                    Object.keys(data),

                datasets: [{
                    label:
                        "Transactions",

                    data:
                        Object.values(data),

                    borderColor:
                        "#ea580c",

                    backgroundColor:
                        "#ea580c",

                    tension: 0.35,

                    fill: false
                }]
            },

            options:
                APP.chartOptions(
                    "Delayed Transactions Trend"
                )
        });
}



function drawLossChart() {

    if (!window.c7) return;

    const data =
        APP.sumBy(
            "Partner",
            "Transaction Loss(customer impact)"
        );

    APP.charts.c7 =
        new Chart(c7, {

            type: "bar",

            data: {
                labels:
                    Object.keys(data),

                datasets: [{
                    label:
                        "Loss",

                    data:
                        Object.values(data),

                    backgroundColor:
                        "#dc2626",

                    borderRadius: 8
                }]
            },

            options:
                APP.chartOptions(
                    "Transaction Loss by Partner"
                )
        });
}



function drawAPNVolume() {

    if (!window.c10) return;

    const labels =
        APP.VOLUME.map(
            x =>
                x.CREATED_DATE
        );

    const vals =
        APP.VOLUME.map(
            x =>
                x["COUNT(*)"]
        );

    APP.charts.c10 =
        new Chart(c10, {

            type: "bar",

            data: {
                labels,

                datasets: [{
                    label:
                        "Transactions",

                    data: vals,

                    backgroundColor:
                        "#16a34a",

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
    if (!window.c12) return;

    const data = {};

    APP.DATA.forEach((row) => {
        const owner =
            APP.issueOwner(row);

        data[owner] =
            (data[owner] || 0) + 1;
    });

    APP.charts.c12 =
        new Chart(c12, {
            type: "pie",
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        "#2563eb",
                        "#f59e0b",
                        "#6b7280"
                    ]
                }]
            },
            options:
                APP.chartOptions(
                    "WU vs Partner Side Issues"
                )
        });
}

function drawWuPartnerTrend() {
    if (!window.c13) return;

    const months =
        APP.sortedMonths();
    const owners =
        ["WU side", "Partner side"];

    APP.charts.c13 =
        new Chart(c13, {
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
                                            row.Month === month &&
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
    if (!window.c14) return;

    const rows =
        APP.DATA.filter(
            row =>
                APP.issueOwner(row) === "Partner side"
        );
    const months =
        APP.sortedMonths(rows);
    const counts = {};

    rows.forEach((row) => {
        const category =
            row["Issue subcategory"] ||
            row["issue category"] ||
            "Unknown";

        counts[category] =
            (counts[category] || 0) + 1;
    });

    const categories =
        APP.topEntries(counts, 6)
            .map(([category]) => category);

    APP.charts.c14 =
        new Chart(c14, {
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
                                            row.Month === month &&
                                            (
                                                row["Issue subcategory"] ||
                                                row["issue category"] ||
                                                "Unknown"
                                            ) === category
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
    if (!window.c15) return;

    const walletCounts = {};

    APP.DATA.forEach((row) => {
        const wallet =
            row["Wallet Name/Specific Bank"] ||
            "Unknown";

        walletCounts[wallet] =
            (walletCounts[wallet] || 0) + 1;
    });

    const wallets =
        APP.topEntries(walletCounts, 5)
            .map(([wallet]) => wallet);
    const months =
        APP.sortedMonths();

    APP.charts.c15 =
        new Chart(c15, {
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
                                            row.Month === month &&
                                            (
                                                row["Wallet Name/Specific Bank"] ||
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
    if (!window.c16) return;

    const data =
        APP.topEntries(
            APP.sumBy(
                "Partner",
                "Delayed Transaction"
            ),
            5
        );

    APP.charts.c16 =
        new Chart(c16, {
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
                    "Top 5 Partners by Delayed MTCNs"
                ),
                indexAxis: "y"
            }
        });
}

function drawTopDelayedWallets() {
    if (!window.c17) return;

    const data =
        APP.topEntries(
            APP.sumBy(
                "Wallet Name/Specific Bank",
                "Delayed Transaction"
            ),
            5
        );

    APP.charts.c17 =
        new Chart(c17, {
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
                    "Top 5 Wallets by Delayed MTCNs"
                ),
                indexAxis: "y"
            }
        });
}

function drawInsufficientFundsTrend() {
    if (!window.c11) return;

    const rows =
        APP.DATA.filter(
            r =>
                (
                    r["Issue subcategory"] || ""
                )
                    .toLowerCase()
                    .includes("insufficient")
        );

    const map = {};

    rows.forEach((r) => {
        const type =
            r["Issue (WU issue/Partner side)"] ||
            "Unknown";
        const partner =
            r.Partner ||
            "Unknown";
        const month =
            r.Month ||
            "Unknown";

        if (!map[type]) {
            map[type] = {};
        }

        if (!map[type][partner]) {
            map[type][partner] = {};
        }

        map[type][partner][month] =
            (map[type][partner][month] || 0) + 1;
    });

    const labels = [];
    const groups = [];

    Object.keys(map).forEach((type) => {
        Object.keys(map[type]).forEach(
            partner => {
                labels.push(partner);
                groups.push(type);
            }
        );
        labels.push("");
        groups.push("");
    });

    const months = ["Jan", "Feb", "Mar", "Apr"];

    const colors = {
        Jan: "#2563eb",
        Feb: "#60a5fa",
        Mar: "#ef4444",
        Apr: "#84cc16"
    };

    const datasets =
        months.map((m) => {
            const values = [];

            Object.keys(map).forEach((type) => {
                Object.keys(map[type]).forEach(
                    partner => {
                        values.push(
                            map[type][partner][m] || 0
                        );
                    }
                );
                values.push(null);
            });

            return {
                label: m,
                data: values,
                backgroundColor: colors[m],
                borderRadius: 4
            };
        });

    APP.charts.c11 =
        new Chart(c11, {
            type: "bar",
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Insufficient Funds Trend",
                        font: {
                            size: 22,
                            weight: "bold"
                        }
                    },
                    legend: {
                        position: "right"
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 90,
                            minRotation: 90,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            },
            plugins: [
                {
                    id: "groupLabels",
                    afterDraw(chart) {
                        const {
                            ctx,
                            scales: { x }
                        } = chart;

                        ctx.save();
                        ctx.fillStyle = "#555";
                        ctx.font = "bold 13px Arial";

                        let start = 0;

                        Object.keys(map)
                            .forEach((type) => {
                                const count =
                                    Object.keys(
                                        map[type]
                                    ).length;
                                const end =
                                    start + count - 1;
                                const center =
                                    (
                                        x.getPixelForTick(start) +
                                        x.getPixelForTick(end)
                                    ) / 2;

                                ctx.fillText(
                                    type,
                                    center - 35,
                                    chart.height - 15
                                );

                                start = end + 2;
                            });

                        ctx.restore();
                    }
                }
            ]
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
        drawInsufficientFundsTrend();
    };
