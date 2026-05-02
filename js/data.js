window.APP = {
    RAW: [],
    DATA: [],
    charts: {},
    // multi-sheet data
    SHEETS: {},
    CONFIG: [],
    SUGGESTIONS: [],
    REROUTE: [],
    VOLUME: []
};
APP.g = (id) => document.getElementById(id);
APP.u = (arr) => [
    ...new Set(arr.filter(Boolean))
];
APP.n = (val) => Number(val) || 0;
APP.cleanExcelText = (val) =>
    typeof val === "string"
        ? val.replace(/_x000d_/gi, "").trim()
        : val;
APP.cleanExcelRow = (row) => {
    const clean = {};

    Object.entries(row).forEach(([key, value]) => {
        clean[APP.cleanExcelText(key)] =
            APP.cleanExcelText(value);
    });

    return clean;
};
APP.sheetHasColumns = (rows, columns) => {
    if (!rows.length) return false;

    return columns.every(
        column =>
            Object.prototype.hasOwnProperty.call(
                rows[0],
                column
            )
    );
};
APP.findSheetByColumns = (columns) =>
    Object.values(APP.SHEETS).find(
        rows => APP.sheetHasColumns(rows, columns)
    ) || [];
APP.parse = (buffer) => {
    const wb = XLSX.read(buffer, {
        type: "array"
    });
    APP.SHEETS = {};
    wb.SheetNames.forEach((name) => {
        APP.SHEETS[name] =
            XLSX.utils.sheet_to_json(
                wb.Sheets[name],
                { defval: "" }
            ).map(APP.cleanExcelRow);
    });
    APP.RAW =
        APP.SHEETS["DATA"] ||
        APP.SHEETS[wb.SheetNames[0]] ||
        [];
    APP.CONFIG =
        APP.SHEETS["CONFIG"] ||
        APP.SHEETS["Config"] ||
        [];
    APP.SUGGESTIONS =
        APP.SHEETS["SUGGESTIONS"] ||
        [];
    APP.REROUTE =
        APP.sheetHasColumns(
            APP.SHEETS["REROUTE"] || [],
            ["TXN_COUNT", "SENDAMOUNTINUSD"]
        )
            ? APP.SHEETS["REROUTE"]
            : APP.findSheetByColumns(
                ["TXN_COUNT", "SENDAMOUNTINUSD"]
            );
    APP.VOLUME =
        APP.sheetHasColumns(
            APP.SHEETS["APN_VOLUME"] || [],
            ["CREATED_DATE", "COUNT(*)"]
        )
            ? APP.SHEETS["APN_VOLUME"]
            : APP.findSheetByColumns(
                ["CREATED_DATE", "COUNT(*)"]
            );
    APP.applyConfig();
    APP.populate();
    APP.apply();
};
APP.applyConfig = () => {
    if (!APP.CONFIG.length) return;
    const cfg = {};
    APP.CONFIG.forEach((row) => {
        cfg[row.key] = row.value;
    });
    if (cfg.title) {
        const el = APP.g("title");
        if (el) el.textContent = cfg.title;
    }
    if (cfg.theme_color) {
        document.documentElement.style.setProperty(
            "--primary",
            cfg.theme_color
        );
    }
    APP.SETTINGS = cfg;
};
APP.loadLocal = async () => {
    try {
        const res = await fetch(
            "data/payments_incident_sample.xlsx"
        );
        if (!res.ok) {
            throw new Error("File not found");
        }
        const buf =
            await res.arrayBuffer();
        APP.parse(buf);
    } catch (err) {
        console.warn(
            "Local Excel file not found."
        );
    }
};
APP.bindUpload = () => {
    const fileInput =
        APP.g("fileInput");
    if (!fileInput) return;
    fileInput.addEventListener(
        "change",
        async (e) => {
            const file =
                e.target.files[0];
            if (!file) return;
            const buf =
                await file.arrayBuffer();
            APP.parse(buf);
        }
    );
};
APP.getRerouteMetrics = () => {
    const txnCount =
        APP.REROUTE.reduce(
            (sum, row) =>
                sum +
                APP.n(row.TXN_COUNT),
            0
        );
    const usd =
        APP.REROUTE.reduce(
            (sum, row) =>
                sum +
                APP.n(
                    row.SENDAMOUNTINUSD
                ),
            0
        );
    return {
        txnCount,
        usd
    };
};
APP.getVolumeMetrics = () => {
    const total =
        APP.VOLUME.reduce(
            (sum, row) =>
                sum +
                APP.n(
                    row["COUNT(*)"]
                ),
            0
        );
    const avg =
        APP.VOLUME.length
            ? Math.round(
                total /
                APP.VOLUME.length
            )
            : 0;
    return {
        total,
        avg
    };
};
APP.initData = () => {
    APP.bindUpload();
    APP.loadLocal();
};
