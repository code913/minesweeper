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
const BOARD_SIZE = [5, 8];

// #endregion

// #region Helper functions

function rand(numArr, exclude) {
    [numArr, exclude] = [Array.isArray(numArr) ? numArr : [0, numArr], exclude || []];
    let randNum = Math.round(Math.random() * (numArr[1] - numArr[0])) + numArr[0];
    return exclude.includes(randNum) ? rand(...arguments) : randNum;
}

function generateBoard(width, height, bombs) {
    let board = Array(width).fill(Array(height).fill(0)).map((arr, x) => arr.map((_, y) => ({ x, y, type: CELL_TYPES.NUM, hidden: true })));
    board.height = board[0].length;
    board.width = board.length;
    Array(bombs).fill(0).reduce(acc => {
        let n = Math.floor(rand(width * height * 100 - 1, acc) / 100),
            x = n % width,
            y = (n + (height - n % height)) / height;

        board[x][y].type = CELL_TYPES.BOMB;
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
        let children = !hidden ? calculateNeighbours(attrs.cell).filter(c => c.type === CELL_TYPES.BOMB).length : "";

        return m("button", {
            class: `cell-${type}`,
            style: `
                ${children ? `background-color: ${COLORS.NUM[children]}` : ""}
            `,
            onclick() {
                board[x][y].hidden = false;

                if (type === CELL_TYPES.BOMB) {
                    alert("dumbass you lost");
                }
            }
        }, children);
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
                width: ${BOARD_SIZE[0] * 3}rem;
                height: ${BOARD_SIZE[1] * 3}rem;
                display: grid;
                grid-template-columns: repeat(${BOARD_SIZE[0]}, 1fr);
                grid-template-rows: repeat(${BOARD_SIZE[1]}, 1fr);
                grid-auto-flow: column;
                gap: 0.25rem;
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