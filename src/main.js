import m from "mithril";
import "./index.scss";

// #region Constants

const root = document.body;
const CELL_TYPES = {
    NUM: "num",
    BOMB: "bomb"
};
const MODES = {
    easy: { name: "easy", bombs: 16 },
    medium: { name: "medium", bombs: 24 },
    hard: { name: "hard", bombs: 32 }
};
const EVENTS = {
    CLICK: "click",
    F: "f",
    ARROWLEFT: "arrowleft",
    ARROWUP: "arrowup",
    ARROWRIGHT: "arrowright",
    ARROWDOWN: "arrowdown"
};
const BOARD_SIZE = [15, 12];
const MAX_RECUR_DEPTH = 2;
const COORDS = {
    [EVENTS.ARROWLEFT]: [-1, 0],
    [EVENTS.ARROWUP]: [0 ,-1],
    [EVENTS.ARROWRIGHT]: [1 , 0],
    [EVENTS.ARROWDOWN]: [0 , 1]
};

// #endregion

// #region State variables
let mode = MODES.easy;
let board = generateBoard();
// #endregion

// #region Helper functions

function rand(minmax, exclude) {
    let min, max;

    [min, max, ...exclude] = [
        [minmax[0] ?? 0, minmax[1] ?? minmax],
        exclude
    ].flat(1);

    let numArr = Array(max - min - exclude.length).fill(0).map((_, i) => i + 1 + min).filter(n => !exclude.includes(n));

    return numArr[Math.floor(Math.random() * numArr.length)];
}

function generateBoard() {
    const [width, height, bombs] = [...BOARD_SIZE, mode.bombs];
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

function eventHandler(type, event, childInfo) {
    const { target } = event;
    let targetCell = childInfo?.cell;

    if (!(targetCell ?? false)) {
        console.log({ targetCell });
        const [y, x] = target.style.gridArea.split("/").map(s => +s.trim());
        targetCell = board[x - 1][y - 1];
    }

    console.log({ type, event, childInfo, target, targetCell });

    switch (type) {
        case EVENTS.ARROWLEFT:
        case EVENTS.ARROWUP:
        case EVENTS.ARROWRIGHT:
        case EVENTS.ARROWDOWN:
            const neighbours = calculateNeighbouringCells(board, targetCell);
            const coord = COORDS[type];
            const toFocusCell = neighbours.find(c => targetCell.x + coord[0] === c.x && targetCell.y + coord[1] === c.y);
            const toFocus = document.querySelector(`#cell-${toFocusCell?.x}-${toFocusCell?.y}`);

            console.log({ neighbours, coord, toFocusCell, toFocus });
            toFocus?.focus();
        break;
        case EVENTS.CLICK:
            (event.button != 0 && [alert("potato"), console.log(event)]);
            if (!targetCell.hidden) return;
            let emptyCells = calculateEmptyCells(targetCell);
            board = board.map(row => row.map(c => emptyCells.some(_c => _c.x === c.x && _c.y === c.y) ? { ...c, hidden: false } : c));

            if (type === CELL_TYPES.BOMB) {
                console.log("you lost :(");
            }
        break;
    }
}

// #endregion

// #region Components

const Cell = {
    view({ attrs }) {
        const { x, y, type, hidden, neighbourBombs } = attrs.cell;

        return m(`button.cell`, {
            id: `cell-${x}-${y}`,
            style: `
                grid-column: ${x + 1};
                grid-row: ${y + 1};
            `,
            class: `${hidden ? "hidden" : type + (type === CELL_TYPES.NUM ? "-" + neighbourBombs : "")}`,
            onclick(event) {
                eventHandler(EVENTS.CLICK, event, { cell: attrs.cell });
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
                m("li", [m("code", "TAB"), "or", m("code", "Arrow Keys"), "- Select cells"]),
                m("li", [m("code", "SPACE"), "or", m("code", "Left Click"), "- Dig cells"]),
                m("li", [m("code", "F"), "or", m("code", "Right Click"), "- Flag a cell"])
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
        }, [
            m("label", { for: "game-mode-select" }, "Game mode: "),
            m("select", {
                id: "game-mode-select",
                onchange(event) {
                    event.preventDefault();
                    mode = MODES[event.target.value];
                    board = generateBoard();
                }
            }, Object.values(MODES).map(({ name, bombs }) => m("option", { value: name, selected: name === mode.name }, `${[name[0].toUpperCase(), ...name.split("").slice(1)].join("")} (${bombs} bombs)`)))
        ]);
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
            `,
            onkeydown(e) {
                const { target, key } = e;
                console.log({ e });
                if (target.classList.contains("cell")) {
                    let type = EVENTS[key.toUpperCase()];

                    console.log({ type, target, key });

                    if (type) eventHandler(type, e);
                }
            }
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
