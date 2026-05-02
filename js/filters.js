APP.fill = (id, vals) => {
    const e = APP.g(id),
        f = e.options[0].outerHTML;
    e.innerHTML = f;
    vals.forEach((v) => (e.innerHTML += `<option>${v}</option>`));
};
APP.populate = () => {
    APP.fill("fMonth", APP.u(APP.RAW.map((x) => x.Month)));
    APP.fill("fPartner", APP.u(APP.RAW.map((x) => x.Partner)));
    APP.fill("fStatus", APP.u(APP.RAW.map((x) => x.Status)));
    APP.fill("fPriority", APP.u(APP.RAW.map((x) => x.PRIORITY)));
    APP.fill("fRegion", APP.u(APP.RAW.map((x) => x.Region)));
};
APP.apply = () => {
    const selectedMonths =
        [...document.querySelectorAll(".mchk:checked")]
            .map(x => x.value);

    const q = APP.g("search").value.toLowerCase();

    APP.DATA = APP.RAW.filter(
        (r) => {
            const analyticsMonthOk =
                selectedMonths.length === 0 ||
                selectedMonths.includes(r.Month);

            return (
                analyticsMonthOk &&
                (!fMonth.value || r.Month == fMonth.value) &&
                (!fPartner.value || r.Partner == fPartner.value) &&
                (!fStatus.value || r.Status == fStatus.value) &&
                (!fPriority.value || String(r.PRIORITY) == fPriority.value) &&
                (!fRegion.value || r.Region == fRegion.value) &&
                (!q || JSON.stringify(r).toLowerCase().includes(q))
            );
        }
    );

    APP.render();
};
APP.reset = () => {
    ["fMonth", "fPartner", "fStatus", "fPriority", "fRegion", "search"].forEach(
        (x) => (APP.g(x).value = ""),
    );

    APP.g("mAll").checked = true;
    document
        .querySelectorAll(".mchk")
        .forEach(c => c.checked = false);

    APP.apply();
};
APP.bindMonthFilter = () => {

    const all =
        document.getElementById("mAll");

    const checks =
        document.querySelectorAll(".mchk");

    all.onchange = () => {
        all.checked = true;

        checks.forEach(
            c => c.checked = false
        );

        APP.apply();
    };

    checks.forEach(c => {

        c.onchange = () => {

            all.checked =
                ![...checks].some(x => x.checked);

            APP.apply();
        };
    });
};
