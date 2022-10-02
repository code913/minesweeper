import m from "mithril";
import "./index.scss";

// #region Constants

const root = document.body;
const CELL_TYPES = {
    NUM: "num",
    BOMB: "bomb"
};
const LEVELS = {
    easy: { name: "easy", bombs: 4 },
    medium: { name: "medium", bombs: 8 },
    hard: { name: "hard", bombs: 12 }
};
const COLORS = {
    // https://chakra-ui.com/theme
    NUM: {
        9: "hsla(0, 88%, 68%, 1)",
        8: "hsla(4, 68%, 65%, 1)",
        7: "hsla(9, 52%, 61%, 1)",
        6: "hsla(17, 37%, 58%, 1)",
        5: "hsla(31, 25%, 54%, 1)",
        4: "hsla(60, 15%, 51%, 1)",
        3: "hsla(98, 18%, 53%, 1)",
        2: "hsla(126, 25%, 55%, 1)",
        1: "hsla(139, 36%, 53%, 1)",
        0: "hsla(145, 46%, 51%, 1)"
    }
};
const BOARD_SIZE = [15, 12];

// #endregion

// #region Helper functions

function rand(minmax, exclude) {
    [min, max, ...exclude] = [
        [minmax[0] ?? 0, minmax[1] ?? minmax],
        [exclude]
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

    return board;
}

function calculateNeighbours(cell) {
    let arr = [];
    for (let x = Math.max(0, cell.x - 1); x <= Math.min(board.width - 1, cell.x + 1); x++) {
        for (let y = Math.max(0, cell.y - 1); y <= Math.min(board.height - 1, cell.y + 1); y++) {
            if (x === cell.x && y === cell.y) continue;
            arr.push(board[x][y]);
        }
    }
    return arr;
}

// #endregion

// #region State variables
// fuck you var haters
var level = LEVELS.hard;
var board = generateBoard(...BOARD_SIZE, level.bombs);
// #endregion

// #region Components

const Cell = {
    view({ attrs }) {
        const { x, y, type, hidden } = attrs.cell;

        let neighbourBombs = hidden || type === CELL_TYPES.BOMB ? null : calculateNeighbours(attrs.cell).filter(c => c.type === CELL_TYPES.BOMB).length;

        return m("button.cell", {
            style: `
                column: ${x + 1},
                row: ${y + 1}
            `,
            class: `${hidden ? "hidden" : type + (type === CELL_TYPES.NUM ? "-" + neighbourBombs : "")}`,
            onclick() {
                board[x][y].hidden = false;

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