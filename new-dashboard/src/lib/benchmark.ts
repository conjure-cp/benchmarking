import type { SolveResult } from "../types/SolveResult";

export const TIME_FIELDS = [
  { key: "total_time", label: "Total time", shortLabel: "Total" },
  { key: "resolved_rule_sets", label: "Resolve rules", shortLabel: "Resolve" },
  { key: "parsing_input_model", label: "Parse input", shortLabel: "Parsing" },
  { key: "rewriting_model", label: "Rewrite model", shortLabel: "Rewriting" },
  { key: "building_solver_model", label: "Build solver model", shortLabel: "Building" },
  { key: "running_solver", label: "Run solver", shortLabel: "Solver" },
] as const;
export type TimeField = (typeof TIME_FIELDS)[number]["key"];
export type ColumnKey = TimeField | "name" | "heuristic" | "tool" | "tool_family" | "parameters" | "args" | "status";
export const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Benchmark name" },
  ...TIME_FIELDS.map((metric) => ({ key: metric.key, label: metric.label })),
  { key: "heuristic", label: "Heuristic" },
  { key: "tool_family", label: "Tool family" },
  { key: "tool", label: "Executable" },
  { key: "parameters", label: "Parameter file" },
  { key: "args", label: "Arguments" },
  { key: "status", label: "Runner report" },
];
export const STAGES = TIME_FIELDS.filter((entry) => entry.key !== "total_time");
export const STAGE_COLORS: Record<string, string> = {
  resolved_rule_sets: "#96a5b9",
  parsing_input_model: "#70a9bd",
  rewriting_model: "#e4ba71",
  building_solver_model: "#438f9e",
  running_solver: "#07866f",
};
export type Unit = "s" | "ms";
export type SortOrder = "asc" | "desc";
export type SortState = { key: ColumnKey | null; order: SortOrder };
export type FilterOperation = "lt" | "gt" | "eq";
export type FilterRule = { id: string; property: TimeField; operation: FilterOperation; value: number | null };

export function isMeasured(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function formatTime(value: number | null | undefined, unit: Unit = "s"): string {
  if (!isMeasured(value)) return "—";
  const scaled = unit === "ms" ? value * 1000 : value;
  if (scaled === 0) return "0";
  if (scaled < 0.001) return scaled.toPrecision(3);
  if (scaled < 1) return scaled.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return scaled.toLocaleString("en-GB", { maximumFractionDigits: 3 });
}

export function matchesRule(item: SolveResult, rule: FilterRule): boolean {
  if (rule.value === null || !Number.isFinite(rule.value)) return true;
  const actual = item[rule.property];
  if (!isMeasured(actual)) return false;
  switch (rule.operation) {
    case "lt": return actual < rule.value;
    case "gt": return actual > rule.value;
    case "eq": return Math.abs(actual - rule.value) < 1e-9;
  }
}

export function orderResults(data: SolveResult[], sort: SortState): SolveResult[] {
  if (!sort.key) return data;
  const { key, order } = sort;
  const direction = order === "asc" ? 1 : -1;
  return [...data].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return direction * (av - bv);
    return direction * String(av).localeCompare(String(bv), undefined, { numeric: true });
  });
}

export function medianOf(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarize(data: SolveResult[]) {
  const times = data.map((row) => row.total_time).filter(isMeasured);
  const complete = data.filter((row) => STAGES.every((s) => isMeasured(row[s.key]))).length;
  const slowest = data.reduce<SolveResult | null>((best, row) => {
    if (!isMeasured(row.total_time)) return best;
    if (!best || !isMeasured(best.total_time) || row.total_time > best.total_time) return row;
    return best;
  }, null);
  return { total: data.length, withTiming: times.length, median: medianOf(times), slowest, complete };
}

export function benchmarkIdentity(row: SolveResult): string {
  return [row.name, row.parameters ?? "", row.heuristic, row.tool_family || row.tool || "", row.args ?? ""].join("\u0000");
}

/** Match comparable problem, parameter, tool and command configurations; aggregate repeats by median. */
export function compareBaseline(current: SolveResult[], baseline: SolveResult[]) {
  const before = new Map<string, number[]>();
  for (const row of baseline) {
    if (!isMeasured(row.total_time)) continue;
    const key = benchmarkIdentity(row);
    const values = before.get(key) ?? [];
    values.push(row.total_time);
    before.set(key, values);
  }
  const medians = new Map([...before].map(([key, values]) => [key, medianOf(values)!]));
  return current.map((row) => {
    const previous = medians.get(benchmarkIdentity(row)) ?? null;
    const delta = previous !== null && previous > 0 && isMeasured(row.total_time)
      ? ((row.total_time - previous) / previous) * 100
      : null;
    return { row, previous, delta };
  });
}
