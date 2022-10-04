import m from "mithril";
import "./index.scss";

// #region Constants

const root = document.body;
const CELL_TYPES = {
    NUM: "num",
    BOMB: "bomb"
};
const LEVELS = {
    easy: { name: "easy", bombs: 8 },
    medium: { name: "medium", bombs: 12 },
    hard: { name: "hard", bombs: 20 }
};
const BOARD_SIZE = [15, 12];
const MAX_RECUR_DEPTH = 3;

// #endregion

// #region State variables
let level = LEVELS.hard;
let board = generateBoard(...BOARD_SIZE, level.bombs);
// #endregion

// #region Helper functions

function rand(minmax, exclude) {
    let min, max;

    [min, max, ...exclude] = [
        [minmax[0] ?? 0, minmax[1] ?? minmax],
        exclude
    ].flat(1);

    let numArr = Array(max - min - exclude.length).fill(0).map((_, i) => i + 1 + min);

    return numArr[Math.floor(Math.random() * numArr.length)];
}

function generateBoard(width, height, bombs) {
    let board = Array(width).fill(Array(height).fill(0)).map((arr, x) => arr.map((_, y) => ({ x, y, type: CELL_TYPES.NUM, hidden: true })));
    board.height = board[0].length;
    board.width = board.length;
    Array(bombs).fill(0).reduce(acc => {
        let n = rand(width * height - 1, acc),
            x = n % width,
            y = Math.floor(n / width);

        board[x][y].type = CELL_TYPES.BOMB;

        return acc.concat(n);
    }, []);

    board = board.map(row => row.map(cell => ({
        ...cell,
        neighbourBombs: (
            cell.type === CELL_TYPES.BOMB
            ? null
            : calculateNeighbouringCells(board, cell).filter(c => c.type === CELL_TYPES.BOMB).length
        )
    })));

    return board;
}

function calculateNeighbouringCells(board, cell) {
    let arr = [];
    for (let x = Math.max(0, cell.x - 1); x <= Math.min(board.width - 1, cell.x + 1); x++) {
        for (let y = Math.max(0, cell.y - 1); y <= Math.min(board.height - 1, cell.y + 1); y++) {
            if (x === cell.x && y === cell.y) continue;
            arr.push(board[x][y]);
        }
    }

    return arr;
}

function calculateEmptyCells(cell, curDepth = 0) {
    let accumulator = [];
    console.log({ cell });
    const emptyNeighbours = calculateNeighbouringCells(board, cell).filter(c => console.log({ c }) || c.neighbourBombs === 0);
    console.log({ emptyNeighbours });
    if (emptyNeighbours.length) {
        accumulator.push(...emptyNeighbours);
        if (curDepth < MAX_RECUR_DEPTH) {
            accumulator.push(...emptyNeighbours.map(c => calculateEmptyCells(c, curDepth + 1)).flat(1));
        }
    }

    return accumulator;
}

// #endregion

// #region Components

const Cell = {
    view({ attrs }) {
        const { x, y, type, hidden, neighbourBombs } = attrs.cell;

        return m(`button.cell`, {
            style: `
                grid-column: ${x + 1};
                grid-row: ${y + 1};
            `,
            class: `${hidden ? "hidden" : type + (type === CELL_TYPES.NUM ? "-" + neighbourBombs : "")}`,
            onclick() {
                let emptyCells = calculateEmptyCells(attrs.cell);
                board = board.map(row => row.map(c => emptyCells.some(_c => _c.x === c && _c.y === c.y) ? { ...c, hidden: false } : c));
                console.log({ emptyCells, board });

                if (type === CELL_TYPES.BOMB) {
                    console.log("you lost :(");
                }
            }
        });
    }
};

const Options = {
    view() {
        return m()
    }
};

const Board = {
    view() {
        return m("div", {
            class: "board",
            style: `
                width: ${BOARD_SIZE[0] * 2}rem;
                height: ${BOARD_SIZE[1] * 2}rem;
                display: grid;
                grid-template-columns: repeat(${BOARD_SIZE[0]}, 1fr);
                grid-template-rows: repeat(${BOARD_SIZE[1]}, 1fr);
            `
        }, board.map(row => row.map(cell => m(Cell, { cell })).flat(1)));
    }
};

const Main = {
    view() {
        return m("main", {
            style: `
                display: grid;
                place-items: center;
                height: 100vh;
                width: 100vw;
            `
        }, [m(Board)])
    }
};

// #endregion

m.mount(root, Main);
