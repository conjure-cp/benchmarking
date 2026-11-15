import type { FilterRule } from "@/components/FilterBody";
import { createContext, useContext } from "react";

export interface RuleContextValue {
	rules: FilterRule[];
	setRules: React.Dispatch<React.SetStateAction<FilterRule[]>>;
}

export const RuleContext = createContext<RuleContextValue | undefined>(
	undefined,
);
export function useRuleContext() {
	const rules = useContext(RuleContext);
	if (rules === undefined) {
		throw new Error("useRuleContext must be used within a rule context");
	}
	return rules;
}
