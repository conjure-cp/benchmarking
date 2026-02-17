<script lang="ts">
    import { onMount } from "svelte";

    let root: HTMLElement;
    let theme = $state("light");

    onMount(() => {
        root = document.documentElement;
    });

    $effect(() => {
        root.setAttribute("data-theme", theme);
    });
</script>

<div class="flex gap-2">
    <button
        class="h-8 w-8 bg-white rounded-md border-8 border-[oklch(75.687%_0.123_76.89)] transition-all"
        style={theme == "luxury" ? "transform: scale(1.2)" : ""}
        onclick={() => (theme = "luxury")}
        title="Luxury theme"
    ></button>
    <button
        class="h-8 w-8 bg-[oklch(58%_0.233_277.117)] rounded-md border-8 border-[oklch(25.33%_0.016_252.42)] transition-all"
        style={theme == "dark" ? "transform: scale(1.2)" : ""}
        onclick={() => (theme = "dark")}
        title="Dark theme"
    ></button>
    <button
        class="h-8 w-8 bg-[oklch(75.351%_0.138_232.661)] rounded-md border-8 border-[oklch(27.949%_0.036_260.03)] transition-all"
        style={theme == "night" ? "transform: scale(1.2)" : ""}
        onclick={() => (theme = "night")}
        title="Night theme"
    ></button>
    <button
        class="h-8 w-8 bg-[oklch(45%_0.24_277.023)] rounded-md border-8 border-white transition-all"
        style={theme == "light" ? "transform: scale(1.2)" : ""}
        onclick={() => (theme = "light")}
        title="Light theme"
    ></button>
    <button
        class="h-8 w-8 bg-[oklch(80%_0.114_19.571)] rounded-md border-8 border-[oklch(88.272%_0.049_91.774)] transition-all"
        style={theme == "retro" ? "transform: scale(1.2)" : ""}
        onclick={() => (theme = "retro")}
        title="Retro theme"
    ></button>
</div>
