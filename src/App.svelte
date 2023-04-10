<script lang="ts">
	import "$lib/global.scss";
	import { type Tile as TileType, Board } from "$lib/Game";
	import Tile from "$lib/Tile.svelte";
	import { setContext } from "svelte";
	import { writable, type Writable } from "svelte/store";

	const boardSize: [number, number] = [10, 8];
	const tileSize = "min(4rem, 8vmin)";

	let tileStore: Writable<TileType[]> = writable([]);
	let columns: number, rows: number, board: Board, isMobile: boolean;

	$: setContext("isMobile", isMobile);
	$: setContext("board", board);

	function updateSize() {
		isMobile = window.innerWidth <= 800;
		[columns, rows] = isMobile ? boardSize.reverse() : boardSize;
		board = new Board(columns, rows, 8, tileStore);
	}
</script>

<svelte:window on:load={updateSize} on:resize={updateSize} />

<header>
	<h1>Minesweeper</h1>
	<h2>Being re-written in Svelte</h2>
</header>
{#if board}
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
{/if}

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
		border: 3px solid #0008;
	}
</style>
