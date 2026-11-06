import Papa from "papaparse";
import type { SolveResult } from "@/types/SolveResult";

export async function fetchCSVFile(): Promise<SolveResult[]> {
	const response = await fetch("/output.csv");
	if (!response.ok) throw new Error(`CSV fetch failed: ${response.status}`);
	const text = await response.text();

	const { data, errors } = Papa.parse<SolveResult>(text, {
		header: true,
		skipEmptyLines: true,
		dynamicTyping: true,
		transformHeader: (h) => h.trim().replace(/\s+/g, "_"), // "resolved rule sets" -> "resolved_rule_sets"
	});
	if (errors.length) console.warn(errors.slice(0, 5));
	return data;
}
