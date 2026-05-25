<script lang="ts">
    let { res }: { res: Result } = $props();
</script>

<div class="flex flex-col w-full h-full items-center">
    <h1 class="text-xl mb-4 font-bold">{res.problem.meta.name}</h1>
    <div class="w-full flex justify-between">
        <strong>Total time: </strong>
        <p>{res.total_time}s</p>
    </div>
    <!-- <div class="w-full flex justify-between"> -->
    <!--     <strong>Conjure time: </strong> -->
    <!--     <p>{res. }s</p> -->
    <!-- </div> -->
    <!-- <div class="w-full flex justify-between"> -->
    <!--     <strong>Saville Row time: </strong> -->
    <!--     <p>{res.savilleRow}s</p> -->
    <!-- </div> -->
    <!-- <div class="w-full flex justify-between"> -->
    <!--     <strong>Solver time: </strong> -->
    <!--     <p>{res.solver}s</p> -->
    <!-- </div> -->
    <hr class="h-0.5 w-4/5 bg-accent-content my-4" />
    <h1 class="text-xl mb-4 font-bold">Metadata</h1>
    <!-- <div class="w-full flex justify-between"> -->
    <!--     <strong>PR: </strong> -->
    <!--     <p>{res.}</p> -->
    <!-- </div> -->
    <!-- <div class="w-full flex justify-between"> -->
    <!--     <strong>Tool: </strong> -->
    <!--     <p>{res.metadata.oxide ? "Conjure oxide" : "Conjure"}</p> -->
    <!-- </div> -->
    <!-- <div class="w-full flex justify-between"> -->
    <!--     <strong>Solver: </strong> -->
    <!--     <p>{res.metadata.solver}</p> -->
    <!-- </div> -->
    <!-- <hr class="h-0.5 w-4/5 bg-accent-content my-4" /> -->
    <!-- <h1 class="text-xl mb-4 font-bold">Command</h1> -->
    <!-- <p class="font-mono bg-base-100 w-full p-2 rounded-sm"> -->
    <!--     {(res.metadata.oxide ? "conjure-oxide " : "conjure ") + -->
    <!--         res.metadata.args.join(" ")} -->
    <!-- </p> -->
</div>
