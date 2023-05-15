/**
 * Shuffle an array with the Fisher–Yates algorithm.
 *
 * Ref) https://www.30secondsofcode.org/js/s/shuffle/
 */
export const shuffleArray = (array, getRandom) => {
    const copied = array.slice();
    let m = copied.length;
    while (m) {
        const i = Math.floor(getRandom() * m);
        m--;
        [copied[m], copied[i]] = [copied[i], copied[m]];
    }
    return copied;
};
export const AllDirections = [
    "up",
    "down",
    "left",
    "right",
    "upLeft",
    "upRight",
    "downLeft",
    "downRight",
];
export const AllNumberOfSteps = [
    1, 2, 3,
];
export const createPowerCardDeck = () => {
    const drawPile = [];
    for (const direction of AllDirections) {
        for (const numberOfSteps of AllNumberOfSteps) {
            drawPile.push({ direction, numberOfSteps });
        }
    }
    return drawPile;
};
export const drawPowerCards = (drawPile, numberOfCardsDrawn) => {
    if (drawPile.length < numberOfCardsDrawn) {
        throw new Error("Not enough cards in the deck");
    }
    return {
        drawPile: drawPile.slice(numberOfCardsDrawn),
        drawn: drawPile.slice(0, numberOfCardsDrawn),
    };
};
export const arePowerCardsEqual = (a, b) => {
    return a.direction === b.direction && a.numberOfSteps === b.numberOfSteps;
};
export const arePlayerActionsEqual = (a, b) => {
    switch (a.kind) {
        case "drawCard":
            return b.kind === "drawCard";
        case "moveCrown":
            return (b.kind === "moveCrown" && arePowerCardsEqual(a.powerCard, b.powerCard));
        case "pass":
            return b.kind === "pass";
    }
};
export const MAX_TILE_GRID_SIZE = 9;
export const createTileGrid = (options = {}) => {
    const initialOccupation = options.initialOccupation || undefined;
    const tileGrid = [];
    for (let i = 0; i < MAX_TILE_GRID_SIZE; i++) {
        const row = [];
        for (let j = 0; j < MAX_TILE_GRID_SIZE; j++) {
            row.push({ occupation: undefined });
        }
        tileGrid.push(row);
    }
    if (initialOccupation !== undefined) {
        const lines = initialOccupation.split("\n");
        if (lines.length !== 9)
            throw new Error("invalid initialOccupation option");
        for (const [y, row] of tileGrid.entries()) {
            const line = lines[y];
            const characters = line.split("");
            for (const [x, tile] of row.entries()) {
                const character = characters[x];
                tile.occupation =
                    character === "0" ? 0 : character === "1" ? 1 : undefined;
            }
        }
    }
    return tileGrid;
};
export const createPlayer = () => {
    return {
        numberOfKnightCards: 4,
        powerCardHand: [],
    };
};
export const togglePlayerIndex = (playerIndex) => {
    return playerIndex === 0 ? 1 : 0;
};
export const isTileGridPositionValid = (tileGrid, position) => {
    const [x, y] = position;
    return (x >= 0 &&
        x < tileGrid.length &&
        y >= 0 &&
        y < tileGrid.length &&
        tileGrid[x][y] !== undefined);
};
export const getTile = (tileGrid, position) => {
    if (!isTileGridPositionValid(tileGrid, position)) {
        throw new Error("Invalid tile grid position");
    }
    return tileGrid[position[1]][position[0]];
};
const isKnightCardNecessaryForMovingTile = (tile, movingPlayerIndex) => {
    return tile.occupation !== undefined && tile.occupation !== movingPlayerIndex;
};
export const translateTileGridPositionByPowerCard = (tileGridPosition, powerCard) => {
    const [x, y] = tileGridPosition;
    const { direction, numberOfSteps } = powerCard;
    switch (direction) {
        case "up":
            return [x, y - numberOfSteps];
        case "down":
            return [x, y + numberOfSteps];
        case "left":
            return [x - numberOfSteps, y];
        case "right":
            return [x + numberOfSteps, y];
        case "upLeft":
            return [x - numberOfSteps, y - numberOfSteps];
        case "upRight":
            return [x + numberOfSteps, y - numberOfSteps];
        case "downLeft":
            return [x - numberOfSteps, y + numberOfSteps];
        case "downRight":
            return [x + numberOfSteps, y + numberOfSteps];
    }
};
export const canCrownBeMovedToTile = ({ crownPosition, hasKnightCard, playerIndex, powerCard, tileGrid, }) => {
    const nextCrownPosition = translateTileGridPositionByPowerCard(crownPosition, powerCard);
    if (!isTileGridPositionValid(tileGrid, nextCrownPosition)) {
        return false;
    }
    const nextCrownTile = getTile(tileGrid, nextCrownPosition);
    return (nextCrownTile.occupation === undefined ||
        (nextCrownTile.occupation !== playerIndex && hasKnightCard));
};
export const MAX_NUMBER_OF_POWER_CARDS = 5;
export const computeSelectablePlayerActions = ({ board, player, playerIndex, }) => {
    const playerActions = player.powerCardHand
        .filter((powerCard) => canCrownBeMovedToTile({
        crownPosition: board.crownPosition,
        hasKnightCard: player.numberOfKnightCards > 0,
        playerIndex,
        powerCard,
        tileGrid: board.tileGrid,
    }))
        .map((powerCard) => ({ kind: "moveCrown", powerCard }));
    if (player.powerCardHand.length < MAX_NUMBER_OF_POWER_CARDS) {
        playerActions.push({ kind: "drawCard" });
    }
    if (playerActions.length === 0) {
        playerActions.push({ kind: "pass" });
    }
    return playerActions;
};
export const createGame = (shuffledDeck) => {
    const { drawPile: drawPile5Drawn, drawn: powerCardHandForPlayer0 } = drawPowerCards(shuffledDeck, 5);
    const { drawPile: drawPile10Drawn, drawn: powerCardHandForPlayer1 } = drawPowerCards(drawPile5Drawn, 5);
    const players = [
        {
            ...createPlayer(),
            powerCardHand: powerCardHandForPlayer0,
        },
        {
            ...createPlayer(),
            powerCardHand: powerCardHandForPlayer1,
        },
    ];
    return {
        board: {
            crownPosition: [4, 4],
            tileGrid: createTileGrid(),
        },
        drawPile: drawPile10Drawn,
        discardPile: [],
        players,
    };
};
/**
 * @param shuffledDiscardPile Only used when draw pile is empty.
 */
