<script lang="ts">
    import Tooltip from "./tooltip.svelte";

    const {
        sectionTime,
        totalTime,
        previousTime,
        name,
        opacity,
    }: {
        sectionTime: number;
        totalTime: number;
        previousTime: number;
        name: string;
        opacity: number;
    } = $props();

    // Classes for tailwind:
    // bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(50,50,50,0.2)]
    // bg-[rgba(0,0,0,0.4)] hover:bg-[rgba(50,50,50,0.4)]
    // bg-[rgba(0,0,0,0.6)] hover:bg-[rgba(50,50,50,0.6)]
</script>

<div
    class={"w-full absolute transition-all bg-[rgba(0,0,0," +
        opacity +
        ")] hover:bg-[rgba(50,50,50," +
        opacity +
        ")]"}
    style={`height: ${(100 * sectionTime) / totalTime}%;
                    bottom: ${(100 * previousTime) / totalTime}%;`}
>
    <Tooltip>
        <p class="whitespace-nowrap">
            <strong>{name} time: </strong>
            {sectionTime}s
        </p>
    </Tooltip>
</div>
