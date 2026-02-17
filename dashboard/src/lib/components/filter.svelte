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

    let solvers = $derived(
        data.reduce((a, b) => {
            a.add(b.metadata.solver);
            return a;
        }, new Set<string>()),
    );

    let args = $derived(
        data.reduce((a, b) => {
            for (const arg of b.metadata.args) {
                a.add(arg);
            }
            return a;
        }, new Set<string>()),
    );

    let filters: FilterValues[] = $state([
        { pr: "", solvers: [], args: [] },
        { pr: "", solvers: [], args: [] },
    ]);
    let validFilters = $derived(!(filters[0].pr == "" || filters[1].pr == ""));

    const update = () => {
        let newData: Result[] = [];
        for (let i = 0; i < 2; i++) {
            for (const r of data) {
                if (
                    r.metadata.pr == filters[i].pr &&
                    (filters[i].solvers.length == 0 ||
                        filters[i].solvers.includes(r.metadata.solver)) &&
                    (filters[i].args.length == 0 ||
                        r.metadata.args.filter((a) =>
                            filters[i].args.includes(a),
                        ).length > 0)
                ) {
                    let cp: Result = JSON.parse(JSON.stringify(r));
                    cp.metadata.tags.push((i + 1).toString());

                    newData.push(cp);
                }
            }
        }

        setFiltered(newData);
    };

    const setFilters = (f: FilterValues, idx: number) => {
        filters[idx] = f;
    };
</script>

<div class="m-6 rounded-2xl bg-base-200 p-6">
    <h2 class="text-2xl w-full text-center mb-4">Select data</h2>
    <div class="w-full flex justify-evenly gap-16">
        <Search
            {prs}
            {solvers}
            {args}
            setFilters={(f: FilterValues) => setFilters(f, 0)}
        ></Search>
        <Search
            {prs}
            {solvers}
            {args}
            setFilters={(f: FilterValues) => setFilters(f, 1)}
        ></Search>
    </div>

    <div class="w-full flex justify-center mt-4">
        <button
            class={"btn " + (validFilters ? "btn-primary" : "btn-disabled")}
            onclick={update}>Confirm</button
        >
    </div>
</div>
