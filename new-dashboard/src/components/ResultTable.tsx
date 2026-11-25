import type { SolveResult } from "../types/SolveResult";
import { COLUMNS, formatTime, type ColumnKey, type SortState, type Unit, TIME_FIELDS, isMeasured } from "../lib/benchmark";

interface Props {
  rows: SolveResult[];
  columns: ColumnKey[];
  unit: Unit;
  sort: SortState;
  onSort: (key: ColumnKey) => void;
  selected: Set<SolveResult>;
  onSelected: (selection: Set<SolveResult>) => void;
  deltaByRow?: Map<SolveResult, number | null>;
}

export function ResultTable({ rows, columns, unit, sort, onSort, selected, onSelected, deltaByRow }: Props) {
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row));
  const timeKeys = new Set<string>(TIME_FIELDS.map(({ key }) => key));
  const togglePage = () => {
    const next = new Set(selected);
    rows.forEach((row) => allSelected ? next.delete(row) : next.add(row));
    onSelected(next);
  };
  const toggleRow = (row: SolveResult) => {
    const next = new Set(selected);
    if (next.has(row)) next.delete(row);
    else next.add(row);
    onSelected(next);
  };

  return (
    <div className="table-overflow" role="region" aria-label="Benchmark results table" tabIndex={0}>
      <table className="results-table">
        <thead>
          <tr>
            <th className="select-column"><input type="checkbox" aria-label="Select all rows on this page" checked={allSelected} onChange={togglePage} /></th>
            {columns.map((key) => {
              const col = COLUMNS.find((column) => column.key === key)!;
              return (
                <th key={key} aria-sort={sort.key === key ? (sort.order === "asc" ? "ascending" : "descending") : "none"}>
                  <button className={`sort-button ${sort.key === key ? "sorted" : ""}`} onClick={() => onSort(key)}>
                    {col.label}
                    <span aria-hidden="true">{sort.key === key ? (sort.order === "asc" ? " ↑" : " ↓") : " ↕"}</span>
                  </button>
                </th>
              );
            })}
            {deltaByRow && <th>Vs baseline</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td className="table-empty" colSpan={columns.length + 2 + (deltaByRow ? 1 : 0)}>No benchmarks match your filters. Try clearing the search or changing the conditions.</td></tr>}
          {rows.map((row, index) => {
            const delta = deltaByRow?.get(row) ?? null;
            return (
              <tr key={`${row.name}-${row.heuristic}-${index}`} className={selected.has(row) ? "selected-row" : ""}>
                <td className="select-column"><input type="checkbox" aria-label={`Select ${row.name}`} checked={selected.has(row)} onChange={() => toggleRow(row)} /></td>
                {columns.map((key) => (
                  <td key={key} className={key === "name" ? "name-cell" : timeKeys.has(key) ? "numeric-cell" : ""} title={key === "name" ? row.name : undefined}>
                    {key === "name" ? <>
                      <span>{row.name}</span>
                      {(row.source === "runner-json" || (row.sections && row.sections.length > 0) || (row.source_fields && row.source_fields.length > 0)) && <details className="run-detail">
                        <summary>Execution details</summary>
                        <div className="detail-content">
                          {row.tool && <div>Tool: {row.tool}</div>}
                          {row.args && <div>Arguments: {row.args}</div>}
                          {row.parameters && <div>Parameter: {row.parameters}</div>}
                          {row.found_sols !== null && row.found_sols !== undefined && <div>Solutions reported: {row.found_sols ? "yes" : "no"}</div>}
                          {row.status && <div>Status: {row.status}</div>}
                          {row.sections && row.sections.length > 0 && <>
                            <strong>Timing sections</strong>
                            {row.sections.map((section, i) => <div key={i}>{section.name}: {formatTime(section.time, unit)} {unit}</div>)}
                          </>}
                          {row.source_fields && row.source_fields.length > 0 && <>
                            <strong>Additional catalogue measurements</strong>
                            {row.source_fields.map((field, i) => <div key={i}>{field.name}: {field.value}</div>)}
                          </>}
                        </div>
                      </details>}
                    </> : timeKeys.has(key) ?
                      <span className={key === "total_time" && isMeasured(row.total_time) ? "highlight-time" : ""}>{formatTime(row[key as keyof typeof row] as number | null, unit)}</span> :
                      (row[key] || "—")}
                  </td>
                ))}
                {deltaByRow && <td className="numeric-cell">{delta === null ? <span className="muted">—</span> : <span className={`delta ${delta > 5 ? "regression" : delta < -5 ? "improvement" : "neutral"}`}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}%</span>}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
