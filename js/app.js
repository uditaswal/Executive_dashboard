APP.render = () => {
    APP.g("count").textContent =
        APP.DATA.length + " records";

    APP.renderSummary();
    APP.renderKPIs();
    APP.renderMetrics();
    APP.renderSuggestions();
    APP.renderTable();
    APP.draw();
};

APP.renderTable = () => {
    APP.g("tbody").innerHTML =
        APP.DATA.slice(0, 300)
            .map(
                r => `
<tr>
<td>${r.Incident || ""}</td>
<td>${r.Month || ""}</td>
<td>${r.Partner || ""}</td>
<td>${r.Status || ""}</td>
<td>P${r.PRIORITY || ""}</td>
</tr>
`
            )
            .join("");
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

    const p1 =
        APP.DATA.filter(
            x =>
                String(x.PRIORITY) === "1"
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

    const reroute =
        APP.getRerouteMetrics();

    const volume =
        APP.getVolumeMetrics();

    const cards = [
        ["Total Incidents", total],
        ["Open Incidents", open],
        ["Closed/Resolved", closed],
        ["P1 Critical", p1],
        ["Vendor Issues", vendor],
        ["Wallet Issues", wallet],
        ["Delayed Txns", delayed],
        ["Delivery Breached", breached],
        ["Loss Impact", loss],
        ["Rerouted Txns", reroute.txnCount],
        ["Rerouted USD", reroute.usd.toFixed(2)],
        ["Avg APN Volume", volume.avg.toLocaleString()]
    ];

    APP.g("kpis").innerHTML =
        cards.map((x, i) => `
<div class="kpi-card kpi-${i}">
   <div class="kpi-label">${x[0]}</div>
   <div class="kpi-number">${x[1]}</div>
</div>
`).join("");
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
                /less than 1 day/i.test(
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

    const breachedAfterDelayPct =
        delayed
            ? ((breached / delayed) * 100).toFixed(1) + "%"
            : "0%";

    const rows = [
        ["Total Incidents", total, "Review period"],
        ["Vendor-side %", vendorPct + "%", "Partner driven"],
        ["Wallet-related %", walletPct + "%", "Customer impact"],
        ["Rerouted Txns", reroute.txnCount, "Saved manually"],
        ["Rerouted USD", reroute.usd.toFixed(2), "Protected value"],
        ["Avg APN Monthly Volume", volume.avg.toLocaleString(), "Transactions"],
        ["Resolved < 1 day", resolvedUnderOneDay, "Incident count"],
        ["SLA breached after delay", breachedAfterDelayPct, "Breached / delayed MTCNs"]
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

    const reroute =
        APP.getRerouteMetrics();

    const volume =
        APP.getVolumeMetrics();

    const period =
        APP.getReviewPeriod();

    APP.g("execSummary").innerHTML = `
<strong>Executive Summary - ${period} 2026</strong>

<ul style="margin-top:8px; padding-left:18px; line-height:1.8">
  <li>A total of <b>${total}</b> incidents were recorded across the APN network during the review period.</li>
  <li>Vendor/partner side issues accounted for <b>${vendorPct}%</b> of incidents, with top contributors being <b>${topPartners}</b>.</li>
  <li><b>${p1}</b> P1 incidents were raised, with <b>${open}</b> currently open and requiring immediate resolution.</li>
  <li><b>${delayed.toLocaleString()}</b> transactions were delayed.</li>
  <li><b>${breached.toLocaleString()}</b> delivery SLAs were breached.</li>
  <li><b>${reroute.txnCount.toLocaleString()}</b> transactions worth <b>USD ${reroute.usd.toFixed(2)}</b> were manually rerouted.</li>
  <li>Average APN monthly transaction volume stood at <b>${volume.avg.toLocaleString()}</b>.</li>
  <li>Funding and wallet-related issues remain key themes; proactive monitoring coverage and partner redundancy improvements are recommended.</li>
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
APP.bindMonthFilter();

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
