import { parseBenchmarkCSV } from "./fetchCSVFile.ts";
import { parseRunnerJSON } from "./parseRunnerJSON.ts";

/** Keep both established repository pipelines: catalog CSV and Rust runner JSON. */
export function parseBenchmarkFile(filename: string, contents: string) {
  const json = filename.toLowerCase().endsWith(".json") || /^[\s\uFEFF]*[[{]/.test(contents);
  return json ? parseRunnerJSON(contents) : parseBenchmarkCSV(contents);
}
