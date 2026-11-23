const DEFAULT_RANGES = [
  { label: "24H", duration: 24 * 60 * 60 * 1000 },
  { label: "7D", duration: 7 * 24 * 60 * 60 * 1000 },
  { label: "30D", duration: 30 * 24 * 60 * 60 * 1000 },
  { label: "3M", duration: 90 * 24 * 60 * 60 * 1000 },
  { label: "1Y", duration: 365 * 24 * 60 * 60 * 1000 },
  { label: "ALL", duration: Number.POSITIVE_INFINITY },
];

export function getRowsInRange(rows, range) {
  if (range === "ALL" || rows.length === 0) return rows;
  const selectedRange = DEFAULT_RANGES.find((option) => option.label === range);
  const end = new Date(rows[rows.length - 1].captured_at).getTime();
  const start = end - (selectedRange?.duration ?? Number.POSITIVE_INFINITY);
  return rows.filter((row) => new Date(row.captured_at).getTime() >= start);
}

export function ChartTimeRange({ value, onChange, rows, label = "Filter chart by time range" }) {
  const end = rows.length ? new Date(rows[rows.length - 1].captured_at).getTime() : 0;

  return (
    <div className="chart-range-control" role="group" aria-label={label}>
      {DEFAULT_RANGES.map((option) => {
        const available = option.label === "ALL" || rows.filter((row) => new Date(row.captured_at).getTime() >= end - option.duration).length >= 2;
        return (
          <button
            key={option.label}
            type="button"
            className="chart-range-button"
            aria-pressed={value === option.label}
            disabled={!available}
            onClick={() => onChange(option.label)}
            title={available ? `${option.label} history` : "Not enough historical captures for this range"}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChartSeriesToggles({ items, activeKeys, onToggle, label = "Toggle chart series" }) {
  return (
    <div className="chart-series-control" role="group" aria-label={label}>
      {items.map((item) => {
        const active = activeKeys.includes(item.key);
        return (
          <button
            key={item.key}
            type="button"
            className="chart-series-button"
            aria-pressed={active}
            onClick={() => onToggle(item.key)}
            style={{ "--series-color": item.color }}
          >
            <span className="chart-series-swatch" aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
