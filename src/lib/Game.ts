import type { Writable } from "svelte/store";
import {
    randomRange
} from "./utils";

export type Tile = {
    x: number;
    y: number;
    value?: number;
    bomb?: boolean;
    shown: boolean;
};

export class Board {
    columns: number;
    rows: number;
    tileStore: Writable<Tile[]>
    _tiles!: Tile[]
    /**
     * @param {number} columns 
     * @param {number} rows 
     * @param {number} bombs Number of bombs to place on the board
     */
    constructor(columns: number, rows: number, bombs: number, tileStore: Writable<Tile[]>) {
        Object.assign(this, { columns, rows, tileStore });

        this.tileStore.subscribe((function (tiles) {
            this._tiles = tiles;
        }).bind(this));
        this.tileStore.set(Array(columns * rows)
            .fill(0)
            .map((_, i) => ({ ...this.convertIntToXY(i), value: 0, shown: false })));

        let bombLocations = [];

        for (let i = 0; i < bombs; i++) {
            bombLocations.push(this.convertIntToXY(randomRange(0, columns * rows - 1, bombLocations)));
        }

        for (let bomb of bombLocations) {
            this.assign(bomb.x, bomb.y, { bomb: true });
            for (let tile of this.getNeighbouringTiles(bomb)) tile.value++;
        }
    }

    /**
     * Returns the x and y value of a tile in the board based on its number. Makes the math for generating random tiles way simpler.
     * @param {number} n The tile number, starting from top left and going right
     * @returns An object containing the x and y value
     */
    convertIntToXY(n: number) {
        return {
            x: n % this.columns,
            y: Math.floor(n / this.columns)
        };
    }

    /**
     * Inverse of this.convertIntToXY
     * @param {number} x 
     * @param {number} y 
     */
    convertXYToInt(x: number, y: number) {
        return x + y * this.columns;
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @returns A reference to the tile
     */
    get(x: number, y: number) {
        return this._tiles[this.convertXYToInt(x, y)];
    }

    /**
     * Change properties of a tile
     * @param {Tile} data Object containing properties to override the tile with
     */
    assign(x: number, y: number, data: Partial<Tile>) {
        this.tileStore.update(store => {
            Object.assign(this.get(x, y), data);
            return store;
        });
    }

    /**
     * Get the 3-8 tiles surrounding a tile
     */
    getNeighbouringTiles(tile: Tile): Tile[] {
        let arr = [];
        for (let x = Math.max(0, tile.x - 1); x <= Math.min(this.columns - 1, tile.x + 1); x++) {
            for (let y = Math.max(0, tile.y - 1); y <= Math.min(this.rows - 1, tile.y + 1); y++) {
                if (x === tile.x && y === tile.y) continue;
                arr.push(this.get(x, y));
            }
        }

        return arr;
    }

    /**
     * When a tile is clicked, this method is invoked to get the number of empty cells around it and the ending numbered cells to quickly clear them out. Takes a tile, and recursively gets empty tiles from it until the max depth limit is reached. The ending numbers are also included.
     * @param {number} maxDepth Maximum amount of distance till which to find empty tiles
     */
    getClearableTiles(tile: Tile, maxDepth: number = 1): Tile[] {
        let accumulator = [];

        for (let currentDepth = 0; currentDepth < maxDepth; currentDepth++) {
            const
                neighbours = this.getNeighbouringTiles(tile),
                numberedNeighbours = neighbours.filter(t => t.value > 0),
                emptyNeighbours = neighbours.filter(t => t.value === 0);

            if (tile.value !== 0) continue;

            if (currentDepth < maxDepth) {
                accumulator.push(...emptyNeighbours.map(t => [t, this.getClearableTiles(t, maxDepth - 1)]).flat(1));
            } else {
                accumulator.push(...numberedNeighbours);
            }
        }

        return accumulator.flat(1);
    }
}