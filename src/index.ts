import deepEqual from "deep-equal";

type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "upLeft"
  | "upRight"
  | "downLeft"
  | "downRight";

type NumberOfSteps = 1 | 2 | 3;

export type PowerCard = {
  direction: Direction;
  numberOfSteps: NumberOfSteps;
};

type Player = {
  numberOfKnightCards: number;
  powerCardHand: PowerCard[];
};

type Players = [Player, Player];

/** 0 is the front position relative to the board */
type PlayerIndex = 0 | 1;

type Tile = {
  occupation: PlayerIndex | undefined;
};

type TileGrid = Tile[][];

/** [x, y] */
type TileGridPosition = [number, number];

// TODO: tileGrid 範囲内の位置を型で表現してみる？

type Board = {
  crownPosition: TileGridPosition;
  /**
   * 9x9 grid of tiles, [0][0] is the top left corner of the board
   */
  tileGrid: TileGrid;
};

type PlayerAction =
  | {
      kind: "drawCard";
    }
  | {
      kind: "moveCrown";
      powerCard: PowerCard;
    }
  | {
      kind: "pass";
    };

/**
 * State of the game immediately after the start or after the player has finished his/her actions
 */
export type Game = {
  board: Board;
  /**
   * e.g. undefined -> 0 -> 1 -> 0 -> ... or undefined -> 1 -> 0 -> 1 -> ...
   */
  currentPlayerIndex: PlayerIndex | undefined;
  discardPile: PowerCard[];
  drawPile: PowerCard[];
  players: Players;
};

/** Same interface as `Math.random` */
type GetRandom = () => number;

type GameHistoryRecord = Omit<Game, "getRandom">;

type GamePlay = {
  game: Game;
  getRandom: GetRandom;
  history: GameHistoryRecord[];
};

/**
 * Shuffle an array with the Fisher–Yates algorithm.
 *
 * Ref) https://www.30secondsofcode.org/js/s/shuffle/
 */
export const shuffleArray = <Element>(
  array: Element[],
  getRandom: () => number
): Element[] => {
  const copied = array.slice();
  let m = copied.length;
  while (m) {
    const i = Math.floor(getRandom() * m);
    m--;
    [copied[m], copied[i]] = [copied[i], copied[m]];
  }
  return copied;
};

const MAX_NUMBER_OF_POWER_CARDS = 5;

const AllDirections = [
  "up",
  "down",
  "left",
  "right",
  "upLeft",
  "upRight",
  "downLeft",
  "downRight",
] as const satisfies readonly Direction[];

const AllNumberOfSteps = [1, 2, 3] as const satisfies readonly NumberOfSteps[];

const MAX_TILE_GRID_SIZE = 9;

export const createTileGrid = (): Tile[][] => {
  const tileGrid: Tile[][] = [];
  for (let i = 0; i < MAX_TILE_GRID_SIZE; i++) {
    const row: Tile[] = [];
    for (let j = 0; j < MAX_TILE_GRID_SIZE; j++) {
      row.push({ occupation: undefined });
    }
    tileGrid.push(row);
  }
  return tileGrid;
};

export const createPowerCardDeck = (): PowerCard[] => {
  const drawPile: PowerCard[] = [];
  for (const numberOfSteps of AllNumberOfSteps) {
    for (const direction of AllDirections) {
      drawPile.push({ direction, numberOfSteps });
    }
  }
  return drawPile;
};

const drawPowerCards = (
  drawPile: PowerCard[],
  numberOfCardsDrawn: number
): { drawPile: PowerCard[]; drawn: PowerCard[] } => {
  if (drawPile.length < numberOfCardsDrawn) {
    throw new Error("Not enough cards in the deck");
  }
  return {
    drawPile: drawPile.slice(numberOfCardsDrawn),
    drawn: drawPile.slice(0, numberOfCardsDrawn),
  };
};

const createPlayer = (): Player => {
  return {
    numberOfKnightCards: 4,
    powerCardHand: [],
  };
};

export const togglePlayerIndex = (playerIndex: PlayerIndex): PlayerIndex => {
  return playerIndex === 0 ? 1 : 0;
};

export const isTileGridPositionValid = (
  tileGrid: TileGrid,
  position: [number, number]
): boolean => {
  const [x, y] = position;
  return (
    x >= 0 &&
    x < tileGrid.length &&
    y >= 0 &&
    y < tileGrid.length &&
    tileGrid[x][y] !== undefined
  );
};

export const getTile = (
  tileGrid: TileGrid,
  position: TileGridPosition
): Tile => {
  if (!isTileGridPositionValid(tileGrid, position)) {
    throw new Error("Invalid tile grid position");
  }
  return tileGrid[position[1]][position[0]];
};

const isKnightCardNecessaryForMovingTile = (
  tile: Tile,
  movingPlayerIndex: PlayerIndex
): boolean => {
  return tile.occupation !== undefined && tile.occupation !== movingPlayerIndex;
};

