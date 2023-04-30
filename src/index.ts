type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right";

type NumberOfSteps = 1 | 2 | 3;

type PowerCard = {
  direction: Direction;
  numberOfSteps: NumberOfSteps;
};

type PowerCardHand =
  | []
  | [PowerCard]
  | [PowerCard, PowerCard]
  | [PowerCard, PowerCard, PowerCard]
  | [PowerCard, PowerCard, PowerCard, PowerCard]
  | [PowerCard, PowerCard, PowerCard, PowerCard, PowerCard];

type NumberOfKnightCards = 0 | 1 | 2 | 3 | 4;

type Player = {
  numberOfKnightCards: NumberOfKnightCards;
  powerCardHand: PowerCardHand;
};

type Players = [Player, Player];

/** 0 is the front position relative to the board */
type PlayerIndex = 0 | 1;

type PowerCardDeck = PowerCard[];

type Tile = {
  occupation: PlayerIndex | undefined;
};

type Board = {
  /**
   * 9x9 grid of tiles, [0][0] is the top left corner of the board
   */
  tileGrid: Tile[][];
};

/** Same interface as `Math.random` */
type GetRandom = () => number;

type Game = {
  board: Board;
  /** [x, y] */
  crownPosition: [number, number];
  getRandom: GetRandom;
  players: Players;
  powerCardDeck: PowerCardDeck;
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

const AllDirections = [
  "up",
  "down",
  "left",
  "right",
  "up-left",
  "up-right",
  "down-left",
  "down-right",
] as const satisfies readonly Direction[];

const AllNumberOfSteps = [1, 2, 3] as const satisfies readonly NumberOfSteps[];

const MAX_TILE_GRID_SIZE = 9;

const createTileGrid = (): Tile[][] => {
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

const createPowerCardDeck = (): PowerCardDeck => {
  const powerCardDeck: PowerCardDeck = [];
  for (const numberOfSteps of AllNumberOfSteps) {
    for (const direction of AllDirections) {
      powerCardDeck.push({ direction, numberOfSteps });
    }
  }
  return powerCardDeck;
};

const drawPowerCards = (
  powerCardDeck: PowerCardDeck,
  numberOfCardsDrawn: number
): { deck: PowerCardDeck; drawn: PowerCard[] } => {
  if (powerCardDeck.length < numberOfCardsDrawn) {
    throw new Error("Not enough cards in the deck");
  }
  return {
    deck: powerCardDeck.slice(numberOfCardsDrawn),
    drawn: powerCardDeck.slice(0, numberOfCardsDrawn),
  };
};

const isPowerCardHandType = (value: PowerCard[]): value is PowerCardHand => {
  return value.length <= 5;
};

const createPlayer = (): Player => {
  return {
    numberOfKnightCards: 4,
    powerCardHand: [],
  };
};

const initializeGame = (getRandom: GetRandom): Game => {
  const powerCardDeck = shuffleArray(createPowerCardDeck(), getRandom);
  const { deck: powerCardDeckDrawn5, drawn: powerCardHandForPlayer0 } =
    drawPowerCards(powerCardDeck, 5);
  const { deck: powerCardDeckDrawn10, drawn: powerCardHandForPlayer1 } =
    drawPowerCards(powerCardDeckDrawn5, 5);
  if (
    !isPowerCardHandType(powerCardHandForPlayer0) ||
    !isPowerCardHandType(powerCardHandForPlayer1)
  ) {
    throw new Error("Invalid power card hand");
  }
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
    getRandom,
    board: {
      tileGrid: createTileGrid(),
    },
    crownPosition: [4, 4],
    powerCardDeck,
    players,
  };
};

const main = () => {
  const game = initializeGame(Math.random);
  console.log(require("util").inspect(game, { depth: null }));
};

main();
