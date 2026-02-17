<script lang="ts">
    import Fa from "svelte-fa";
    import { faFilter } from "@fortawesome/free-solid-svg-icons";

    let { prs }: { prs: Set<string> } = $props();
</script>

<div class="flex justify-evenly w-full px-4 gap-4 items-center">
    <label for="pr-search">PR: </label>
    <select id="pr-search" class="grow input" value="">
        {#each prs as pr}
            <option value={pr}>{pr}</option>
        {/each}
    </select>

    <Fa icon={faFilter} />
</div>