export const translateTileGridPositionByPowerCard = (
  tileGridPosition: TileGridPosition,
  powerCard: PowerCard
): TileGridPosition => {
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

export const canCrownBeMovedToTile = ({
  crownPosition,
  hasKnightCard,
  playerIndex,
  powerCard,
  tileGrid,
}: {
  crownPosition: TileGridPosition;
  hasKnightCard: boolean;
  playerIndex: PlayerIndex;
  powerCard: PowerCard;
  tileGrid: TileGrid;
}): { canBeMoved: boolean; isKnightCardNecessary: boolean } => {
  const nextCrownPosition = translateTileGridPositionByPowerCard(
    crownPosition,
    powerCard
  );
  if (!isTileGridPositionValid(tileGrid, nextCrownPosition)) {
    return { canBeMoved: false, isKnightCardNecessary: false };
  }
  const nextCrownTile = getTile(tileGrid, nextCrownPosition);
  return {
    canBeMoved:
      nextCrownTile.occupation === undefined ||
      (nextCrownTile.occupation !== playerIndex && hasKnightCard),
    isKnightCardNecessary: isKnightCardNecessaryForMovingTile(
      nextCrownTile,
      playerIndex
    ),
  };
};

export const computeSelectablePlayerActions = ({
  board,
  player,
  playerIndex,
}: {
  board: Board;
  player: Player;
  playerIndex: PlayerIndex;
}): PlayerAction[] => {
  const playerActions: PlayerAction[] = player.powerCardHand
    .filter(
      (powerCard) =>
        canCrownBeMovedToTile({
          crownPosition: board.crownPosition,
          hasKnightCard: player.numberOfKnightCards > 0,
          playerIndex,
          powerCard,
          tileGrid: board.tileGrid,
        }).canBeMoved
    )
    .map((powerCard) => ({ kind: "moveCrown", powerCard }));
  if (player.powerCardHand.length < MAX_NUMBER_OF_POWER_CARDS) {
    playerActions.push({ kind: "drawCard" });
  }
  if (playerActions.length === 0) {
    playerActions.push({ kind: "pass" });
  }
  return playerActions;
};

export const createGame = (shuffledDeck: PowerCard[]): Game => {
  const { drawPile: drawPile5Drawn, drawn: powerCardHandForPlayer0 } =
    drawPowerCards(shuffledDeck, 5);
  const { drawPile: drawPile10Drawn, drawn: powerCardHandForPlayer1 } =
    drawPowerCards(drawPile5Drawn, 5);
  const players: Players = [
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
    currentPlayerIndex: undefined,
  };
};

/**
 * @param shuffledDiscardPile Only used when draw pile is empty.
 */
export const resolvePlayerAction = (
  game: Game,
  currentPlayerIndex: PlayerIndex,
  playerAction: PlayerAction,
  shuffledDiscardPile: PowerCard[]
): Game => {
  // Check if the player action is selectable
  const selecablePlayerActions = computeSelectablePlayerActions({
    board: game.board,
    player: game.players[currentPlayerIndex],
    playerIndex: currentPlayerIndex,
  });
  if (!selecablePlayerActions.some((e) => deepEqual(e, playerAction))) {
    throw new Error("It is an unselectable player action");
  }

  let newGame: Game = { ...game, currentPlayerIndex };
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
  } else if (playerAction.kind === "moveCrown") {
    const newCrownPosition = translateTileGridPositionByPowerCard(
      newGame.board.crownPosition,
      playerAction.powerCard
    );
    const newPlayers = [...newGame.players];

    // Occupy the tile
    let isKnightCardNecessary = false;
    const newTileGrid = game.board.tileGrid.map((row, y) => {
      return row.map((tile, x) => {
        if (x === newCrownPosition[0] && y === newCrownPosition[1]) {
          isKnightCardNecessary = isKnightCardNecessaryForMovingTile(
            tile,
            currentPlayerIndex
          );
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
      powerCardHand: newPlayers[currentPlayerIndex].powerCardHand.filter(
        (powerCard) => !deepEqual(powerCard, playerAction.powerCard)
      ),
    };

    // Add discarded power card to discard pile
    const newDiscardPile = [...newGame.discardPile, playerAction.powerCard];

    // Reduce current player's knight card
    if (isKnightCardNecessary) {
      newPlayers[currentPlayerIndex] = {
        ...newPlayers[currentPlayerIndex],
        numberOfKnightCards:
          newPlayers[currentPlayerIndex].numberOfKnightCards - 1,
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

// TODO: ゲーム終了判定

// TODO: 履歴を追加しつつ、ゲームを進める

// TODO: スコア算出用ユーティリティ群

const main = () => {
  const getRandom = Math.random;
  const deck = shuffleArray(createPowerCardDeck(), getRandom);
  const game = createGame(deck);
  console.log(require("util").inspect(game, { depth: null }));
};

//main();
