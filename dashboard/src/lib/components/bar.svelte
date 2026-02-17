<script lang="ts">
    import BarSection from "./barSection.svelte";
    import Popup from "./popup.svelte";
    import ResultInfo from "./resultInfo.svelte";
    import Tooltip from "./tooltip.svelte";

    const { bars }: { bars: Result[] } = $props();

    let popupOpen = $state(false);
    const closePopup = () => {
        popupOpen = false;
    };
    const width = $derived(Math.min(100 / bars.length - 2, 15));
    let maxHeight = $derived(
        bars.reduce((a, b) => (b.totalTime > a ? b.totalTime : a), 0) * 1.1,
    );

    let currentBar: Result | null = $state(null);

    const genAxis = (min: number, max: number) => {
        const delta = max - min;
        const mag = Math.floor(Math.log10(delta));
        let interval;
        let tenth = delta / 10;
        let scale = Math.pow(10, mag - 1);

        if (tenth < 2 * scale) {
            interval = 1 * scale;
        } else if (tenth < 4 * scale) {
            interval = 2 * scale;
        } else if (tenth < 5 * scale) {
            interval = 4 * scale;
        } else if (tenth < 8 * scale) {
            interval = 5 * scale;
        } else if (tenth < 10 * scale) {
            interval = 8 * scale;
        } else {
            interval = 10 * scale;
        }

        let out = [Math.ceil(min / interval) * interval];
        let i = 0;
        while (out[i] + interval < max) {
            out.push(parseFloat((out[i] + interval).toPrecision(2)));
            i++;
        }

        return out;
    };
</script>

<div class="w-full h-full relative">
    <div
        class="w-[calc(100%-8rem)] h-0.5 absolute bottom-16 bg-base-content left-16 z-10"
    ></div>
    <div
        class="h-[calc(100%-8rem)] w-0.5 absolute bottom-16 bg-base-content left-16 z-10"
    >
        {#each genAxis(0, maxHeight) as n}
            <div
                class="absolute -left-8 flex items-center w-8"
                style={`bottom: ${(100 * n) / maxHeight}%;`}
            >
                <p class="absolute -left-4">{n}</p>
                <div
                    class="absolute bottom-0 right-0 h-0.5 w-1/2 bg-base-content"
                ></div>
            </div>
        {/each}
    </div>
    <Popup open={popupOpen} setClosed={closePopup}>
        {#if currentBar != null}
            <ResultInfo res={currentBar} />
        {/if}
    </Popup>
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
                <button
                    class="absolute -bottom-8 w-full text-center cursor-pointer hover:text-accent transition-all"
                    onclick={() => {
                        currentBar = bar;
                        popupOpen = true;
                    }}
                >
                    {bar.metadata.name}
                </button>
            </div>
        {/each}
    </div>
</div>
