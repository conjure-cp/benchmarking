<script lang="ts">
    import Bar from "$lib/components/bar.svelte";
    import { onMount } from "svelte";
    let data: Result[];

    onMount(async () => {
        const res: Result[] = await (await fetch("/data.json")).json();
        data = res;
    });
</script>

{#if data != null}
    <Bar bars={data}></Bar>
{/if}
