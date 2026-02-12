<script lang="ts">
    let { children } = $props();
    let hidden = $state(true);
</script>

<div
    class="w-full h-full relative"
    onmouseover={() => (hidden = false)}
    onfocus={() => (hidden = false)}
    onmouseout={() => (hidden = true)}
    onblur={() => (hidden = true)}
    role="tooltip"
>
    <div
        class="z-10 border-2 p-2 bg-base-200 rounded-2xl absolute opacity-100 top-2 left-2"
        style={`display: ${hidden ? "none" : "block"};`}
    >
        {@render children?.()}
    </div>
</div>
