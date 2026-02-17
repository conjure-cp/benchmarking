<script lang="ts">
    import Fa from "svelte-fa";
    import { faFilter } from "@fortawesome/free-solid-svg-icons";
    import Popup from "./popup.svelte";
    import MultiSelect from "./multiSelect.svelte";
    import { onMount } from "svelte";

    let {
        prs,
        solvers,
        args,
        setFilters,
    }: {
        prs: Set<string>;
        solvers: Set<string>;
        args: Set<string>;
        setFilters: (f: FilterValues) => void;
    } = $props();

    let pr = $state("");
    let open = $state(false);
    let selectedSolvers: string[] = $state(Array.from(solvers));
    let selectedArgs: string[] = $state(Array.from(args));

    let setClosed = () => (open = false);
    $effect(() => {
        setFilters({ pr: pr, solvers: selectedSolvers, args: selectedArgs });
    });
</script>

<div class="flex justify-evenly w-full px-4 gap-4 items-center">
    <label for="pr-search">PR: </label>
    <select id="pr-search" class="grow input" bind:value={pr}>
        {#each prs as pr}
            <option value={pr}>{pr}</option>
        {/each}
    </select>

    <button onclick={() => (open = true)}>
        <Fa icon={faFilter} class="hover:scale-120 cursor-pointer" />
    </button>
    <Popup {open} {setClosed}>
        <div class="w-full flex flex-col items-center">
            <h1 class="text-xl mb-4">Filters</h1>
            {#if pr != ""}
                <MultiSelect
                    options={solvers}
                    selected={selectedSolvers}
                    select={(s) => {
                        if (!selectedSolvers.includes(s)) {
                            selectedSolvers.push(s);
                        }
                    }}
                    deselect={(s) =>
                        (selectedSolvers = selectedSolvers.filter(
                            (i) => i != s,
                        ))}
                    label={"Solvers"}
                />

                <MultiSelect
                    options={args}
                    selected={selectedArgs}
                    select={(s) => {
                        if (!selectedArgs.includes(s)) {
                            selectedArgs.push(s);
                        }
                    }}
                    deselect={(s) =>
                        (selectedArgs = selectedArgs.filter((i) => i != s))}
                    label={"Args"}
                />
            {/if}
        </div>
    </Popup>
</div>
