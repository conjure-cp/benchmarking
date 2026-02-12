<script lang="ts">
    const {
        children,
        xLabel,
        yLabel,
        yMin,
        yMax,
        xMin,
        xMax,
    }: {
        children: any;
        xLabel?: string;
        yLabel?: string;
        yMin?: number;
        yMax?: number;
        xMin?: number;
        xMax?: number;
    } = $props();
</script>

<div class="w-full h-full relative">
    <p class="w-[80%]">{yLabel ? yLabel : ""}</p>
    <div class="w-full h-full">
        {@render children?.()}
    </div>
</div>
