<script lang="ts">
    import "./layout.css";

    const { children } = $props();
</script>

<div>
    <nav class="h-[10vh] p-4 bg-base-300 flex items-center">
        <h1 class="text-2xl">Conjure Benchmarks</h1>
    </nav>
    <main class="h-[90vh]">
        {@render children()}
    </main>
</div>
