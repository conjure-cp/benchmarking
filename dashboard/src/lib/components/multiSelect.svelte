<script lang="ts">
    import { faCross, faX } from "@fortawesome/free-solid-svg-icons";
    import Fa from "svelte-fa";

    let {
        options,
        select,
        selected,
        deselect,
        label,
    }: {
        options: Set<string>;
        select: (s: string) => void;
        deselect: (s: string) => void;
        selected: string[];
        label: string;
    } = $props();

    let current = $state("");
    $effect(() => {
        if (current != "") {
            select(current);
            current = "";
        }
    });
</script>

<div class="w-full mb-4">
    <div class="flex w-full gap-4 items-center">
        <label for="selectSolver">{label}: </label>
        <select id="selectSolver" bind:value={current} class="input grow">
            {#each options as opt}
                <option value={opt}>{opt}</option>
            {/each}
        </select>
    </div>
    <div class="flex gap-2 flex-wrap mt-4">
        {#each selected as s}
            <div
                class="flex gap-2 items-center p-2 bg-accent text-accent-content rounded-md"
            >
                <p>{s}</p>
                <button class="cursor-pointer" onclick={() => deselect(s)}>
                    <Fa
                        icon={faX}
                        class="text-error w-2 h-2 hover:scale-125 "
                    />
                </button>
            </div>
        {/each}
    </div>
</div>
