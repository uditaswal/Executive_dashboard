APP.fill = (id, vals) => {
    const e = APP.g(id),
        f = e.options[0].outerHTML;
    e.innerHTML = f;
    vals.forEach((v) => (e.innerHTML += `<option>${v}</option>`));
};

APP.filterValues = (id) => {
    const el = APP.g(id);

    if (!el) return [];

    return [...el.selectedOptions]
        .map(option => option.value)
        .filter(Boolean);
};

APP.matchesFilter = (id, value) => {
    const selected =
        APP.filterValues(id);

    return !selected.length ||
        selected.includes(String(value ?? ""));
};

APP.populate = () => {
    APP.fill("fMonth", APP.u(APP.RAW.map((x) => x.Month)));
    APP.fill("fPartner", APP.u(APP.RAW.map((x) => x.Partner)));
    APP.fill("fStatus", APP.u(APP.RAW.map((x) => x.Status)));
    APP.fill("fPriority", APP.u(APP.RAW.map((x) => x.PRIORITY)));
    APP.fill("fRegion", APP.u(APP.RAW.map((x) => x.Region)));
    APP.fill("fCountry", APP.u(APP.RAW.map((x) => x["Receive Country"])));
    APP.fill("fOwner", APP.u(APP.RAW.map((x) => APP.issueOwner(x))));
    APP.fill("fCategory", APP.u(APP.RAW.map((x) => x["Issue Category"] || x["issue category"] || x["Issue subcategory"])));
    APP.fill("fImpact", APP.u(APP.RAW.map((x) => x["Impact type"])));
};
APP.apply = () => {
    const q = APP.g("search").value.toLowerCase();

    APP.DATA = APP.RAW.filter(
        (r) => {
            return (
                APP.matchesFilter("fMonth", r.Month) &&
                APP.matchesFilter("fPartner", r.Partner) &&
                APP.matchesFilter("fStatus", r.Status) &&
                APP.matchesFilter("fPriority", r.PRIORITY) &&
                APP.matchesFilter("fRegion", r.Region) &&
                APP.matchesFilter("fCountry", r["Receive Country"]) &&
                APP.matchesFilter("fOwner", APP.issueOwner(r)) &&
                APP.matchesFilter("fCategory", r["Issue Category"] || r["issue category"] || r["Issue subcategory"]) &&
                APP.matchesFilter("fImpact", r["Impact type"]) &&
                (!q || JSON.stringify(r).toLowerCase().includes(q))
            );
        }
    );

    APP.render();
};
APP.reset = () => {
    ["fMonth", "fPartner", "fStatus", "fPriority", "fRegion", "fCountry", "fOwner", "fCategory", "fImpact"].forEach(
        (x) => {
            const el = APP.g(x);

            if (el) {
                [...el.options].forEach(option => option.selected = false);
            }
        },
    );

    if (APP.g("search")) {
        APP.g("search").value = "";
    }

    APP.apply();
};
