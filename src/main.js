import m from "mithril";

// #region Constants

const root = document.body;
const CELLS = {
    NUM: 0,
    BOMB: 1
};
const LEVELS = {
    easy: { name: "easy", bombs: 4 },
    medium: { name: "medium", bombs: 8 },
    hard: { name: "hard", bombs: 12 }
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
    let board = Array(width).fill(Array(height).fill(0)).map((arr, x) => arr.map((_, y) => ({ x, y, type: CELLS.NUM })));
    board.height = board[0].length;
    board.width = board.length;
    Array(bombs).fill(0).reduce(acc => {
        let n = rand(width * height - 1, acc),
            x = n % width,
            y = (n + (height - n % height)) / height;

        console.log({ n, x, y });

        board[x][y].type = CELLS.BOMB;
    }, []);

    return board;
}

// #endregion

// #region State variables
var level = LEVELS.easy;
var board = generateBoard(...BOARD_SIZE, level.bombs);
// #endregion

// #region Components

const Cell = {
    view({ attrs }) {
        const { type, x, y } = attrs.cell;

        return m("button", {
            class: `cell-${type}`
        }, type);
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