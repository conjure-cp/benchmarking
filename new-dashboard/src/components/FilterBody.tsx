"use client";

import {
	Button,
	Code,
	For,
	HStack,
	Menu,
	NumberInput,
	Portal,
	VStack,
} from "@chakra-ui/react";
import { LuTrash } from "react-icons/lu";
import React from "react";

export type FilterOperation = "lt" | "gt" | "eq";
export type FilterProperty = "total_time";

export interface FilterRule {
	operation: FilterOperation;
	property: FilterProperty;
	value: number;
}

type Option<T extends string> = { value: T; label: string };

const PROPERTY_OPTIONS: Option<FilterProperty>[] = [
	{ value: "total_time", label: "Total time" },
];

const OPERATION_OPTIONS: Option<FilterOperation>[] = [
	{ value: "lt", label: "<" },
	{ value: "gt", label: ">" },
	{ value: "eq", label: "=" },
];

interface RuleDropdownProps<T extends string> {
	value: T;
	options: Option<T>[];
	onSelect: (value: T) => void;
}

function RuleDropdown<T extends string>({
	value,
	options,
	onSelect,
}: RuleDropdownProps<T>) {
	const label = options.find((o) => o.value === value)?.label ?? value;

	return (
		<Menu.Root>
			<Menu.Trigger asChild>
				<Button variant="outline" size="sm" minW="120px">
					{label}
				</Button>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content>
						<Menu.RadioItemGroup
							value={value}
							onValueChange={(e) => onSelect(e.value as T)}
						>
							{options.map((option) => (
								<Menu.RadioItem key={option.value} value={option.value}>
									{option.label}
									<Menu.ItemIndicator />
								</Menu.RadioItem>
							))}
						</Menu.RadioItemGroup>
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
}

export function FilterBody({
	rules,
	setRules,
}: {
	rules: FilterRule[];
	setRules: React.Dispatch<React.SetStateAction<FilterRule[]>>;
}) {
	const updateRule = (index: number, patch: Partial<FilterRule>) => {
		setRules((old) =>
			old.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
		);
	};

	return (
		<>
			<HStack>
				<Button
					onClick={() => {
						setRules((old) => [
							...old,
							{ operation: "lt", property: "total_time", value: 0 },
						]);
					}}
				>
					Add Rule
				</Button>
				<Button
					onClick={() => setRules([])}
					variant="outline"
					colorPalette="red"
				>
					<LuTrash /> Reset Rules
				</Button>
			</HStack>

			<VStack mt="4" align="stretch" gap="4">
				<For each={rules}>
					{(rule, index) => (
						<HStack key={index} gap="3">
							<RuleDropdown
								value={rule.property}
								options={PROPERTY_OPTIONS}
								onSelect={(property) => updateRule(index, { property })}
							/>
							<RuleDropdown
								value={rule.operation}
								options={OPERATION_OPTIONS}
								onSelect={(operation) => updateRule(index, { operation })}
							/>
							<NumberInput.Root
								value={String(rule.value)}
								onValueChange={(e) =>
									updateRule(index, { value: e.valueAsNumber })
								}
							>
								<NumberInput.Input w="100px" />
							</NumberInput.Root>
						</HStack>
					)}
				</For>
			</VStack>
		</>
	);
}
