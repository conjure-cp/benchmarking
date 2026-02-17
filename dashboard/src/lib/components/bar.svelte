<script lang="ts">
    import BarSection from "./barSection.svelte";
    import Tooltip from "./tooltip.svelte";

    const { bars }: { bars: Result[] } = $props();

    const width = $derived(Math.min(100 / bars.length - 2, 15));
    let maxHeight = $derived(
        bars.reduce((a, b) => (b.totalTime > a ? b.totalTime : a), 0) * 1.1,
    );
</script>

<div class="w-full h-full relative">
    <div
        class="w-[calc(100%-8rem)] h-0.5 absolute bottom-16 bg-base-content left-16 z-10"
    ></div>
    <div
        class="h-[calc(100%-8rem)] w-0.5 absolute bottom-16 bg-base-content left-16 z-10"
    ></div>
    <div class="w-full h-full flex justify-evenly p-16 items-end">
        {#each bars as bar}
            <div
                class={"relative " +
                    (bar.metadata.tags.includes("1")
                        ? "bg-primary"
                        : "bg-accent")}
                style={`width: ${width}%; height:${(100 * bar.totalTime) / maxHeight}%`}
            >
                <Tooltip>
                    <p class="whitespace-nowrap">
                        <strong>Total time:</strong>
                        {bar.totalTime}s
                    </p>
                </Tooltip>
                <BarSection
                    sectionTime={bar.solver}
                    totalTime={bar.totalTime}
                    previousTime={0}
                    opacity={0.6}
                    name={"Solver"}
                ></BarSection>
                <BarSection
                    sectionTime={bar.savilleRow}
                    totalTime={bar.totalTime}
                    previousTime={bar.solver}
                    opacity={0.4}
                    name={"Saville Row"}
                ></BarSection>
                <BarSection
                    sectionTime={bar.conjure}
                    totalTime={bar.totalTime}
                    previousTime={bar.solver + bar.savilleRow}
                    opacity={0.2}
                    name={"Conjure"}
                ></BarSection>
                <p
                    class="absolute -bottom-8 w-full text-center cursor-pointer hover:text-accent transition-all"
                >
                    {bar.metadata.name}
                </p>
            </div>
        {/each}
    </div>
</div>
