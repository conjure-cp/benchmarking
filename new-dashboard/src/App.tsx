import { useDeferredValue, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { BenchmarkCharts } from "./components/BenchmarkCharts";
import { FilterBody } from "./components/FilterBody";
import { ResultTable } from "./components/ResultTable";
import { exportBenchmarkCSV, fetchCSVFile } from "./helper/data/fetchCSVFile";
import { parseBenchmarkFile } from "./helper/data/parseBenchmarkFile";
import {
  COLUMNS, compareBaseline, formatTime, matchesRule, orderResults, summarize,
  type ColumnKey, type FilterRule, type SortState, type TimeField, type Unit,
} from "./lib/benchmark";
import type { SolveResult } from "./types/SolveResult";
import "./dashboard.css";

const DEFAULT_COLUMNS: ColumnKey[] = COLUMNS.filter(({ key }) => ["name", "heuristic", "total_time", "resolved_rule_sets", "parsing_input_model", "rewriting_model", "building_solver_model", "running_solver"].includes(key)).map(({ key }) => key);
const EMPTY_ROWS: SolveResult[] = [];
const PAGE_SIZES = [8, 16, 32, 64];

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatCount(value: number) { return value.toLocaleString("en-GB"); }

export default function App() {
  const { data: defaultRows, isLoading, error: fetchError } = useQuery({
    queryKey: ["benchmark-csv", "/output.csv"],
    queryFn: () => fetchCSVFile("/output.csv"),
    staleTime: Infinity,
  });
  const [uploaded, setUploaded] = useState<{ rows: SolveResult[]; name: string } | null>(null);
  const [baseline, setBaseline] = useState<{ rows: SolveResult[]; name: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [heuristic, setHeuristic] = useState("all");
  const [tool, setTool] = useState("all");
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: null, order: "asc" });
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [chartCount, setChartCount] = useState(8);
  const [metric, setMetric] = useState<TimeField>("total_time");
  const [unit, setUnit] = useState<Unit>("s");
  const [scale, setScale] = useState<"linear" | "log">("linear");
  const [selected, setSelected] = useState<Set<SolveResult>>(new Set());
  const fileInput = useRef<HTMLInputElement>(null);
  const baselineInput = useRef<HTMLInputElement>(null);
  const rows = uploaded?.rows ?? defaultRows ?? EMPTY_ROWS;
  const sourceName = uploaded?.name ?? "output.csv";
  const availableHeuristics = useMemo(() => [...new Set(rows.map((row) => row.heuristic).filter(Boolean))].sort(), [rows]);
  const availableTools = useMemo(() => [...new Set(rows.map((row) => row.tool).filter((name): name is string => Boolean(name)))].sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    const matching = rows.filter((row) =>
      (!needle || row.name.toLowerCase().includes(needle)) &&
      (heuristic === "all" || row.heuristic === heuristic) &&
      (tool === "all" || row.tool === tool) &&
      rules.every((rule) => matchesRule(row, rule)),
    );
    return orderResults(matching, sort);
  }, [rows, deferredSearch, heuristic, tool, rules, sort]);

  const summary = useMemo(() => summarize(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(firstIndex, firstIndex + pageSize);
  const chartRows = pageRows.slice(0, chartCount);
  const deltaByRow = useMemo(() => baseline ? new Map(compareBaseline(rows, baseline.rows).map(({ row, delta }) => [row, delta])) : undefined, [rows, baseline]);
  const regressionCount = useMemo(() => deltaByRow ? filtered.filter((row) => (deltaByRow.get(row) ?? 0) > 5).length : 0, [deltaByRow, filtered]);

  function resetPage() { setPage(1); setSelected(new Set()); }
  function changeSort(key: ColumnKey) {
    setSort((previous) => previous.key === key ? { key, order: previous.order === "asc" ? "desc" : "asc" } : { key, order: key === "name" || key === "heuristic" ? "asc" : "desc" });
    resetPage();
  }
  async function handleFile(event: ChangeEvent<HTMLInputElement>, kind: "current" | "baseline") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = parseBenchmarkFile(file.name, await file.text());
      if (kind === "baseline") setBaseline({ rows: parsed, name: file.name });
      else {
        setUploaded({ rows: parsed, name: file.name });
        setHeuristic("all"); setTool("all"); setRules([]); setSearch(""); setSort({ key: null, order: "asc" });
        setVisibleColumns(parsed.some((row) => row.status) ? [...DEFAULT_COLUMNS, "status"] : DEFAULT_COLUMNS);
        resetPage();
      }
      setMessage(`${kind === "baseline" ? "Baseline" : "Dataset"} loaded: ${formatCount(parsed.length)} benchmarks from ${file.name}.`);
    } catch (e) {
      setMessage(`Unable to import ${file.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  function exportRows() {
    const output = selected.size ? filtered.filter((row) => selected.has(row)) : filtered;
    if (!output.length) { setMessage("There are no rows to export."); return; }
    downloadText("benchmark-results.csv", exportBenchmarkCSV(output, visibleColumns), "text/csv;charset=utf-8");
    setMessage(`Exported ${formatCount(output.length)} ${selected.size ? "selected" : "filtered"} benchmarks.`);
  }
  function selectColumn(key: ColumnKey) {
    if (key === "name") return;
    setVisibleColumns((previous) => previous.includes(key) ? previous.filter((entry) => entry !== key) : COLUMNS.map(({ key: candidate }) => candidate).filter((candidate) => previous.includes(candidate) || candidate === key));
  }
  function resetFilters() { setHeuristic("all"); setTool("all"); setRules([]); setSearch(""); resetPage(); }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left"><div className="brand-mark" aria-hidden="true"><span /> <span /> <span /></div><span className="brand-name">ESSENCE <strong>BENCHMARKS</strong></span><span className="top-divider" /><span className="workspace-pill">PAGE <strong>Benchmark explorer</strong></span></div>
        <span className="topbar-caption">Performance workspace</span>
      </header>
      <main className="workspace">
        <section className="page-heading">
          <div><p className="eyebrow">BENCHMARK ANALYSIS / OVERVIEW</p><h1>Benchmark explorer</h1><p className="page-subtitle">Explore execution timings, compare runs, and identify performance bottlenecks.</p></div>
          <div className="header-actions">
            <input ref={fileInput} type="file" accept=".csv,.json,text/csv,application/json" hidden onChange={(e) => void handleFile(e, "current")} />
            <input ref={baselineInput} type="file" accept=".csv,.json,text/csv,application/json" hidden onChange={(e) => void handleFile(e, "baseline")} />
            <button className="button button-secondary" onClick={() => baselineInput.current?.click()}>⇄ Compare baseline</button>
            <button className="button button-secondary" onClick={exportRows}>↓ Export results</button>
            <button className="button button-primary" onClick={() => fileInput.current?.click()}>↑ Import CSV / JSON</button>
          </div>
        </section>
        <div className="dataset-meta"><span className="file-chip"><span>{sourceName.toLowerCase().endsWith(".json") ? "JSON" : "CSV"}</span> {sourceName}</span><span>{formatCount(rows.length)} benchmark runs</span><span>·</span><span>{COLUMNS.length} available columns</span><span>·</span><span>{sourceName.toLowerCase().endsWith(".json") ? "Rust runner output" : "Catalogue timing data"}</span>{baseline && <><span>·</span><button className="baseline-chip" onClick={() => setBaseline(null)} title="Remove baseline">Baseline: {baseline.name} ×</button></>}</div>
        {message && <div className="notice" role="status"><span>{message}</span><button aria-label="Dismiss message" onClick={() => setMessage(null)}>×</button></div>}
        {isLoading && !uploaded && <section className="loading" role="status"><span className="spinner" />Loading benchmark data…</section>}
        {fetchError && !uploaded && <section className="notice error" role="alert">Failed to load the bundled CSV: {fetchError instanceof Error ? fetchError.message : "Unknown error"}. You can import CSV or runner JSON instead.</section>}

        {(rows.length > 0) && <>
          <section className="stats-grid" aria-label="Benchmark overview">
            <article className="stat-card"><span>Filtered benchmarks</span><strong>{formatCount(summary.total)}</strong><small>of {formatCount(rows.length)} total</small></article>
            <article className="stat-card"><span>Median total runtime</span><strong>{formatTime(summary.median, unit)} <em>{unit}</em></strong><small>{formatCount(summary.withTiming)} measured runs</small></article>
            <article className="stat-card"><span>Longest total runtime</span><strong>{formatTime(summary.slowest?.total_time, unit)} <em>{unit}</em></strong><small title={summary.slowest?.name}>{summary.slowest?.name ?? "No measured runs"}</small></article>
            <article className="stat-card"><span>{baseline ? "Regressions vs baseline" : "Complete phase breakdowns"}</span><strong>{formatCount(baseline ? regressionCount : summary.complete)}</strong><small>{baseline ? "Comparable runs slower by more than 5%" : "Rows with all five stages recorded"}</small></article>
          </section>

          <section className="panel results-panel">
            <div className="panel-title-row"><div className="section-title"><h2>Results</h2><span>{formatCount(filtered.length)} benchmarks</span></div><div className="action-row"><details className="column-picker"><summary className="button button-secondary">Columns {visibleColumns.length}/{COLUMNS.length} ▾</summary><div className="column-menu">{COLUMNS.map((column) => <label key={column.key}><input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={column.key === "name"} onChange={() => selectColumn(column.key)} />{column.label}</label>)}</div></details><button className="button button-secondary" onClick={exportRows}>↓ Download CSV</button></div></div>
            <div className="table-toolbar">
              <div className="table-toolbar-group">
                <label className="search-input"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search benchmark name…" aria-label="Search benchmark name" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} /></label>
                <label className="inline-label">Heuristic<select value={heuristic} onChange={(e) => { setHeuristic(e.target.value); resetPage(); }}><option value="all">All heuristics</option>{availableHeuristics.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                {availableTools.length > 0 && <label className="inline-label">Executable<select value={tool} onChange={(e) => { setTool(e.target.value); resetPage(); }}><option value="all">All executables</option>{availableTools.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
                <button className={`button button-secondary ${rules.length ? "active-filter" : ""}`} onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen}>⚑ Time filters {rules.length ? `(${rules.length})` : ""}</button>
                {(search || heuristic !== "all" || tool !== "all" || rules.length > 0) && <button className="text-button" onClick={resetFilters}>Clear all</button>}
              </div>
              <div className="table-toolbar-group"><label className="inline-label">Rows per page<select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>{PAGE_SIZES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
            </div>
            {filterOpen && <FilterBody rules={rules} onChange={(next) => { setRules(next); resetPage(); }} />}
            <ResultTable rows={pageRows} columns={visibleColumns} unit={unit} sort={sort} onSort={changeSort} selected={selected} onSelected={setSelected} deltaByRow={deltaByRow} />
            <div className="table-footer"><span>{filtered.length ? `${formatCount(firstIndex + 1)}–${formatCount(Math.min(firstIndex + pageSize, filtered.length))}` : "0"} of {formatCount(filtered.length)} benchmarks <span className="muted">· {selected.size ? `${formatCount(selected.size)} selected` : "Original input order unless sorted"}</span></span><nav className="pagination" aria-label="Results pagination"><button disabled={currentPage === 1} aria-label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button><span>Page {formatCount(currentPage)} / {formatCount(totalPages)}</span><button disabled={currentPage === totalPages} aria-label="Next page" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button></nav></div>
          </section>

          <section className="analysis-heading"><div className="section-title"><h2>Visual analysis</h2><p>Charts show the first {Math.min(chartCount, pageRows.length)} visible rows on this page.</p></div><div className="analysis-controls"><label>Rows <select value={chartCount} onChange={(e) => setChartCount(Number(e.target.value))}><option value={4}>4</option><option value={8}>8</option><option value={12}>12</option><option value={16}>16</option></select></label><label>Scale <select value={scale} onChange={(e) => setScale(e.target.value as "linear" | "log")}><option value="linear">Linear</option><option value="log">Logarithmic</option></select></label><label>Unit <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}><option value="s">Seconds</option><option value="ms">Milliseconds</option></select></label><span className="sync-indicator">● Synced with table</span></div></section>
          <BenchmarkCharts rows={chartRows} metric={metric} onMetric={setMetric} unit={unit} scale={scale} />
          <p className="bottom-note">Import catalogue CSV or Rust runner JSON (out.json). Parameterised runner results expand into one row per parameter file. Missing timing values are shown as — rather than interpreted as zero. Baselines compare name, parameters, heuristic, executable and command arguments; use comparable hardware and execution settings.</p>
        </>}
      </main>
    </div>
  );
}
