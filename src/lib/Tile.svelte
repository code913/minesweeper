<script lang="ts">
    import { randomRange } from "$lib/utils";
    import { getContext } from "svelte";
    import { sineOut } from "svelte/easing";
    import { Tile, Board } from "$lib/Game";

    export let tile: Tile;
    export let size;
    let x, y, value, bomb, shown;
    $: ({ x, y, value, bomb, shown } = tile);

    const board = getContext<Board>("board");
    const transitionDuration = 250;

    function outTransition(node) {
        const x = randomRange(-20, 20),
            y = -100,
            r = randomRange(-60, 60);

        return {
            duration: transitionDuration,
            easing: sineOut,
            css: (t, u) => {
                let c =
                    `transform: rotate(${r}deg) translate(${x}%, ${y}%);`.replace(
                        /\d+(?![);])/g,
                        (n) => (u * +n).toFixed(3)
                    );
                return c;
            },
        };
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<button
    class="tile"
    on:click={() => {
        if (shown) return;

        console.log(board.getClearableTiles(tile));
        board.assign(x, y, { shown: !shown });
    }}
    style:grid-area="{y + 1} / {x + 1}"
    style:--size={size}
>
    {#key shown}
        <span out:outTransition class="tile-content" class:shown>
            {#if shown}
                {#if bomb}
                    💣
                {:else}
                    {value}
                {/if}
            {/if}
        </span>
    {/key}
</button>

<style lang="scss">
    .tile {
        display: grid;
        padding: 0;
        border-radius: 0;
        grid-template: {
            columns: 100%;
            rows: 100%;
        }
        place-items: stretch;
        width: var(--size);
        aspect-ratio: 1;
        background: blanchedalmond;

        .tile-content {
            grid-area: 1 / 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff6;
            font-size: 2rem;
        }
    }
</style>
