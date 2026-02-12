<script lang="ts">
    import Axis from "./axis.svelte";
    import Tooltip from "./tooltip.svelte";

    const { bars }: { bars: Result[] } = $props();
    const width = $derived(Math.min(100 / bars.length - 2, 15));
    const maxHeight =
        bars.reduce(
            (a, b) => (b.totalTime > a ? b.totalTime : a),
            bars[0].totalTime,
        ) * 1.1;
</script>

<Axis yLabel="Time (seconds)">
    <div class="w-full h-full flex justify-evenly p-4 items-end">
        {#each bars as bar}
            <div
                class="bg-accent relative"
                style={`width: ${width}%; height:${(100 * bar.totalTime) / maxHeight}%`}
            >
                <Tooltip>
                    <p class="whitespace-nowrap">
                        <strong>Total time:</strong>
                        {bar.totalTime}s
                    </p>
                </Tooltip>
                <div
                    class="bg-[rgba(0,0,0,0.6)] w-full absolute bottom-0 hover:bg-[rgba(50,50,50,0.6)] transition-all"
                    style={`height: ${(100 * bar.solver) / bar.totalTime}%`}
                >
                    <Tooltip>
                        <p class="whitespace-nowrap">
                            <strong>Solver time: </strong>
                            {bar.solver}s
                        </p>
                    </Tooltip>
                </div>
                <div
                    class="bg-[rgba(0,0,0,0.4)] w-full absolute hover:bg-[rgba(50,50,50,0.4)] transition-all"
                    style={`height: ${(100 * bar.savilleRow) / bar.totalTime}%;
                        bottom: ${(100 * bar.solver) / bar.totalTime}%`}
                >
                    <Tooltip>
                        <p class="whitespace-nowrap">
                            <strong>Saville row time: </strong>
                            {bar.savilleRow}s
                        </p>
                    </Tooltip>
                </div>
                <div
                    class="bg-[rgba(0,0,0,0.2)] w-full absolute hover:bg-[rgba(50,50,50,0.2)] transition-all"
                    style={`height: ${(100 * bar.conjure) / bar.totalTime}%;
                        bottom: ${(100 * (bar.solver + bar.savilleRow)) / bar.totalTime}%`}
                >
                    <Tooltip>
                        <p class="whitespace-nowrap">
                            <strong>Conjure time: </strong>
                            {bar.conjure}s
                        </p>
                    </Tooltip>
                </div>
            </div>
        {/each}
    </div>
</Axis>
