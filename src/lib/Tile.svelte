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
            css: (t, u) => {
                let c = `transform: rotate(${r}deg) translate(${x}%, ${y}%);`.replace(/[0-9\-.]+/g, (n) => (u * +n).toFixed(3)) + `opacity: ${t.toFixed(3)}`;
                // console.log(c);
                return c;
            },
        };
    }

    function clearTiles() {
        if (shown || flagged) return;

        for (let t of board.getClearableTiles(tile))
            board.assign(t.x, t.y, {
                shown: true,
            });
    }

    function flagTile() {
        resetTimeout();
        board.assign(x, y, {
            flagged: !flagged,
        });
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
            const index = ["Up", "Right", "Down", "Left"].indexOf(e.key.slice(5));
            const yMap = [-1, 0, 1, 0];

            (document.querySelector(`.y-${clamp(0, yMap[index] + y, board.rows - 1)}.x-${clamp(0, yMap[(index + 1) % 4] + x, board.columns - 1)}`) as HTMLElement).focus();
        }
    }
</script>

<button
    class="tile y-{y} x-{x}"
    class:shown
    style:grid-area="{y + 1} / {x + 1}"
    style:--size={size}
    style:--bg={(x + y) % 2 === 1 ? "#84B3E7" : "#97CCF8"}
    on:touchstart={startTimeout}
    on:mousedown={startTimeout}
    on:mouseup={endTimeout}
    on:mouseleave={resetTimeout}
    on:touchcancel={endTimeout}
    on:touchend={endTimeout}
    on:click={clearTiles}
    on:keydown={keyboardHandler}
>
    {#key shown}
        <span in:fade={{ duration: transitionDuration, easing: sineOut }} out:outTransition class="tile-content" class:shown style:--color="hsl({value * 40}deg, 70%, 50%)">
            {#if shown}
                {#if bomb}
                    💣
                {:else if value > 0}
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
        background-color: var(--bg);

        &:where(:hover, :focus, :focus-visible, :focus-within) {
            z-index: 1; // required for outline to not get covered by the tiles
        }

        .tile-content {
            grid-area: 1 / 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            color: var(--color);
        }

        &.shown {
            .tile-content {
                backdrop-filter: saturate(50%);
            }
        }
    }
</style>
