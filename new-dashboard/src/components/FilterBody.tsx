import { Button, HStack, For, VStack } from "@chakra-ui/react";
import { LuTrash } from "react-icons/lu";
import React from "react";
("use client");

import { Code, Menu, Portal, Stack } from "@chakra-ui/react";
import { useState } from "react";
export interface FilterRule {
	operation: "lt" | "gt" | "eq";
	propertry: "total_time";
	value: number;
}

const propertyMenu = () => {
	const [open, setOpen] = useState(false);
	return (
		<Stack gap="4" align="flex-start">
			<Code>open: {String(open)}</Code>
			<Menu.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
				<Menu.Trigger asChild>
					<Button variant="outline" size="sm">
						Open
					</Button>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content>
							<Menu.Item value="total-time">Total time</Menu.Item>
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>
		</Stack>
	);
};

const operationMenu = () => {
	const [open, setOpen] = useState(false);
	return (
		<Stack gap="4" align="flex-start">
			<Code>open: {String(open)}</Code>
			<Menu.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
				<Menu.Trigger asChild>
					<Button variant="outline" size="sm">
						Open
					</Button>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content>
							<Menu.Item value="lt">Less than</Menu.Item>
							<Menu.Item value="gt">Greater than</Menu.Item>
							<Menu.Item value="eq">Equals</Menu.Item>
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>
		</Stack>
	);
};

export function FilterBody() {
	const [rules, setRules] = React.useState<FilterRule[]>([]);

	return (
		<>
			<HStack>
				<Button
					onClick={() => {
						setRules((old) => [
							...old,
							{
								operation: "lt",
								propertry: "total_time",
								value: 0,
							},
						]);
					}}
				>
					Add Rule
				</Button>
				<Button
					onClick={() => {
						setRules([]);
					}}
					variant={"outline"}
					colorPalette={"red"}
				>
					<LuTrash /> Reset Rules
				</Button>
			</HStack>

			<VStack>
				<For each={rules}>
					{(rule, index) => <div key={index}>{rule.propertry}</div>}
				</For>
			</VStack>
		</>
	);
}
