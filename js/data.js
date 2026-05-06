window.APP = {
    RAW: [],
    DATA: [],
    charts: {},
    // multi-sheet data
    SHEETS: {},
    CONFIG: [],
    SUGGESTIONS: [],
    REROUTE: [],
    VOLUME: [],
    PIVOT: null,
    showChartLabels: false
};
APP.g = (id) => document.getElementById(id);
APP.u = (arr) => [
    ...new Set(arr.filter(Boolean))
];
APP.n = (val) => Number(val) || 0;
APP.normalizeKey = (value) =>
    String(value ?? "")
        .replace(/_x000d_/gi, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
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
APP.getSheet = (nameOrNames) => {
    const names =
        Array.isArray(nameOrNames)
            ? nameOrNames
            : [nameOrNames];
    const normalized =
        names.map(APP.normalizeKey);

    return Object.entries(APP.SHEETS).find(
        ([name]) =>
            normalized.includes(
                APP.normalizeKey(name)
            )
    )?.[1] || [];
};
APP.sheetHasColumns = (rows, columns) => {
    if (!rows.length) return false;

    const normalizedColumns =
        columns.map(APP.normalizeKey);
    const rowKeys =
        Object.keys(rows[0]).map(
            APP.normalizeKey
        );

    return columns.every(
        (_, index) =>
            rowKeys.includes(
                normalizedColumns[index]
            )
    );
};
APP.findSheetByColumns = (columns) =>
    Object.values(APP.SHEETS).find(
        rows => APP.sheetHasColumns(rows, columns)
    ) || [];
APP.findColumnName = (
    rowOrRows,
    keys
) => {
    const row =
        Array.isArray(rowOrRows)
            ? rowOrRows[0]
            : rowOrRows;

    if (!row) return "";

    const list =
        Array.isArray(keys)
            ? keys
            : [keys];

    for (const key of list) {
        if (
            Object.prototype.hasOwnProperty.call(
                row,
                key
            )
        ) {
            return key;
        }
    }

    const normalizedKeys =
        list.map(APP.normalizeKey);

    return Object.keys(row).find(
        key =>
            normalizedKeys.includes(
                APP.normalizeKey(key)
            )
    ) || "";
};
APP.getValue = (row, keys) => {
    const column =
        APP.findColumnName(row, keys);

    return column ? row[column] : "";
};
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
        APP.getSheet("DATA") ||
        APP.SHEETS[wb.SheetNames[0]] ||
        [];
    APP.CONFIG =
        APP.getSheet(["CONFIG", "Config"]) ||
        [];
    APP.SUGGESTIONS =
        APP.getSheet("SUGGESTIONS") ||
        [];
    APP.REROUTE =
        APP.sheetHasColumns(
            APP.getSheet("REROUTE") || [],
            ["TXN_COUNT", "SENDAMOUNTINUSD"]
        )
            ? APP.getSheet("REROUTE")
            : APP.findSheetByColumns(
                ["TXN_COUNT", "SENDAMOUNTINUSD"]
            );
    APP.VOLUME =
        APP.sheetHasColumns(
            APP.getSheet("APN_VOLUME") || [],
            ["CREATED_DATE", "COUNT(*)"]
        )
            ? APP.getSheet("APN_VOLUME")
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
        cfg[APP.getValue(row, "key")] =
            APP.getValue(row, "value");
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
            `data/payments_incident_sample.xlsx?v=${Date.now()}`,
            {
                cache: "no-store"
            }
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
                APP.n(
                    APP.getValue(row, "TXN_COUNT")
                ),
            0
        );
    const usd =
        APP.REROUTE.reduce(
            (sum, row) =>
                sum +
                APP.n(
                    APP.getValue(
                        row,
                        "SENDAMOUNTINUSD"
                    )
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
                    APP.getValue(
                        row,
                        "COUNT(*)"
                    )
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
