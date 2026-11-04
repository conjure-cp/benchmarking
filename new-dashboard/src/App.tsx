import { Button } from "@chakra-ui/react";
import { Heading } from "@chakra-ui/react";
import { Center, Circle, Square } from "@chakra-ui/react";

const Demo = () => {
	return <Heading size="4xl">Dashboard</Heading>;
};

export default function MyApp() {
	return (
		<div>
			<Center bg="blue.950" h="100px" color="white">
				<Demo></Demo>
			</Center>

			<Button>Hello World</Button>
		</div>
	);
}
