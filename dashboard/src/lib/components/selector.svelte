<script lang="ts">
    import Fa from "svelte-fa";
    import { faPlus, faX, faCheck } from "@fortawesome/free-solid-svg-icons";
    import Popup from "./popup.svelte";

    let {
        data,
        setFiltered,
    }: {
        data: { pr: string; results: Results }[];
        setFiltered: (n: { label: string; result: Result }[]) => void;
    } = $props();

    let tag = $state("1");

    const opts: {
        name: string;
        ops: string[];
        valid: (operand: string) => boolean;
        test: (
            op: string,
            operand: string,
            res: Result,
            pr: string,
            cfg: Config,
        ) => boolean;
    }[] = [
        {
            name: "PR",
            ops: ["="],
            valid: (operand: string) =>
                data.map((rs) => rs.pr).includes(operand),
            test: (
                op: string,
                operand: string,
                res: Result,
                pr: string,
                cfg: Config,
            ) => {
                if (op != "=") return false;

                return pr == operand;
            },
        },
        {
            name: "Args",
            ops: ["contains"],
            valid: (operand: string) => operand.length > 0,
            test: (
                op: string,
                operand: string,
                res: Result,
                pr: string,
                cfg: Config,
            ) => {
                if (op != "contains") return false;

                return res.args.includes(operand);
            },
        },
        {
            name: "Is oxide?",
            ops: [],
            valid: (operand: string) => true,
            test: (
                op: string,
                operand: string,
                res: Result,
                pr: string,
                cfg: Config,
            ) => cfg.oxide,
        },
        {
            name: "Total time",
            ops: ["less than", "greater than"],
            valid: (operand: string) => {
                let x = parseFloat(operand);
                return !isNaN(x);
            },
            test: (
                op: string,
                operand: string,
                res: Result,
                pr: string,
                cfg: Config,
            ) => {
                let time = res.total_time;
                if (time < 0) {
                    time = res.param_runs[0].total_time;
                    for (const p of res.param_runs) {
                        if (p.total_time > time) time = p.total_time;
                    }
                }

                switch (op) {
                    case "less than":
                        return time < parseFloat(operand);

                    case "greater than":
                        return time > parseFloat(operand);

                    default:
                        return false;
                }
            },
        },
    ];

    let newConditionalOpen = $state(false);
    let newOpt: {
        name: string;
        ops: string[];
        valid: (operand: string) => boolean;
        test: (
            op: string,
            operand: string,
            res: Result,
            pr: string,
            cfg: Config,
        ) => boolean;
    } = $state(opts[0]);
    let operand = $state("");
    let op = $state("");
    let conjunction = $state("");

    let conditionals: {
        name: string;
        op: string;
        conjunction: string;
        valid: (operand: string) => boolean;
        test: (
            op: string,
            operand: string,
            res: Result,
            pr: string,
            cfg: Config,
        ) => boolean;
        operand: string;
    }[] = $state([]);

    let groups: {
        tag: string;
        conditionals: {
            name: string;
            op: string;
            conjunction: string;
            valid: (operand: string) => boolean;
            test: (
                op: string,
                operand: string,
                res: Result,
                pr: string,
                cfg: Config,
            ) => boolean;
            operand: string;
        }[];
    }[] = $state([]);

    $effect(() => {
        let newFiltered = [];

        for (const g of groups) {
            for (const p of data) {
                for (const rSet of p.results) {
                    for (const r of rSet.results) {
                        if (!r.found_sols) continue;
                        if (r.total_time < 0) {
                            let runPassed = false;
                            for (let parRun of r.param_runs) {
                                runPassed = runPassed || parRun.found_sols;
                            }

                            if (!runPassed) continue;
                        }

                        let matches = true;

                        for (const c of g.conditionals) {
                            let valid = c.test(
                                c.op,
                                c.operand,
                                r,
                                p.pr,
                                rSet.config,
                            );

                            if (c.conjunction) {
                                switch (c.conjunction) {
                                    case "AND":
                                        matches = matches && valid;
                                        break;
                                    default:
                                        matches = matches || valid;
                                        break;
                                }
                            } else {
                                matches = valid;
                            }
                        }

                        if (matches) {
                            newFiltered.push({
                                label: g.tag,
                                result: r,
                            });
                        }
                    }
                }
            }
        }

        setFiltered(newFiltered);
    });
</script>

