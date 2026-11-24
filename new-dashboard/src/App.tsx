import { Box, Button, Center, Heading, Spinner, Show } from "@chakra-ui/react";
import { fetchCSVFile } from "@/helper/data/fetchCSVFile";
import { useQuery } from "@tanstack/react-query";
import { ResultTable } from "./components/ResultTable";
import type { SolveResult } from "./types/SolveResult";
import { RuleContext } from "./context/RuleContext";
import type { FilterRule } from "./components/FilterBody";
import React from "react";

const Demo = () => {
	return <Heading size="4xl">Dashboard</Heading>;
};

export default function MyApp() {
	const [rules, setRules] = React.useState<FilterRule[]>([]);
	const { isLoading, data } = useQuery({
		queryFn: fetchCSVFile,
		queryKey: ["csv"],
	});

	return (
		<>
			<div>
				<Center bg="blue.950" h="100px" color="white">
					<Demo></Demo>
				</Center>

				<Box
					border="1px solid"
					borderColor={"border"}
					margin={"3"}
					borderRadius={"lg"}
					bg={"bg.panel"}
				>
					<Show when={isLoading}>
						<Center>
							<Spinner />
						</Center>
					</Show>

					<Show when={!isLoading && data}>
						<RuleContext.Provider value={{ rules: rules, setRules: setRules }}>
							<ResultTable data={data as SolveResult[]} />
						</RuleContext.Provider>
					</Show>
				</Box>
			</div>
			<div>
				{" "}
				<Box
					border="1px solid"
					borderColor={"border"}
					margin={"3"}
					borderRadius={"lg"}
					bg={"bg.panel"}
				></Box>
			</div>
		</>
	);
}
