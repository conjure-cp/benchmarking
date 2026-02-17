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

    const filtEq = (a: FilterValues, b: FilterValues) => {
        return a.pr == b.pr;
    };

    let filters: FilterValues[] = $state([{ pr: "" }, { pr: "" }]);
    let validFilters = $derived(
        !filtEq(filters[0], filters[1]) &&
            !(filters[0].pr == "" || filters[1].pr == ""),
    );

    const update = () => {
        let newData: Result[] = [];
        for (let i = 0; i < 2; i++) {
            for (const r of data) {
                if (r.metadata.pr == filters[i].pr) {
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
        <Search {prs} setFilters={(f: FilterValues) => setFilters(f, 0)}
        ></Search>
        <Search {prs} setFilters={(f: FilterValues) => setFilters(f, 1)}
        ></Search>
    </div>

    <div class="w-full flex justify-center mt-4">
        <button
            class={"btn " + (validFilters ? "btn-primary" : "btn-disabled")}
            onclick={update}>Confirm</button
        >
    </div>
</div>
