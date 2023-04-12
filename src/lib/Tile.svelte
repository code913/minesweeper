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
    let pressTimeout: number = null;
    let releaseTimeout: number = null;
    let board = getContext<Board>("board");
    let isMobile = getContext<boolean>("isMobile");

    const colors = {
        hidden: ["#97CCF8", "#84B3E7"],
        shown: ["#d7b899", "#e5c29f"],
    };
    const transitionDuration = 250;
    const pressCooldown = 200;

    function outTransition(node: HTMLSpanElement) {
        const x = randomRange(-20, 20),
            y = -100,
            r = randomRange(-60, 60);

        return {
            duration: transitionDuration,
            easing: sineOut,
            css: (t: number, u: number) =>
                `transform: rotate(${r}deg) translate(${x}%, ${y}%);`.replace(/[0-9\-.]+/g, (n) => (u * +n).toFixed(3)) + `opacity: ${t.toFixed(3)}`,
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
        resetPressTimeout();
        board.assign(x, y, {
            flagged: !flagged,
        });
    }

    function resetPressTimeout() {
        clearTimeout(pressTimeout);
        pressTimeout = null;
    }

    function setPressTimeout(callback: () => void) {
        resetPressTimeout();
        pressTimeout = setTimeout(callback, pressCooldown);
    }

    function clickHandler(e: MouseEvent) {
        resetPressTimeout();
        // Right click or double click/tap to flag tile
        if (e.button !== 0 || e.detail > 1) return flagTile();

        // Single click/tap to clear tiles
        setPressTimeout(clearTiles);
    }

    function keyboardHandler(e: KeyboardEvent) {
        // F key to flag tile
        if (e.key === "f") return flagTile();

        // Arrow keys to move around the board
        if (e.key.startsWith("Arrow")) {
            const index = ["Up", "Right", "Down", "Left"].indexOf(e.key.slice(5));
            const yMap = [-1, 0, 1, 0];

            (
                document.querySelector(
                    `.y-${clamp(0, yMap[index] + y, board.rows - 1)}.x-${clamp(0, yMap[(index + 1) % 4] + x, board.columns - 1)}`
                ) as HTMLElement
            ).focus();
        }
    }
</script>

<button
    class="tile y-{y} x-{x}"
    class:shown
    style:grid-area="{y + 1} / {x + 1}"
    style:--size={size}
    on:click={clickHandler}
    on:keydown={keyboardHandler}
>
    {#key shown}
        <span
            in:fade={{ duration: transitionDuration, easing: sineOut }}
            out:outTransition
            class="tile-content"
            class:shown
            style:color="hsl({200 + value * 20}deg, 100%, 40%)"
            style:background-color={colors[shown ? "shown" : "hidden"][(x + y) % 2]}
        >
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
        }

        &.shown {
            .tile-content {
                backdrop-filter: saturate(50%);
                font: {
                    weight: bolder;
                    family: monospace;
                }
                line-height: 1;
            }
        }
    }
</style>
