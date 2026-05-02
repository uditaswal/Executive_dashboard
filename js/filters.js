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
    APP.fill("fCountry", APP.u(APP.RAW.map((x) => x["Receive Country"])));
    APP.fill("fOwner", APP.u(APP.RAW.map((x) => APP.issueOwner(x))));
    APP.fill("fCategory", APP.u(APP.RAW.map((x) => x["issue category"] || x["Issue subcategory"])));
    APP.fill("fImpact", APP.u(APP.RAW.map((x) => x["Impact type"])));
};
APP.apply = () => {
    const q = APP.g("search").value.toLowerCase();

    APP.DATA = APP.RAW.filter(
        (r) => {
            return (
                (!fMonth.value || r.Month == fMonth.value) &&
                (!fPartner.value || r.Partner == fPartner.value) &&
                (!fStatus.value || r.Status == fStatus.value) &&
                (!fPriority.value || String(r.PRIORITY) == fPriority.value) &&
                (!fRegion.value || r.Region == fRegion.value) &&
                (!fCountry.value || r["Receive Country"] == fCountry.value) &&
                (!fOwner.value || APP.issueOwner(r) == fOwner.value) &&
                (!fCategory.value || (r["issue category"] || r["Issue subcategory"]) == fCategory.value) &&
                (!fImpact.value || r["Impact type"] == fImpact.value) &&
                (!q || JSON.stringify(r).toLowerCase().includes(q))
            );
        }
    );

    APP.render();
};
APP.reset = () => {
    ["fMonth", "fPartner", "fStatus", "fPriority", "fRegion", "fCountry", "fOwner", "fCategory", "fImpact", "search"].forEach(
        (x) => (APP.g(x).value = ""),
    );

    APP.apply();
};
