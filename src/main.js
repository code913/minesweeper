import m from "mithril";
import "./index.scss";

// #region Constants

const root = document.body;
const CELL_TYPES = {
    NUM: "num",
    BOMB: "bomb"
};
const LEVELS = {
    easy: { name: "easy", bombs: 16 },
    medium: { name: "medium", bombs: 24 },
    hard: { name: "hard", bombs: 32 }
};
const BOARD_SIZE = [15, 12];
const MAX_RECUR_DEPTH = 2;

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
    for (let x = Math.max(0, cell.x - 1); x <= Math.min(board.length - 1, cell.x + 1); x++) {
        for (let y = Math.max(0, cell.y - 1); y <= Math.min(board[0].length - 1, cell.y + 1); y++) {
            if (x === cell.x && y === cell.y) continue;
            arr.push(board[x][y]);
        }
    }

    return arr;
}

function calculateEmptyCells(cell, curDepth = 1) {
    let accumulator = [cell];
    const neighbours = calculateNeighbouringCells(board, cell);
    const numberedNeighbours = neighbours.filter(c => c.neighbourBombs > 0);
    const emptyNeighbours = neighbours.filter(c => c.neighbourBombs === 0);

    accumulator.push(...emptyNeighbours);

    if (cell.neighbourBombs === 0) {
        if (curDepth < MAX_RECUR_DEPTH) {
            accumulator.push(...emptyNeighbours.map(c => calculateEmptyCells(c, curDepth + 1)).flat(1));
        } else if (curDepth === MAX_RECUR_DEPTH) {
            accumulator.push(...numberedNeighbours);
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
                if (!hidden) return;
                let emptyCells = calculateEmptyCells(attrs.cell);
                board = board.map(row => row.map(c => emptyCells.some(_c => _c.x === c.x && _c.y === c.y) ? { ...c, hidden: false } : c));

                if (type === CELL_TYPES.BOMB) {
                    console.log("you lost :(");
                }
            }
        });
    }
};

const HowToPlay = {
    view() {
        return m("details", [
            m("summary", "How to play"),
            m("p", "There are hidden bombs scattered around the map. Dig cells to clear areas unlikely to contain bombs. Some cells are numbered, indicating the number of bombs around them. Use big brain logic to flag cells likely to contain bombs. Once all bomb-containing cells are flagged and all other cells cleared, you win! ...or you may dig a cell containing a bomb, in which case you lose"),
            m("h2", "Controls"),
            m("ul", [
                m("li", ["TAB", "or", "Arrow Keys", "- Select cells"]),
                m("li", ["SPACE", "or", "Left Click", "- Dig cells"]),
                m("li", ["F", "or", "Right Click", "- Flag a cell"])
            ])
        ]);
    }
}

const Options = {
    view() {
        return m("form", {
            onsubmit(event) {
                event.preventDefault();
            }
        })
    }
};

const Info = {
    view() {
        return m("div.info", [
            m("header", [
                m("h1", "Minesweeper!"),
                m("p", ["created with love by ", m("a", { href: "https://github.com/code913/minesweeper" }, "code913")]),
            ]),
            m(HowToPlay),
            m(Options)
        ]);
    }
};

const Board = {
    view() {
        return m("div.board", {
            style: `
                width: ${BOARD_SIZE[0] * 2}rem;
                height: ${BOARD_SIZE[1] * 2}rem;
                grid-template-columns: repeat(${BOARD_SIZE[0]}, 1fr);
                grid-template-rows: repeat(${BOARD_SIZE[1]}, 1fr);
            `
        }, board.map(row => row.map(cell => m(Cell, { cell })).flat(1)));
    }
};

const Main = {
    view() {
        return m("div.container", [m(Info), m(Board)])
    }
};

// #endregion

m.mount(root, Main);