export const resolvePlayerAction = (game, currentPlayerIndex, playerAction, shuffledDiscardPile) => {
    let newGame = { ...game };
    if (playerAction.kind === "drawCard") {
        // Exchange the draw pile and the shuffled discard pile if the draw pile is empty
        if (newGame.drawPile.length === 0) {
            newGame = {
                ...newGame,
                drawPile: shuffledDiscardPile,
                discardPile: [],
            };
        }
        // Draw a power card
        const { drawPile, drawn } = drawPowerCards(newGame.drawPile, 1);
        const newPlayers = [...newGame.players];
        newPlayers[currentPlayerIndex] = {
            ...newPlayers[currentPlayerIndex],
            powerCardHand: [
                ...newPlayers[currentPlayerIndex].powerCardHand,
                ...drawn,
            ],
        };
        newGame = {
            ...newGame,
            players: [newPlayers[0], newPlayers[1]],
            drawPile: drawPile,
        };
    }
    else if (playerAction.kind === "moveCrown") {
        const newCrownPosition = translateTileGridPositionByPowerCard(newGame.board.crownPosition, playerAction.powerCard);
        const newPlayers = [...newGame.players];
        // Occupy the tile
        let isKnightCardNecessary = false;
        const newTileGrid = game.board.tileGrid.map((row, y) => {
            return row.map((tile, x) => {
                if (x === newCrownPosition[0] && y === newCrownPosition[1]) {
                    isKnightCardNecessary = isKnightCardNecessaryForMovingTile(tile, currentPlayerIndex);
                    return {
                        ...tile,
                        occupation: currentPlayerIndex,
                    };
                }
                return tile;
            });
        });
        // Reduce current player's hand
        newPlayers[currentPlayerIndex] = {
            ...newPlayers[currentPlayerIndex],
            powerCardHand: newPlayers[currentPlayerIndex].powerCardHand.filter((powerCard) => !arePowerCardsEqual(powerCard, playerAction.powerCard)),
        };
        // Add discarded power card to discard pile
        const newDiscardPile = [...newGame.discardPile, playerAction.powerCard];
        // Reduce current player's knight card
        if (isKnightCardNecessary) {
            newPlayers[currentPlayerIndex] = {
                ...newPlayers[currentPlayerIndex],
                numberOfKnightCards: newPlayers[currentPlayerIndex].numberOfKnightCards - 1,
            };
        }
        newGame = {
            ...newGame,
            board: {
                ...newGame.board,
                crownPosition: newCrownPosition,
                tileGrid: newTileGrid,
            },
            players: [newPlayers[0], newPlayers[1]],
            discardPile: newDiscardPile,
        };
    }
    return newGame;
};
export const initialize = (options = {}) => {
    const getRandom = options.getRandom ? options.getRandom : Math.random;
    const firstPlayerIndex = options.firstPlayerIndex !== undefined
        ? options.firstPlayerIndex
        : getRandom() < 0.5
            ? 0
            : 1;
    const deck = shuffleArray(createPowerCardDeck(), getRandom);
    const game = createGame(deck);
    return {
        firstPlayerIndex,
        game,
        getRandom,
        history: [
            {
                game,
                playerIndex: undefined,
                playerAction: undefined,
            },
        ],
        winner: undefined,
    };
};
export const computeLastPlayerIndex = (gamePlay) => {
    return gamePlay.history.length === 1
        ? undefined
        : gamePlay.history.length % 2 === 0
            ? gamePlay.firstPlayerIndex
            : togglePlayerIndex(gamePlay.firstPlayerIndex);
};
export const computeNextPlayerIndex = (gamePlay) => {
    const previousPlayerIndex = computeLastPlayerIndex(gamePlay);
    return previousPlayerIndex === undefined
        ? gamePlay.firstPlayerIndex
        : togglePlayerIndex(previousPlayerIndex);
};
export const countNumberOfOccupiedTiles = (tileGrid) => {
    return tileGrid.reduce((acc, row) => acc +
        row.reduce((acc2, tile) => acc2 + (tile.occupation === undefined ? 0 : 1), 0), 0);
};
const areTilesAdjacent = (a, b) => {
    return (Math.abs(a[0] - b[0]) <= 1 &&
        Math.abs(a[1] - b[1]) <= 1 &&
        !(a[0] === b[0] && a[1] === b[1]));
};
export const calculateScore = (tileGrid, playerIndex) => {
    const allPositions = [];
    for (const [y, row] of tileGrid.entries()) {
        for (const [x, tile] of row.entries()) {
            if (tile.occupation === playerIndex) {
                allPositions.push([x, y]);
            }
        }
    }
    const findConnectedArea = ({ connected, rest, }) => {
        if (connected.length === 0) {
            throw new Error("connected positions must not be empty");
        }
        for (const a of connected) {
            for (const b of rest) {
                if (areTilesAdjacent(a, b)) {
                    return findConnectedArea({
                        connected: [...connected, b],
                        rest: rest.filter((p) => p !== b),
                    });
                }
            }
        }
        return { connected, rest };
    };
    let restPositions = allPositions;
    const occupiedAreas = [];
    while (restPositions.length > 0) {
        const { connected, rest } = findConnectedArea({
            connected: restPositions.slice(0, 1),
            rest: restPositions.slice(1),
        });
        occupiedAreas.push(connected);
        restPositions = rest;
    }
    occupiedAreas.forEach((area) => {
        area
            .sort((a, b) => {
            if (a[0] > b[0]) {
                return 1;
            }
            else if (a[0] < b[0]) {
                return -1;
            }
            else {
                return 0;
            }
        })
            .sort((a, b) => {
            if (a[1] > b[1]) {
                return 1;
            }
            else if (a[1] < b[1]) {
                return -1;
            }
            else {
                return 0;
            }
        });
    });
    return {
        occupiedAreas,
        total: occupiedAreas.reduce((acc, area) => acc + Math.pow(area.length, 2), 0),
    };
};
export const MAX_NUMBER_OF_OCCUPIED_TILES = 52;
export const computeWinner = (playerAction, previousPlayerAction, tileGrid) => {
    return (playerAction.kind === "pass" &&
        previousPlayerAction?.kind === "pass") ||
        countNumberOfOccupiedTiles(tileGrid) >= MAX_NUMBER_OF_OCCUPIED_TILES
        ? (() => {
            const score0 = calculateScore(tileGrid, 0);
            const score1 = calculateScore(tileGrid, 1);
            if (score0.total > score1.total) {
                return 0;
            }
            else if (score0.total < score1.total) {
                return 1;
            }
            return "draw";
        })()
        : undefined;
};
export const playTurn = (gamePlay, playerAction) => {
    if (gamePlay.winner !== undefined) {
        throw new Error("The game has been already finished");
    }
    const currentPlayerIndex = computeNextPlayerIndex(gamePlay);
    // Check if the player action is selectable
    const selecablePlayerActions = computeSelectablePlayerActions({
        board: gamePlay.game.board,
        player: gamePlay.game.players[currentPlayerIndex],
        playerIndex: currentPlayerIndex,
    });
    if (!selecablePlayerActions.some((e) => arePlayerActionsEqual(e, playerAction))) {
        throw new Error("It is an unselectable player action");
    }
    const newGame = resolvePlayerAction(gamePlay.game, currentPlayerIndex, playerAction, shuffleArray(gamePlay.game.discardPile, gamePlay.getRandom));
    const newHistory = [
        ...gamePlay.history,
        ...[{ game: newGame, playerIndex: currentPlayerIndex, playerAction }],
    ];
    const newWinner = computeWinner(playerAction, newHistory[newHistory.length - 2].playerAction, newGame.board.tileGrid);
    return {
        ...gamePlay,
        game: newGame,
        history: newHistory,
        winner: newWinner,
    };
};
