/** Normalised catalogue CSV or Rust runner JSON measurement. All timings are in seconds. */
export interface SolveResult {
  name: string;
  heuristic: string;
  total_time: number | null;
  resolved_rule_sets: number | null;
  parsing_input_model: number | null;
  rewriting_model: number | null;
  building_solver_model: number | null;
  running_solver: number | null;
  /** Optional execution context, included in runner JSON and compatible CSV exports. */
  tool?: string;
  /** Stable family (conjure or conjure-oxide); executable may vary by PR. */
  tool_family?: string;
  parameters?: string;
  args?: string;
  status?: string;
  found_sols?: boolean | null;
  source?: "runner-json" | "csv";
  sections?: { name: string; time: number }[];
  /** Additional runner/catalogue fields retained for inspection. */
  source_fields?: { name: string; value: string }[];
}

export interface TimingSection {
  name: string;
  time: number;
}
