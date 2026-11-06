export type SolveResult = {
	name: string;
	total_time: number;
	resolved_rule_sets: number;
	parsing_input_model: number;
	heuristic: "f" | "c";
	rewriting_model: number | null;
	building_solver_model: number | null;
	running_solver: number | null;
};
