<script lang="ts">
	import "$lib/global.scss";
	import { type Tile as TileType, Board } from "$lib/Game";
	import Tile from "$lib/Tile.svelte";
	import { setContext } from "svelte";
	import { writable, type Writable } from "svelte/store";

	const boardSize = [10, 8];
	const tileSize = "2rem";

	// TODO: Flip the columns and rows on mobile to make up for shorter width
	let [columns, rows] = boardSize;
	let tileStore: Writable<TileType[]> = writable([]);
	let board = new Board(columns, rows, 8, tileStore);

	setContext("board", board);
</script>

<header>
	<h1>Minesweeper</h1>
	<h2>Being re-written in Svelte</h2>
</header>
<button
	on:click={() => {
		for (let i = 0; i < columns * rows; i++) {
			let { x, y } = board.convertIntToXY(i);
			board.assign(x, y, { shown: true });
		}
	}}>Show All</button
>
<div class="board" style="--columns: {columns}; --rows: {rows}; --tile-size: {tileSize};">
	{#each $tileStore as tile}
		<Tile {tile} size={tileSize} />
	{/each}
</div>

<style lang="scss">
	header {
		text-align: center;
	}

	.board {
		$columns: var(--columns);
		$rows: var(--rows);
		$tile-size: var(--tile-size);
		display: grid;
		grid-template: {
			columns: repeat($columns, $tile-size);
			rows: repeat($rows, $tile-size);
		}
	}
</style>
