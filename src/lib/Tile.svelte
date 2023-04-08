<script lang="ts">
    import { randomRange, clamp } from "$lib/utils";
    import { getContext } from "svelte";
    import { sineOut } from "svelte/easing";
    import { fade } from "svelte/transition";
    import { type Tile, Board } from "$lib/Game";

    export let tile: Tile;
    export let size;

    let { x, y, value, bomb, shown, flagged } = tile;
    $: ({ x, y, value, bomb, shown, flagged } = tile);
    let pressTimeout: number | null = null;

    const board = getContext<Board>("board");
    const transitionDuration = 500;
    const pressCooldown = 250;

    function outTransition(node) {
        const x = randomRange(-20, 20),
            y = -100,
            r = randomRange(-60, 60);

        return {
            duration: transitionDuration,
            easing: sineOut,
            css: (t, u) =>
                `transform: rotate(${r}deg) translate(${x}%, ${y}%);`.replace(
                    /\d+(?![);])/g,
                    (n) => (u * +n).toFixed(3)
                ) + `opacity: ${1.25 * t}`,
        };
    }

    function clearTiles() {
        if (shown || flagged) return;

        for (let t of board.getClearableTiles(tile))
            board.assign(t.x, t.y, { shown: true });
    }

    function flagTile() {
        resetTimeout();
        board.assign(x, y, { flagged: !flagged });
    }

    function startTimeout() {
        resetTimeout();
        pressTimeout = setTimeout(() => {
            flagTile();
            resetTimeout();
        }, pressCooldown);
    }

    function resetTimeout() {
        if (pressTimeout !== null) {
            clearTimeout(pressTimeout);
            pressTimeout = null;
        }
    }

    function endTimeout() {
        resetTimeout();
        clearTiles();
    }

    function keyboardHandler(e: KeyboardEvent) {
        if (e.key === "f") return flagTile();
        if (e.key.startsWith("Arrow")) {
            const index = ["Up", "Right", "Down", "Left"].indexOf(
                e.key.slice(5)
            );
            const yMap = [-1, 0, 1, 0];

            const el = document.querySelector(
                `.y-${clamp(0, yMap[index] + y, board.columns - 1)}.x-${clamp(
                    0,
                    yMap[(index + 1) % 4] + x,
                    board.rows - 1
                )}`
            ) satisfies HTMLElement;
            console.log(index, e.key, yMap, el.focus());
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<button
    class="tile y-{y} x-{x}"
    on:touchstart={startTimeout}
    on:mousedown={startTimeout}
    on:mouseup={endTimeout}
    on:mouseleave={resetTimeout}
    on:touchcancel={endTimeout}
    on:touchend={endTimeout}
    on:click={clearTiles}
    on:keydown={keyboardHandler}
    style:grid-area="{y + 1} / {x + 1}"
    style:--size={size}
>
    {#key shown}
        <span
            in:fade={{ duration: transitionDuration, easing: sineOut }}
            out:outTransition
            class="tile-content"
            class:shown
        >
            {#if shown}
                {#if bomb}
                    💣
                {:else}
                    {value}
                {/if}
            {:else if flagged}
                🚩
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
        overflow: clip;
        // TODO: Figure out how to not make the other tiles overlap the css outline
        border: {
            radius: 0;
            style: solid;
            width: 2px;
            color: transparent;
        }

        &:where(:hover, :focus, :focus-visible, :focus-within) {
            border-color: black;
        }

        .tile-content {
            grid-area: 1 / 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff6;
            font-size: 1.75rem;
        }
    }
</style>
