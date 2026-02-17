<script lang="ts">
    import Search from "./search.svelte";

    let {
        data,
        setFiltered,
    }: {
        data: Result[];
        setFiltered: (n: Result[]) => void;
    } = $props();

    let prs = $derived(
        data.reduce((a, b) => {
            a.add(b.metadata.pr);
            return a;
        }, new Set<string>()),
    );

    const update = () => {
        let newData = [];
        for (const r of data) {
            r.metadata.tags.push("1");
            newData.push(r);
        }

        setFiltered(newData);
    };
</script>

<div class="m-6 rounded-2xl bg-base-200 p-6">
    <h2 class="text-2xl w-full text-center mb-4">Select data</h2>
    <div class="w-full flex justify-evenly gap-16">
        <Search {prs}></Search>
        <Search {prs}></Search>
    </div>

    <div class="w-full flex justify-center mt-4">
        <button class="btn btn-disabled">Confirm</button>
    </div>
</div>
