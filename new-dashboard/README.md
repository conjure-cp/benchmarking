# Benchmark Explorer

A React + TypeScript + Vite dashboard for **conjure-cp/benchmarking**. It follows the Essence Dashboard Figma layout while consuming **both of the repository's existing benchmark formats**.

## How the repository's tools connect

```text
runner/src/main.rs -> out.json (Rust runner: config + results + param_runs + times)
                      |-> dashboard/ (existing Svelte/PR visualiser via prs.json)
                      `-> new-dashboard/ (import .json directly)

catalog_plog/essence_times.py -> catalogue timing CSV (e.g. output.csv)
                                `-> new-dashboard/ (bundled CSV or import .csv)
```

**The Rust runner writes JSON, not CSV.** The repository also contains CSV measurements produced by the catalogue benchmarking workflow. This dashboard intentionally supports **both** rather than altering or converting the runner's output.

## Run locally

```bash
cd new-dashboard
npm ci
npm run dev
```

The default display loads `public/output.csv` (identical to `catalog_plog/output-1.csv`). `public/output70.csv` uses the catalogue’s alternative Conjure/Savile Row CSV schema; both are supported. Solver totals map to the standard solver-time column, while Savile Row timings remain separately visible in row details. Use **Import CSV / JSON** to select another catalogue timing CSV or the Rust runner's `out.json`. To generate JSON through the runner, from `runner/` use:

```bash
cargo run -- config.json examples out.json
```

The command needs a working Conjure/Conjure Oxide installation and runnable models whose names match `config.json`. A fresh `out.json` with no completed benchmark measurements cannot be charted.

To compare experiments, use **Compare baseline** and load an earlier CSV **or** runner JSON. Comparisons match the benchmark name, parameter file, heuristic, tool family and command arguments (when available). The runner may use different absolute executable paths for each PR, so raw paths are shown for inspection but not used to distinguish the same tool family. Only comparable configurations and hardware give meaningful speed comparisons.

## Preserved runner metadata

- `config.conjure_path`, `config.oxide` (also used to derive a stable tool family), the executed `args`, and the heuristic specified by `-h` or `--heuristic`.
- `problem.meta.name` and individual `param_runs[].name`. A parent run with `total_time = -1` is a placeholder, **not** a timed measurement.
- `found_sols`, with its meaning depending on tool: for Conjure Oxide, the current runner derives this flag from process success; for Conjure, it reads the solver's solution count.
- Original `times[]` sections remain available under **Execution details**, including any stages not represented by the five standard chart columns. Repeated named stages are summed.
- Missing, unfinished and negative placeholder timings are represented as unavailable (`null`), never interpreted as zero.

The chart breakdown uses named runner stages when they correspond to the catalogue's standard timing columns. Other named stages remain accessible in the row details and are included in the unallocated portion of a total-time bar; they are **not** guessed into unrelated categories. Imported data and exported CSV timing units are seconds.

## Other features

Search, sortable columns, heuristic/executable filters, multiple numeric timing filters, pagination, row selection, CSV export, runtime breakdowns and baseline comparison. Exported CSV preserves the fields needed for re-import and consistent comparison, even if some columns are hidden in the UI.

## Checks

```bash
npm run build
npm run lint
npm test
```

## Source layout

- `src/App.tsx` – shared UI state and data import/export.
- `src/components/ResultTable.tsx` – table, sorting, selection and per-run details.
- `src/components/BenchmarkCharts.tsx` – timing charts.
- `src/components/FilterBody.tsx` – numeric timing conditions.
- `src/helper/data/fetchCSVFile.ts` – catalogue CSV adapter and exporter.
- `src/helper/data/parseRunnerJSON.ts` – Rust runner's `out.json` adapter.
- `src/helper/data/parseBenchmarkFile.ts` – format dispatch for imports.
- `src/lib/benchmark.ts` – shared metrics, filters, sorting and comparisons.
