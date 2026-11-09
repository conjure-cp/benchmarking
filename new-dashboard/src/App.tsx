import {
	Box,
	Button,
	Center,
	Heading,
	Spinner,
	Show,
} from "@chakra-ui/react";
import { fetchCSVFile } from "@/helper/data/fetchCSVFile";
import { useQuery } from "@tanstack/react-query";
import { ResultTable } from "./components/ResultTable";
import type { SolveResult } from "./types/SolveResult";

const Demo = () => {
	return <Heading size="4xl">Dashboard</Heading>;
};

export default function MyApp() {
	const { isLoading, data } = useQuery({
		queryFn: fetchCSVFile,
		queryKey: ["csv"],
	});

	return (
		<div>
			<Center bg="blue.950" h="100px" color="white">
				<Demo></Demo>
			</Center>

			<Box>
				<Show when={isLoading}>
					<Center>
						<Spinner />
					</Center>
				</Show>

				<Show when={!isLoading && data}>
					<ResultTable data={data as SolveResult[]} />
				</Show>
			</Box>
		</div>
	);
}
