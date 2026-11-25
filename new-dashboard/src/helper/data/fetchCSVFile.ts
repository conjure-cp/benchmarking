import Papa from "papaparse";
import type { SolveResult } from "../../types/SolveResult";
import { TIME_FIELDS, type ColumnKey } from "../../lib/benchmark.ts";

const REQUIRED_HEADERS = ["name", "total_time"];
const KNOWN_FIELDS = new Set([
  ...REQUIRED_HEADERS, ...TIME_FIELDS.map(({ key }) => key),
  "heuristic", "tool", "tool_family", "parameters", "params", "args", "status", "found_sols",
  "savile_row", "savile_row_total_time", "solver", "solver_total_time",
]);

function headerKey(text: string): string {
  return text.trim().replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().replace(/[\s-]+/g, "_");
}
function numeric(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Parse the catalogue timing CSV, preserving absent measurements as null. */
export function parseBenchmarkCSV(text: string): SolveResult[] {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: headerKey,
  });
  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing required CSV columns: ${missing.join(", ")}`);
  if (parsed.errors.length) {
    const error = parsed.errors[0];
    throw new Error(`Invalid CSV at row ${(error.row ?? 0) + 1}: ${error.message}`);
  }
  const rows = parsed.data.filter((row) => row.name?.trim());
  if (!rows.length) throw new Error("The CSV contains no benchmark rows.");
  return rows.map((row) => {
    const metrics = Object.fromEntries(TIME_FIELDS.map(({ key }) => [key, numeric(row[key])]));
    // Catalogue runs can contain Savile Row and solver measurements instead
    // of the five Oxide phase columns. The time for Savile Row is NOT guessed
    // into "building solver model"; the original measurement remains visible.
    const savileTime = numeric(row.savile_row_total_time ?? row.savile_row);
    const solverTime = numeric(row.solver_total_time ?? row.solver);
    if (metrics.running_solver === null && solverTime !== null) metrics.running_solver = solverTime;
    const sections = [
      ...(savileTime !== null ? [{ name: "Savile Row", time: savileTime }] : []),
      ...(solverTime !== null ? [{ name: "Solver", time: solverTime }] : []),
    ];
    const source_fields = Object.entries(row)
      .filter(([key, value]) => !KNOWN_FIELDS.has(key) && value?.trim())
      .map(([name, value]) => ({ name, value }));
    const detectedConjure = "savile_row_total_time" in row || "savile_row" in row;
    return {
      ...metrics,
      name: row.name.trim(),
      heuristic: (row.heuristic ?? "").trim(),
      parameters: (row.parameters ?? row.params ?? "").trim(),
      tool: (row.tool ?? "").trim(),
      tool_family: (row.tool_family ?? "").trim() ||
        (["conjure-oxide", "conjure"].includes((row.tool ?? "").trim()) ? (row.tool ?? "").trim() :
          detectedConjure ? "conjure" : ""),
      args: (row.args ?? "").trim(),
      status: (row.status ?? "").trim(),
      found_sols: row.found_sols === "true" ? true : row.found_sols === "false" ? false : null,
      source: "csv",
      ...(sections.length ? { sections } : {}),
      ...(source_fields.length ? { source_fields } : {}),
    } as SolveResult;
  });
}

export async function fetchCSVFile(filename = "/output.csv"): Promise<SolveResult[]> {
  const response = await fetch(filename);
  if (!response.ok) throw new Error(`CSV fetch failed (${response.status})`);
  return parseBenchmarkCSV(await response.text());
}

/** Spreadsheet-safe CSV export that retains the selected columns and original time units. */
export function exportBenchmarkCSV(rows: SolveResult[], columns: ColumnKey[]): string {
  // Always retain the join keys and required CSV fields, even if hidden in the UI.
  // Otherwise an exported CSV could not be re-imported or compared reliably.
  const essential: ColumnKey[] = ["name", "total_time", "heuristic", "tool", "tool_family", "parameters", "args", "status"];
  const fields = [...new Set([...essential, ...columns])];
  return Papa.unparse({
    fields,
    data: rows.map((row) => fields.map((key) => row[key] ?? "")),
  }, { escapeFormulae: true });
}
