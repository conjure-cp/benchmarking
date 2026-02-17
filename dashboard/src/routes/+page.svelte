<script lang="ts">
    import Bar from "$lib/components/bar.svelte";
    import Filter from "$lib/components/filter.svelte";
    import { onMount } from "svelte";
    let data: Result[] = $state([]);
    let filteredData: Result[] = $state([]);
    let testState = $state(1);

    onMount(async () => {
        const res: Result[] = await (await fetch("/data.json")).json();
        data = res;
    });

    const setFiltered = (newData: Result[]) => {
        filteredData = newData;
    };
</script>

<div class="w-full h-full">
    <Filter {data} {setFiltered}></Filter>

    {#if filteredData.length > 0}
        <Bar bars={filteredData}></Bar>
    {/if}
</div>
