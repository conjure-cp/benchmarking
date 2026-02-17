<script lang="ts">
    import ThemeSelect from "$lib/components/themeSelect.svelte";
    import "./layout.css";

    const { children } = $props();
</script>

<div>
    <nav class="h-[10vh] p-4 bg-base-300 flex items-center justify-between">
        <div>
            <h1 class="text-2xl">Conjure Benchmarks</h1>
        </div>
        <ThemeSelect />
        <div class="flex gap-4">
            <a href="/">Benchmarks</a>
            <a href="/failed">Failures</a>
        </div>
    </nav>
    <main class="h-[90vh]">
        {@render children()}
    </main>
</div>
