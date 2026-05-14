window.PivotEngine = (() => {
    const groupCount = (
        rows,
        field
    ) =>
        rows.reduce((map, row) => {
            const label =
                APP.rowValue(row, field) || "Unknown";
            map[label] =
                (map[label] || 0) + 1;
            return map;
        }, {});

    const groupedEntries = ({
        rows,
        field,
        topN
    }) =>
        Object.entries(
            groupCount(rows, field)
        )
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN || Number.MAX_SAFE_INTEGER);

    const monthlyCounts = ({
        rows,
        field
    }) => {
        const months =
            APP.monthOrder.filter((month) =>
                rows.some((row) =>
                    APP.rowValue(row, field) === month
                )
            );
        const map =
            groupCount(rows, field);

        return {
            labels: months,
            values: months.map((month) => map[month] || 0)
        };
    };

    return {
        groupCount,
        groupedEntries,
        monthlyCounts
    };
})();
