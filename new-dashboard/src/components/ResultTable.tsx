import type { SolveResult } from "@/types/SolveResult";
import { Button, Table, Center, Text, FormatNumber } from "@chakra-ui/react";
import React from "react";

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
			<Button variant={"surface"} size={"xs"}>
				Filter
			</Button>
		</Center>
	);
}

export function ResultTable({ data }: { data: SolveResult[] }) {
	const [page, setPage] = React.useState<number>(1);

	const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
	const start = (page - 1) * PAGE_SIZE;
	const pageRows = data.slice(start, start + PAGE_SIZE);

	return (
		<>
			<PageControls page={page} setPage={setPage} totalPages={totalPages} />

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
					{pageRows.map((item, index) => (
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

			<PageControls page={page} setPage={setPage} totalPages={totalPages} />
		</>
	);
}
