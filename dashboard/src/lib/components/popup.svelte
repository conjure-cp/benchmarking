<script lang="ts">
    let {
        children,
        open,
        setClosed,
    }: { children: any; open: boolean; setClosed: () => void } = $props();
    let modal: HTMLDialogElement;

    $effect(() => {
        if (open) {
            modal.showModal();
        } else {
            modal.close();
        }
    });
</script>

<dialog
    bind:this={modal}
    closedby="any"
    class="fixed w-[clamp(300px,60vw,600px)] h-[60vh] z-10 backdrop:backdrop-blur-md bg-base-300 shadow-2xl left-[calc(50vw-clamp(150px,30vw,300px))] top-[20vh] rounded-2xl p-4"
    onclose={setClosed}
>
    {@render children?.()}
</dialog>