<div class="w-4/5 my-6 mx-auto rounded-2xl bg-base-200 p-6">
    {#each groups as g}
        <div class="flex gap-4 items-center">
            <p>{g.tag}</p>
            <div class="grow">
                <div
                    class="input flex w-full h-full gap-4 cursor-default min-h-16"
                >
                    <div class="grow p-4 flex flex-wrap gap-4">
                        {#each g.conditionals as c}
                            {#if c.conjunction}
                                <p
                                    class="bg-secondary p-4 text-secondary-content rounded-md grid place-content-center"
                                >
                                    {c.conjunction}
                                </p>
                            {/if}
                            <div
                                class="bg-base-200 border border-primary flex gap-4 py-1 px-4 items-center rounded-md"
                            >
                                <p class="p-1 bg-base-100 rounded-sm">
                                    {c.name}
                                </p>
                                {#if c.op}
                                    <p
                                        class="bg-primary rounded-md p-4 text-primary-content"
                                    >
                                        {c.op}
                                    </p>
                                    <p class="p-1 bg-base-100 rounded-sm">
                                        {c.operand}
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/each}

    <div class="flex gap-4 items-center">
        <div class="grow">
            <div class="input flex w-full h-full gap-4 cursor-default min-h-16">
                <div class="grow p-4 flex flex-wrap gap-4">
                    {#each conditionals as c}
                        {#if c.conjunction}
                            <p
                                class="bg-secondary p-4 text-secondary-content rounded-md grid place-content-center"
                            >
                                {c.conjunction}
                            </p>
                        {/if}
                        <div
                            class="bg-base-200 border border-primary flex gap-4 py-1 px-4 items-center rounded-md"
                        >
                            <p class="p-1 bg-base-100 rounded-sm">{c.name}</p>
                            {#if c.op}
                                <p
                                    class="bg-primary rounded-md p-4 text-primary-content"
                                >
                                    {c.op}
                                </p>
                                <p class="p-1 bg-base-100 rounded-sm">
                                    {c.operand}
                                </p>
                            {/if}
                        </div>
                    {/each}
                </div>
                <button
                    onclick={() => {
                        newConditionalOpen = true;
                    }}
                >
                    <Fa
                        class="text-base-300 brightness-75 hover:brightness-50 hover:scale-110 cursor-pointer"
                        icon={faPlus}
                    />
                </button>
                <Popup
                    open={newConditionalOpen}
                    setClosed={() => (newConditionalOpen = false)}
                >
                    <div class="flex flex-col justify-between h-full">
                        <h1 class="w-full text-xl text-center">
                            New Conditional
                        </h1>

                        <div class="flex flex-col gap-8">
                            {#if conditionals.length > 0}
                                <div
                                    class="flex justify-between mx-12 items-center gap-4"
                                >
                                    <p>Conjunction:</p>
                                    <select
                                        name="Conditional"
                                        class="select"
                                        bind:value={conjunction}
                                    >
                                        <option value="AND">AND</option>
                                        <option value="OR">OR</option>
                                    </select>
                                </div>
                            {/if}
                            <div
                                class="flex justify-between mx-12 items-center gap-4"
                            >
                                <p>Attribute:</p>
                                <select
                                    name="Conditional"
                                    class="select"
                                    onchange={(e) => {
                                        for (const o of opts) {
                                            if (o.name == e.target.value) {
                                                newOpt = o;
                                            }
                                        }
                                    }}
                                >
                                    {#each opts as opt}
                                        <option value={opt.name}>
                                            {opt.name}
                                        </option>
                                    {/each}
                                </select>
                            </div>
                            {#if newOpt.ops.length > 0}
                                <div
                                    class="flex justify-between mx-12 items-center gap-4"
                                >
                                    <p>Operation:</p>
                                    <select
                                        name="Conditional"
                                        class="select"
                                        bind:value={op}
                                    >
                                        {#each newOpt.ops as opt}
                                            <option value={opt}>
                                                {opt}
                                            </option>
                                        {/each}
                                    </select>
                                </div>

                                <div
                                    class="flex justify-between mx-12 items-center gap-4"
                                >
                                    <p>Operand:</p>
                                    <input
                                        bind:value={operand}
                                        type="text"
                                        class="bg-neutral-50 p-2 rounded-sm border border-base-content/50 mx-8"
                                    />
                                    {#if newOpt.valid(operand)}
                                        <Fa
                                            class="text-success"
                                            icon={faCheck}
                                        />
                                    {:else}
                                        <Fa class="text-error" icon={faX} />
                                    {/if}
                                </div>
                            {/if}
                        </div>

                        <button
                            class="btn btn-primary"
                            onclick={() => {
                                if (
                                    !newOpt.valid(operand) ||
                                    (conditionals.length > 0 &&
                                        conjunction == "")
                                ) {
                                    return;
                                }

                                conditionals.push({
                                    ...newOpt,
                                    operand: operand,
                                    op: op,
                                    conjunction: conjunction,
                                });
                                operand = "";
                                op = "";
                                conjunction = "";
                                newConditionalOpen = false;
                            }}>Add</button
                        >
                    </div>
                </Popup>
            </div>
        </div>
        <p class="w-16 h-16 bg-primary rounded-md"></p>
        <button
            onclick={() => {
                groups.push({
                    tag: tag,
                    conditionals: conditionals,
                });
                conditionals = [];
                tag += "1";
            }}
            class="w-16 h-16 bg-base-300 rounded-md hover:brightness-75 flex justify-center"
        >
            <Fa class="w-1/2 mt-[25%]" style="height: 50%;" icon={faPlus} />
        </button>
    </div>
</div>
