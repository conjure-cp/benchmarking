import type { SolveResult } from "@/types/SolveResult";
import { Button, Table, Center, Text, FormatNumber } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { FilterBody, type FilterRule } from "./FilterBody";
import { useRuleContext } from "@/context/RuleContext";

const Demo = () => {
	const { rules, setRules } = useRuleContext();
	return (
		<Dialog.Root size={{ mdDown: "full", md: "lg" }}>
			<Dialog.Trigger asChild>
				<Button variant="surface" size="xs">
					Filter
				</Button>
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Dialog Title</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body>
							<FilterBody rules={rules} setRules={setRules} />
						</Dialog.Body>
						<Dialog.Footer>
							<Dialog.ActionTrigger asChild>
								<Button variant="outline">Close</Button>
							</Dialog.ActionTrigger>
						</Dialog.Footer>
						<Dialog.CloseTrigger asChild>
							<CloseButton size="sm" />
						</Dialog.CloseTrigger>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};

const PAGE_SIZE = 25;

function PageControls({
	page,
	setPage,
	totalPages,
}: {
	page: number;
	setPage: React.Dispatch<React.SetStateAction<number>>;
	totalPages: number;
}) {
	return (
		<Center gap={"2"} paddingTop={2} paddingBottom={2}>
			<Button
				variant={"surface"}
				size={"xs"}
				onClick={() => setPage((p) => Math.max(1, p - 1))}
			>
				Previous Page
			</Button>
			<Text fontSize={"xs"}>
				<FormatNumber value={page} /> / <FormatNumber value={totalPages} />
			</Text>
			<Button
				variant={"surface"}
				size={"xs"}
				onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
			>
				Next Page
			</Button>
			<Demo></Demo>
		</Center>
	);
}

function matchesRule(item: SolveResult, rule: FilterRule): boolean {
	const actual = item[rule.property];
	const expected = rule.value;

	if (expected == null) return true;

	switch (rule.operation) {
		case "lt":
			return Number(actual) < Number(expected);
		case "gt":
			return Number(actual) > Number(expected);
		case "eq":
			return typeof actual === "number"
				? actual === Number(expected)
				: String(actual) === String(expected);
		default:
			return true;
	}
}

export function ResultTable({ data }: { data: SolveResult[] }) {
	const [page, setPage] = React.useState<number>(1);
	const { rules } = useRuleContext();

	const filteredData = React.useMemo(
		() => data.filter((item) => rules.every((rule) => matchesRule(item, rule))),
		[data, rules],
	);

	useEffect(() => {
		setPage(1);
	}, [data, rules]);

	const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const start = (currentPage - 1) * PAGE_SIZE;
	const rows = filteredData.slice(start, start + PAGE_SIZE);

	return (
		<>
			<PageControls
				page={currentPage}
				setPage={setPage}
				totalPages={totalPages}
			/>

			<Table.Root size="sm" stickyHeader>
				<Table.Header>
					<Table.Row bg="bg.subtle">
						<Table.ColumnHeader>name</Table.ColumnHeader>
						<Table.ColumnHeader>total_time</Table.ColumnHeader>
						<Table.ColumnHeader>resolved_rule_sets</Table.ColumnHeader>
						<Table.ColumnHeader>parsing_input_model</Table.ColumnHeader>
						<Table.ColumnHeader>heuristic</Table.ColumnHeader>
						<Table.ColumnHeader>rewriting_model</Table.ColumnHeader>
						<Table.ColumnHeader>building_solver_model</Table.ColumnHeader>
						<Table.ColumnHeader>running_solver</Table.ColumnHeader>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{rows.map((item, index) => (
						<Table.Row key={index}>
							<Table.Cell>{item.name}</Table.Cell>
							<Table.Cell>{item.total_time}</Table.Cell>
							<Table.Cell>{item.resolved_rule_sets}</Table.Cell>
							<Table.Cell textAlign="end">
								{item.parsing_input_model}
							</Table.Cell>
							<Table.Cell textAlign="end">{item.heuristic}</Table.Cell>
							<Table.Cell textAlign="end">{item.rewriting_model}</Table.Cell>
							<Table.Cell textAlign="end">
								{item.building_solver_model}
							</Table.Cell>
							<Table.Cell textAlign="end">{item.running_solver}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>

			<PageControls
				page={currentPage}
				setPage={setPage}
				totalPages={totalPages}
			/>
		</>
	);
}
