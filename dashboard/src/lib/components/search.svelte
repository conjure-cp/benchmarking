<script lang="ts">
    import Fa from "svelte-fa";
    import { faFilter } from "@fortawesome/free-solid-svg-icons";

    let {
        prs,
        setFilters,
    }: { prs: Set<string>; setFilters: (f: FilterValues) => void } = $props();

    let pr = $state("");
    $effect(() => {
        setFilters({ pr: pr });
    });
</script>

<div class="flex justify-evenly w-full px-4 gap-4 items-center">
    <label for="pr-search">PR: </label>
    <select id="pr-search" class="grow input" bind:value={pr}>
        {#each prs as pr}
            <option value={pr}>{pr}</option>
        {/each}
    </select>

    <Fa icon={faFilter} />
</div>
