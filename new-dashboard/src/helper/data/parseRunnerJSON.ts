import type { SolveResult, TimingSection } from "../../types/SolveResult";
import { STAGES } from "../../lib/benchmark.ts";

// The Rust runner serialises Vec<Results> to out.json. Each Results item has a
// configuration and a list of benchmark results, optionally containing param_runs.
type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function nonNegativeTime(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function argumentsFor(result: JsonRecord, config: JsonRecord): string[] {
  const args = result.args;
  if (Array.isArray(args) && args.every((arg) => typeof arg === "string") && args.length) return args;
  const alternatives = config.args;
  if (Array.isArray(alternatives) && alternatives.length === 1 && Array.isArray(alternatives[0])) {
    return alternatives[0].filter((arg): arg is string => typeof arg === "string");
  }
  return [];
}

function heuristicFromArgs(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "-h" || args[i] === "--heuristic") && args[i + 1]) return args[i + 1];
    const matched = /^(?:-h|--heuristic)=(.+)$/.exec(args[i]);
    if (matched) return matched[1];
  }
  return "";
}

const sectionNames = new Map<string, string>(STAGES.map((stage) => [stage.label.toLowerCase(), stage.key]));
sectionNames.set("resolved rule sets", "resolved_rule_sets");
sectionNames.set("parsing input model", "parsing_input_model");
sectionNames.set("rewriting model", "rewriting_model");
sectionNames.set("building solver model", "building_solver_model");
sectionNames.set("running solver", "running_solver");
sectionNames.set("solver", "running_solver");

function readSections(value: unknown): { metrics: Pick<SolveResult, typeof STAGES[number]["key"]>; sections: TimingSection[] } {
  const metrics = {
    resolved_rule_sets: null, parsing_input_model: null,
    rewriting_model: null, building_solver_model: null, running_solver: null,
  } as Pick<SolveResult, typeof STAGES[number]["key"]>;
  const sections: TimingSection[] = [];
  if (!Array.isArray(value)) return { metrics, sections };

  for (const entry of value) {
    const section = asRecord(entry);
    if (!section) continue;
    const name = text(section.name).trim();
    const seconds = nonNegativeTime(section.time);
    if (!name || seconds === null) continue;
    sections.push({ name, time: seconds });
    const key = sectionNames.get(name.toLowerCase());
    if (key) metrics[key as keyof typeof metrics] = (metrics[key as keyof typeof metrics] ?? 0) + seconds;
  }
  return { metrics, sections };
}

/** Convert one original runner measurement, preserving its execution context. */
function toRow(
  problem: JsonRecord, run: JsonRecord, config: JsonRecord,
  parameter: string, total: unknown, stages: unknown, solutions: unknown,
): SolveResult {
  const meta = asRecord(problem.meta) ?? {};
  const args = argumentsFor(run, config);
  const { metrics, sections } = readSections(stages);
  const found = typeof solutions === "boolean" ? solutions : null;
  const elapsed = nonNegativeTime(total);
  return {
    name: text(meta.name) || text(problem.path) || "Unnamed benchmark",
    parameters: parameter,
    heuristic: heuristicFromArgs(args),
    tool: text(config.conjure_path) || (config.oxide === true ? "conjure-oxide" : "conjure"),
    tool_family: config.oxide === true ? "conjure-oxide" : "conjure",
    args: args.join(" "),
    status: elapsed === null ? "Pending" : found === true
      ? (config.oxide === true ? "Process succeeded" : "Solutions found")
      : found === false
        ? (config.oxide === true ? "Process did not succeed" : "No solutions reported")
        : "Unknown",
    found_sols: found,
    total_time: elapsed,
    ...metrics,
    sections,
    source: "runner-json",
  };
}

/** Parse the actual JSON schema written by runner/src/main.rs::build_output(). */
export function parseRunnerJSON(source: string): SolveResult[] {
  let decoded: unknown;
  try {
    decoded = JSON.parse(source.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Invalid runner JSON: the file could not be parsed.");
  }
  const groups = Array.isArray(decoded) ? decoded : [decoded];
  if (!groups.length) throw new Error("The runner JSON contains no configurations.");
  const rows: SolveResult[] = [];

  for (const groupValue of groups) {
    const group = asRecord(groupValue);
    if (!group || !asRecord(group.config) || !Array.isArray(group.results)) {
      throw new Error("Expected runner JSON entries with { config, results: [...] }.");
    }
    const config = asRecord(group.config)!;
    for (const entryValue of group.results) {
      const result = asRecord(entryValue);
      if (!result || !asRecord(result.problem)) {
        throw new Error("Invalid runner JSON: a benchmark is missing its problem metadata.");
      }
      const problem = asRecord(result.problem)!;
      if (Array.isArray(result.param_runs) && result.param_runs.length) {
        for (const parameterValue of result.param_runs) {
          const parameter = asRecord(parameterValue);
          if (!parameter) throw new Error("Invalid runner JSON: malformed parameter run.");
          rows.push(toRow(
            problem, result, config, text(parameter.name), parameter.total_time,
            parameter.times, parameter.found_sols,
          ));
        }
      } else {
        rows.push(toRow(
          problem, result, config, "", result.total_time, result.times, result.found_sols,
        ));
      }
    }
  }
  if (!rows.length) throw new Error("The runner JSON has no benchmark results yet (it may be a partial or empty run).");
  return rows;
}
