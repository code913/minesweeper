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
    PRIMARYCLICK: "primaryclick",
    SECONDARYCLICK: "secondaryclick",
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
const GAME_PLAY_STATES = {
    PLAYING: "playing",
    WINNING: "W",
    LOSING: "L",
    ENDED: "ended"
};
// #endregion

// #region State variables
let mode;
let board;
let gameState;

resetStates();

setInterval(() => {
    if (gameState.playState === GAME_PLAY_STATES.PLAYING) gameState.timeElapsed += 69
}, 69);

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
    let board = Array(width).fill(Array(height).fill(0)).map((arr, x) => arr.map((_, y) => ({ x, y, type: CELL_TYPES.NUM, hidden: true, flagged: false })));

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
    if (gameState.playState !== GAME_PLAY_STATES.PLAYING) return;

    const { target } = event;
    let targetCell = childInfo?.cell;

    if (!(targetCell ?? false)) {
        const [, x, y] = target.id.split("-");
        targetCell = board[x][y];
    }

    switch (type) {
        case EVENTS.ARROWLEFT:
        case EVENTS.ARROWUP:
        case EVENTS.ARROWRIGHT:
        case EVENTS.ARROWDOWN:
            const neighbours = calculateNeighbouringCells(board, targetCell);
            const coord = COORDS[type];
            const toFocusCell = neighbours.find(c => targetCell.x + coord[0] === c.x && targetCell.y + coord[1] === c.y);
            const toFocus = document.querySelector(`#cell-${toFocusCell?.x}-${toFocusCell?.y}`);

            toFocus?.focus();
        break;
        case EVENTS.PRIMARYCLICK:
            if (!targetCell.hidden) return;
            
            let emptyCells = calculateEmptyCells(targetCell);
            board = board.map(row => row.map(c => emptyCells.some(_c => _c.x === c.x && _c.y === c.y) ? { ...c, hidden: false } : c));

            if (targetCell.type === CELL_TYPES.BOMB) {
                gameState.playState = GAME_PLAY_STATES.LOSING;

                let i = 0;
                board.forEach((row, x) => row.forEach((cell, y) => {
                    if (cell.type === CELL_TYPES.BOMB) {
                        i++;
                        setTimeout(() => {
                            board[x][y] = {
                                ...cell,
                                hidden: false,
                                flagged: false
                            };

                            m.redraw()
                        }, i * 100 + 500);
                    }
                }));

                setTimeout(() => {
                    console.log("ran menu timeout")
                    gameState.playState = GAME_PLAY_STATES.ENDED;
                    m.redraw();
                }, i * 100 + 1500);
            } else checkWin();
        break;
        case EVENTS.SECONDARYCLICK:
        case EVENTS.F:
            if (!targetCell.hidden) return;
            let cell = board[targetCell.x][targetCell.y];
            cell.flagged = !cell.flagged;

            checkWin();
        break;
    }

    function checkWin() {
        if (board.every(row => row.every(cell => cell.type === CELL_TYPES.BOMB ? cell.flagged : !cell.flagged))) {
            gameState.playState = GAME_PLAY_STATES.WINNING;

            // TODO: Add some animations

            setTimeout(() => {
                gameState.playState = GAME_PLAY_STATES.ENDED;
                gameState.won = true;
                m.redraw();
            }, 500);
        }
    }
}

function formatTime(ms) {
    return new Date(ms).toISOString().substring(14, 19);
}

function resetStates() {
    mode ??= MODES.easy;
    board = generateBoard();
    gameState = {
        playState: GAME_PLAY_STATES.PLAYING,
        timeElapsed: 0,
        won: false
    };
}

// #endregion

// #region Components

const Cell = {
    view({ attrs }) {
        const { x, y, type, hidden, neighbourBombs, flagged } = attrs.cell;

        return m(`button.cell`, {
            id: `cell-${x}-${y}`,
            style: `
                grid-column: ${x + 1};
                grid-row: ${y + 1};
            `,
            tabindex: gameState.playState === GAME_PLAY_STATES.PLAYING ? "0" : "-1",
            class: `${flagged ? "flagged" : hidden ? "hidden" : type + (type === CELL_TYPES.NUM ? "-" + neighbourBombs : "")}`,
            onclick(event) {
                eventHandler(event.button === 0 ? EVENTS.PRIMARYCLICK : EVENTS.SECONDARYCLICK, event, { cell: attrs.cell });
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
                    resetStates();
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

const Menu = {
    view() {
        const { timeElapsed, won } = gameState;

        return m("div.menu", [
            m("section.menu-content", [
                m("h2", { class: won ? "winner" : "loser" }, `You ${won ? "won :)" : "lost :("}`),
                m("ul", [
                    m("li", ["Time taken: ", formatTime(timeElapsed) ])
                ]),
                m("button", {
                    oncreate(vnode) {
                        vnode.dom.focus();
                    },
                    onclick() {
                        resetStates();
                        document.querySelector("#cell-0-0").focus();
                    }
                }, "Restart game")
            ])
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
                
                if (target.classList.contains("cell")) {
                    let type = EVENTS[key.toUpperCase()];

                    if (type) eventHandler(type, e);
                }
            }
        }, board.map(row => row.map(cell => m(Cell, { cell }))).flat(2));
    }
};

const Main = {
    view() {
        return [
            m(Info),
            m("div.container", [
                m(Board),
                gameState.playState === GAME_PLAY_STATES.ENDED ? m(Menu) : null
            ])
        ];
    }
};

// #endregion

m.mount(root, Main);
