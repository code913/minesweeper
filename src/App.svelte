<script lang="ts">
	import { Board, type MenuState, type Tile as TileType } from "$lib/Game";
	import Tile from "$lib/Tile.svelte";
	import "$lib/global.scss";
	import { onMount } from "svelte";
	import { writable, type Writable } from "svelte/store";
	import { fade } from "svelte/transition";

	const boardSize: [number, number] = [10, 8];
	const tileSize = "min(48px, 4rem, 10vw)";

	let tileStore: Writable<TileType[]> = writable([]);
	let result: string | null = null;
	let menuState: MenuState = {
		open: false,
		page: "resultScreen",
	};
	let columns: number, rows: number, board: Board, isMobile: boolean;

	function updateSize() {
		isMobile = window.innerWidth <= 700;
		[columns, rows] = isMobile ? [...boardSize].reverse() : boardSize;
		board = new Board(columns, rows, 8, tileStore);
	}

	function reset() {
		updateSize();
		result = null;
		menuState.open = false;
	}

	onMount(() => {
		updateSize();

		new ResizeObserver(updateSize).observe(document.body);
	});
</script>

<header style:margin-bottom="1rem">
	<h1>Minesweeper</h1>
	<!-- these buttons are for testing -->
	<button
		on:click={() => {
			for (let i = 0; i < columns * rows; i++) {
				let { x, y } = board.convertIntToXY(i);
				board.assign(x, y, { shown: true });
			}
		}}>Show All</button
	>
	<button on:click={reset}>Reset</button>
	<label>
		Menu page:
		<select bind:value={menuState.page}>
			<option value="resultScreen">result screen</option>
			<option value="settings">settings</option>
			<option value="tutorial">tutorial</option>
		</select>
	</label>
	<button on:click={() => (menuState.open = !menuState.open)}>Open/Close menu</button>
</header>
{#if board}
	<div class="wrapper">
		<div class="board" style="--columns: {columns}; --rows: {rows}; --tile-size: {tileSize}; pointer-events: {result ? 'none' : 'auto'};">
			{#each $tileStore as tile}
				<Tile {tile} size={tileSize} {board} bind:result bind:menuState />
			{/each}
		</div>
		{#if menuState.open}
			<div class="menu" in:fade>
				<!-- wish we had a #switch statement -->
				{#if menuState.page === "resultScreen"}
					<p>You {result}!</p>
					<button on:click={reset}>Restart</button>
				{:else if menuState.page === "settings"}
					<form class="settings" on:submit={(e) => e.preventDefault()} />
				{:else if menuState.page === "tutorial"}
					<p>currently a work in progress lol</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	header {
		text-align: center;
	}

	.board {
		display: grid;
		gap: 0;
		outline: 3px solid #0008;
	}

	.wrapper {
		position: relative;
	}

	.menu {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: grid;
		backdrop-filter: blur(5px) brightness(70%);
		place-items: center;
	}
</style>
