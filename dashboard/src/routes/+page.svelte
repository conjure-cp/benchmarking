<script lang="ts">
    import Bar from "$lib/components/bar.svelte";
    import Selector from "$lib/components/selector.svelte";
    import { onMount } from "svelte";
    let data: { pr: string; results: Results }[] = $state([]);
    let filteredData: { label: string; result: Result }[] = $state([]);

    onMount(async () => {
        const q = await fetch("/prs.json");
        const res: { pr: string; path: string }[] = await q.json();
        console.log(res);

        for (const p of res) {
            const p_dat = await fetch("/" + p.path);
            const p_j = await p_dat.json();
            data = [
                ...data,
                {
                    pr: p.pr,
                    results: p_j,
                },
            ];
            console.log(data);
        }
    });

    const setFiltered = (newData: { label: string; result: Result }[]) => {
        filteredData = newData;
    };
</script>

<div class="w-full h-full">
    {#if data.length > 0}
        <Selector {data} {setFiltered}></Selector>
    {/if}

    {#if filteredData.length > 0}
        <Bar bars={filteredData}></Bar>
    {/if}
</div>
