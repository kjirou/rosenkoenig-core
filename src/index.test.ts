import {
  canCrownBeMovedToTile,
  createPowerCardDeck,
  computeSelectablePlayerActions,
  createGame,
  createTileGrid,
  getTile,
  isTileGridPositionValid,
  resolvePlayerAction,
  togglePlayerIndex,
  translateTileGridPositionByPowerCard,
} from "./index";
import type { Game } from "./index";

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
    ["upLeft", [[0, 0], { direction: "upLeft", numberOfSteps: 1 }], [-1, -1]],
    ["upRight", [[0, 0], { direction: "upRight", numberOfSteps: 1 }], [1, -1]],
    [
      "downLeft",
      [[0, 0], { direction: "downLeft", numberOfSteps: 1 }],
      [-1, 1],
    ],
    [
      "downRight",
      [[0, 0], { direction: "downRight", numberOfSteps: 1 }],
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
            tileGrid[3][4].occupation = 0;
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
            tileGrid[3][4].occupation = 1;
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
            tileGrid[3][4].occupation = 1;
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

describe("computeSelectablePlayerActions", () => {
  test.each<
    [
      string,
      Parameters<typeof computeSelectablePlayerActions>,
      ReturnType<typeof computeSelectablePlayerActions>
    ]
  >([
    [
      'it returns available "moveCrown" actions with "drawCard" action',
      [
        {
          board: {
            crownPosition: [0, 0],
            tileGrid: createTileGrid(),
          },
          player: {
            numberOfKnightCards: 0,
            powerCardHand: [
              { direction: "up", numberOfSteps: 1 },
              { direction: "down", numberOfSteps: 1 },
              { direction: "left", numberOfSteps: 1 },
              { direction: "right", numberOfSteps: 1 },
            ],
          },
          playerIndex: 0,
        },
      ],
      [
        {
          kind: "moveCrown",
          powerCard: { direction: "down", numberOfSteps: 1 },
        },
        {
          kind: "moveCrown",
          powerCard: { direction: "right", numberOfSteps: 1 },
        },
        {
          kind: "drawCard",
        },
      ],
    ],
    [
      'it does not include "drawCard" action when the player hand is full',
      [
        {
          board: {
            crownPosition: [0, 0],
            tileGrid: createTileGrid(),
          },
          player: {
            numberOfKnightCards: 0,
            powerCardHand: [
              { direction: "up", numberOfSteps: 1 },
              { direction: "up", numberOfSteps: 2 },
              { direction: "up", numberOfSteps: 3 },
              { direction: "down", numberOfSteps: 1 },
              { direction: "left", numberOfSteps: 1 },
            ],
          },
          playerIndex: 0,
        },
      ],
      [
        {
          kind: "moveCrown",
          powerCard: { direction: "down", numberOfSteps: 1 },
        },
      ],
    ],
    [
      'it only retuns "pass" action when the player has no available actions',
      [
        {
          board: {
            crownPosition: [0, 0],
            tileGrid: createTileGrid(),
          },
          player: {
            numberOfKnightCards: 0,
            powerCardHand: [
              { direction: "up", numberOfSteps: 1 },
              { direction: "up", numberOfSteps: 2 },
              { direction: "up", numberOfSteps: 3 },
              { direction: "left", numberOfSteps: 1 },
              { direction: "left", numberOfSteps: 2 },
            ],
          },
          playerIndex: 0,
        },
      ],
      [
        {
          kind: "pass",
        },
      ],
    ],
  ])("%s", (_, args, expected) => {
    expect(computeSelectablePlayerActions(...args)).toStrictEqual(expected);
  });
});

describe("resolvePlayerAction", () => {
  let game: Game;

  beforeEach(() => {
    game = createGame(createPowerCardDeck());
  });

  test("it throws an error if the playerAction does not relate with the playerIndex", () => {
    const playerIndex = 0;
    game.players[playerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    expect(() => {
      resolvePlayerAction(
        game,
        playerIndex,
        {
          kind: "moveCrown",
          powerCard: { direction: "down", numberOfSteps: 1 },
        },
        []
      );
    }).toThrowError(/unselectable player action/);
  });
  test('it throws an error if the "drawCard" playerAction could not be use', () => {
    const playerIndex = 0;
    game.players[playerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
      { direction: "up", numberOfSteps: 2 },
      { direction: "up", numberOfSteps: 3 },
      { direction: "left", numberOfSteps: 1 },
      { direction: "left", numberOfSteps: 2 },
    ];
    expect(() => {
      resolvePlayerAction(
        game,
        playerIndex,
        {
          kind: "drawCard",
        },
        []
      );
    }).toThrowError(/unselectable player action/);
  });
  test('it throws an error if the "moveCrown" playerAction could not be use', () => {
    const playerIndex = 0;
    game.players[playerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    game.board.crownPosition = [0, 0];
    expect(() => {
      resolvePlayerAction(
        game,
        playerIndex,
        {
          kind: "moveCrown",
          powerCard: { direction: "up", numberOfSteps: 1 },
        },
        []
      );
    }).toThrowError(/unselectable player action/);
  });
  test("it can draw a power card from the draw pile", () => {
    const playerIndex = 0;
    game.players[playerIndex].powerCardHand = [];
    game.drawPile = [{ direction: "up", numberOfSteps: 2 }];
    game = resolvePlayerAction(
      game,
      playerIndex,
      {
        kind: "drawCard",
      },
      []
    );
    expect(game.players[playerIndex].powerCardHand).toStrictEqual([
      { direction: "up", numberOfSteps: 2 },
    ]);
  });
  test("it can draw a power card with reseting the draw/discard pile if the existing draw pile is 0 cards", () => {
    const playerIndex = 0;
    game.players[playerIndex].powerCardHand = [];
    game.drawPile = [];
    game.discardPile = [{ direction: "down", numberOfSteps: 1 }];
    game = resolvePlayerAction(
      game,
      playerIndex,
      {
        kind: "drawCard",
      },
      [
        { direction: "up", numberOfSteps: 1 }, // drawn
        { direction: "up", numberOfSteps: 2 }, // the first of the new draw pile
      ]
    );
    expect(game.players[playerIndex].powerCardHand).toStrictEqual([
      { direction: "up", numberOfSteps: 1 },
    ]);
    expect(game.drawPile).toStrictEqual([
      { direction: "up", numberOfSteps: 2 },
    ]);
    expect(game.discardPile).toStrictEqual([]);
  });
  test("it can move the crown and then it discards the power card", () => {
    const playerIndex = 0;
    game.players[playerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    game = resolvePlayerAction(
      game,
      playerIndex,
      {
        kind: "moveCrown",
        powerCard: { direction: "up", numberOfSteps: 1 },
      },
      []
    );
    expect(game.board.crownPosition).toStrictEqual([4, 3]);
    expect(
      getTile(game.board.tileGrid, game.board.crownPosition).occupation
    ).toBe(playerIndex);
    expect(game.players[playerIndex].powerCardHand).toStrictEqual([]);
    expect(game.discardPile).toStrictEqual([
      { direction: "up", numberOfSteps: 1 },
    ]);
  });
  test("it reduces the number of knight cards if the crown moves to an already occupied tile", () => {
    const playerIndex = 0;
    const beforeNumberOfKnightCards =
      game.players[playerIndex].numberOfKnightCards;
    game.players[playerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    getTile(game.board.tileGrid, [4, 3]).occupation =
      togglePlayerIndex(playerIndex);
    game = resolvePlayerAction(
      game,
      playerIndex,
      {
        kind: "moveCrown",
        powerCard: { direction: "up", numberOfSteps: 1 },
      },
      []
    );
    expect(
      getTile(game.board.tileGrid, game.board.crownPosition).occupation
    ).toBe(playerIndex);
    expect(game.players[playerIndex].numberOfKnightCards).toBe(
      beforeNumberOfKnightCards - 1
    );
  });
  test("it does not reduce the number of knight cards if the crown moves to a not occupied tile", () => {
    const playerIndex = 0;
    const beforeNumberOfKnightCards =
      game.players[playerIndex].numberOfKnightCards;
    game.players[playerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    game = resolvePlayerAction(
      game,
      playerIndex,
      {
        kind: "moveCrown",
        powerCard: { direction: "up", numberOfSteps: 1 },
      },
      []
    );
    expect(
      getTile(game.board.tileGrid, game.board.crownPosition).occupation
    ).toBe(playerIndex);
    expect(game.players[playerIndex].numberOfKnightCards).toBe(
      beforeNumberOfKnightCards
    );
  });
});
