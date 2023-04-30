import {
  canCrownBeMovedToTile,
  createTileGrid,
  isTileGridPositionValid,
  translateTileGridPositionByPowerCard,
} from "./index";

describe("isTileGridPositionValid", () => {
  test.each<{
    args: Parameters<typeof isTileGridPositionValid>;
    expected: ReturnType<typeof isTileGridPositionValid>;
  }>([
    { args: [createTileGrid(), [0, 0]], expected: true },
    { args: [createTileGrid(), [8, 8]], expected: true },
    { args: [createTileGrid(), [-1, 0]], expected: false },
    { args: [createTileGrid(), [0, -1]], expected: false },
    { args: [createTileGrid(), [9, 0]], expected: false },
    { args: [createTileGrid(), [0, 9]], expected: false },
  ])("$args.1 => $expected", ({ args, expected }) => {
    expect(isTileGridPositionValid(...args)).toEqual(expected);
  });
});

describe("translateTileGridPositionByPowerCard", () => {
  test.each<
    [
      string,
      Parameters<typeof translateTileGridPositionByPowerCard>,
      ReturnType<typeof translateTileGridPositionByPowerCard>
    ]
  >([
    ["up", [[0, 0], { direction: "up", numberOfSteps: 1 }], [0, -1]],
    ["down", [[0, 0], { direction: "down", numberOfSteps: 1 }], [0, 1]],
    ["left", [[0, 0], { direction: "left", numberOfSteps: 1 }], [-1, 0]],
    ["right", [[0, 0], { direction: "right", numberOfSteps: 1 }], [1, 0]],
    ["up-left", [[0, 0], { direction: "up-left", numberOfSteps: 1 }], [-1, -1]],
    [
      "up-right",
      [[0, 0], { direction: "up-right", numberOfSteps: 1 }],
      [1, -1],
    ],
    [
      "down-left",
      [[0, 0], { direction: "down-left", numberOfSteps: 1 }],
      [-1, 1],
    ],
    [
      "down-right",
      [[0, 0], { direction: "down-right", numberOfSteps: 1 }],
      [1, 1],
    ],
    ["up 2 steps", [[0, 0], { direction: "up", numberOfSteps: 2 }], [0, -2]],
    ["up 3 steps", [[0, 0], { direction: "up", numberOfSteps: 3 }], [0, -3]],
    [
      "left 2 steps",
      [[0, 0], { direction: "left", numberOfSteps: 2 }],
      [-2, 0],
    ],
    [
      "left 3 steps",
      [[0, 0], { direction: "left", numberOfSteps: 3 }],
      [-3, 0],
    ],
  ])("%s", (_, args, expected) => {
    expect(translateTileGridPositionByPowerCard(...args)).toEqual(expected);
  });
});

describe("canCrownBeMovedToTile", () => {
  test.each<
    [
      string,
      Parameters<typeof canCrownBeMovedToTile>,
      ReturnType<typeof canCrownBeMovedToTile>
    ]
  >([
    [
      "the crown can not move when exiting the board",
      [
        {
          crownPosition: [1, 0],
          hasKnightCard: true,
          playerIndex: 0,
          powerCard: {
            direction: "up",
            numberOfSteps: 1,
          },
          tileGrid: createTileGrid(),
        },
      ],
      { canBeMoved: false, isKnightCardNecessary: false },
    ],
    [
      "the crown can move when the tile is empty",
      [
        {
          crownPosition: [4, 4],
          hasKnightCard: true,
          playerIndex: 0,
          powerCard: {
            direction: "up",
            numberOfSteps: 1,
          },
          tileGrid: createTileGrid(),
        },
      ],
      { canBeMoved: true, isKnightCardNecessary: false },
    ],
    [
      "the crown can not move when the tile is occupied by the same player",
      [
        {
          crownPosition: [4, 4],
          hasKnightCard: true,
          playerIndex: 0,
          powerCard: {
            direction: "up",
            numberOfSteps: 1,
          },
          tileGrid: (() => {
            const tileGrid = createTileGrid();
            tileGrid[4][3].occupation = 0;
            return tileGrid;
          })(),
        },
      ],
      { canBeMoved: false, isKnightCardNecessary: false },
    ],
    [
      "the crown can not move when the tile is occupied by the another player and the player does not have a knight card",
      [
        {
          crownPosition: [4, 4],
          hasKnightCard: false,
          playerIndex: 0,
          powerCard: {
            direction: "up",
            numberOfSteps: 1,
          },
          tileGrid: (() => {
            const tileGrid = createTileGrid();
            tileGrid[4][3].occupation = 1;
            return tileGrid;
          })(),
        },
      ],
      { canBeMoved: false, isKnightCardNecessary: true },
    ],
    [
      "the crown can move when the tile is occupied by the another player and the player has a knight card",
      [
        {
          crownPosition: [4, 4],
          hasKnightCard: true,
          playerIndex: 0,
          powerCard: {
            direction: "up",
            numberOfSteps: 1,
          },
          tileGrid: (() => {
            const tileGrid = createTileGrid();
            tileGrid[4][3].occupation = 1;
            return tileGrid;
          })(),
        },
      ],
      { canBeMoved: true, isKnightCardNecessary: true },
    ],
  ])("%s", (_, args, expected) => {
    expect(canCrownBeMovedToTile(...args)).toStrictEqual(expected);
  });
});
