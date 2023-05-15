import {
  arePlayerActionsEqual,
  arePowerCardsEqual,
  calculateScore,
  canCrownBeMovedToTile,
  computeSelectablePlayerActions,
  computeLastPlayerIndex,
  computeNextPlayerIndex,
  computeWinner,
  createPowerCardDeck,
  createGame,
  createTileGrid,
  drawPowerCards,
  getTile,
  initialize,
  isTileGridPositionValid,
  playTurn,
  resolvePlayerAction,
  togglePlayerIndex,
  translateTileGridPositionByPowerCard,
} from "./index.js";
import type { Game, PlayerAction, PowerCard } from "./index.js";

describe("arePowerCardsEqual", () => {
  test.each<{ args: [PowerCard, PowerCard]; expected: boolean }>([
    {
      args: [
        { direction: "up", numberOfSteps: 1 },
        { direction: "up", numberOfSteps: 1 },
      ],
      expected: true,
    },
    {
      args: [
        { direction: "up", numberOfSteps: 1 },
        { direction: "up", numberOfSteps: 2 },
      ],
      expected: false,
    },
    {
      args: [
        { direction: "up", numberOfSteps: 1 },
        { direction: "left", numberOfSteps: 1 },
      ],
      expected: false,
    },
  ])("$args.0, $args.1 => $expected", ({ args, expected }) => {
    expect(arePowerCardsEqual(...args)).toBe(expected);
  });
});

describe("arePlayerActionsEqual", () => {
  test.each<{ args: [PlayerAction, PlayerAction]; expected: boolean }>([
    { args: [{ kind: "drawCard" }, { kind: "drawCard" }], expected: true },
    { args: [{ kind: "pass" }, { kind: "pass" }], expected: true },
    { args: [{ kind: "drawCard" }, { kind: "pass" }], expected: false },
    {
      args: [
        { kind: "moveCrown", powerCard: { direction: "up", numberOfSteps: 1 } },
        { kind: "moveCrown", powerCard: { direction: "up", numberOfSteps: 1 } },
      ],
      expected: true,
    },
    {
      args: [
        { kind: "moveCrown", powerCard: { direction: "up", numberOfSteps: 1 } },
        { kind: "moveCrown", powerCard: { direction: "up", numberOfSteps: 2 } },
      ],
      expected: false,
    },
    {
      args: [
        { kind: "moveCrown", powerCard: { direction: "up", numberOfSteps: 1 } },
        { kind: "drawCard" },
      ],
      expected: false,
    },
  ])("$args.0, $args.1 => $expected", ({ args, expected }) => {
    expect(arePlayerActionsEqual(...args)).toBe(expected);
  });
});

describe("createTileGrid", () => {
  describe("options.initialOccupation", () => {
    test.each<
      [
        string,
        Parameters<typeof createTileGrid>,
        ReturnType<typeof createTileGrid>
      ]
    >([
      [
        "all empty",
        [
          {
            initialOccupation: [
              "         ",
              "         ",
              "         ",
              "         ",
              "         ",
              "         ",
              "         ",
              "         ",
              "         ",
            ].join("\n"),
          },
        ],
        createTileGrid(),
      ],
      [
        "all 0",
        [
          {
            initialOccupation: [
              "000000000",
              "000000000",
              "000000000",
              "000000000",
              "000000000",
              "000000000",
              "000000000",
              "000000000",
              "000000000",
            ].join("\n"),
          },
        ],
        createTileGrid().map((row) =>
          row.map((tile) => ({ ...tile, occupation: 0 }))
        ),
      ],
      [
        "all 1",
        [
          {
            initialOccupation: [
              "111111111",
              "111111111",
              "111111111",
              "111111111",
              "111111111",
              "111111111",
              "111111111",
              "111111111",
              "111111111",
            ].join("\n"),
          },
        ],
        createTileGrid().map((row) =>
          row.map((tile) => ({ ...tile, occupation: 1 }))
        ),
      ],
    ])("%s", (_, args, expected) => {
      expect(createTileGrid(...args)).toStrictEqual(expected);
    });
  });
});

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
    expect(isTileGridPositionValid(...args)).toBe(expected);
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
    expect(translateTileGridPositionByPowerCard(...args)).toStrictEqual(
      expected
    );
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
      false,
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
      true,
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
      false,
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
      false,
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
      true,
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
  test("it can draw a power card from the draw pile", () => {
    let game = createGame(createPowerCardDeck());
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
    let game = createGame(createPowerCardDeck());
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
    let game = createGame(createPowerCardDeck());
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
    let game = createGame(createPowerCardDeck());
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
    let game = createGame(createPowerCardDeck());
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

describe("calculateScore", () => {
  test.each<
    [
      string,
      Parameters<typeof calculateScore>,
      ReturnType<typeof calculateScore>
    ]
  >([
    ["no occupition", [createTileGrid(), 0], { total: 0, occupiedAreas: [] }],
    [
      "one-tile only occupation",
      [
        (() => {
          const tileGrid = createTileGrid();
          getTile(tileGrid, [0, 1]).occupation = 0;
          return tileGrid;
        })(),
        0,
      ],
      { total: 1, occupiedAreas: [[[0, 1]]] },
    ],
    [
      "multiple contiguous occupied areas",
      [
        createTileGrid({
          initialOccupation: [
            "00    0  ",
            "     0   ",
            "         ",
            "   0     ",
            "    0    ",
            "     0  0",
            "        0",
            "        0",
            "        0",
          ].join("\n"),
        }),
        0,
      ],
      {
        // 4 + 4 + 9 + 16 = 33
        total: 33,
        occupiedAreas: [
          [
            [0, 0],
            [1, 0],
          ],
          [
            [6, 0],
            [5, 1],
          ],
          [
            [3, 3],
            [4, 4],
            [5, 5],
          ],
          [
            [8, 5],
            [8, 6],
            [8, 7],
            [8, 8],
          ],
        ],
      },
    ],
    [
      "two players' occupied areas are adjacent to each other",
      [
        createTileGrid({
          initialOccupation: [
            "         ",
            "         ",
            "   000   ",
            "  00100  ",
            "  01010  ",
            "  00100  ",
            "   000   ",
            "         ",
            "         ",
          ].join("\n"),
        }),
        1,
      ],
      {
        total: 16,
        occupiedAreas: [
          [
            [4, 3],
            [3, 4],
            [5, 4],
            [4, 5],
          ],
        ],
      },
    ],
    [
      "diagonally connected areas",
      [
        createTileGrid({
          initialOccupation: [
            "0 0      ",
            " 0       ",
            "0 0      ",
            " 0       ",
            "         ",
            "         ",
            " 0       ",
            "0 0      ",
            " 0       ",
          ].join("\n"),
        }),
        0,
      ],
      {
        // 6 * 6 + 4 * 4
        total: 52,
        occupiedAreas: [
          [
            [0, 0],
            [2, 0],
            [1, 1],
            [0, 2],
            [2, 2],
            [1, 3],
          ],
          [
            [1, 6],
            [0, 7],
            [2, 7],
            [1, 8],
          ],
        ],
      },
    ],
    [
      "real complex case",
      [
        createTileGrid({
          initialOccupation: [
            "    11 00",
            "    11001",
            "   110000",
            "   00 101",
            "     0011",
            "      01 ",
            "       1 ",
            "     0   ",
            "         ",
          ].join("\n"),
        }),
        0,
      ],
      {
        total: 197,
        occupiedAreas: [
          [
            [7, 0],
            [8, 0],
            [6, 1],
            [7, 1],
            [5, 2],
            [6, 2],
            [7, 2],
            [8, 2],
            [3, 3],
            [4, 3],
            [7, 3],
            [5, 4],
            [6, 4],
            [6, 5],
          ],
          [[5, 7]],
        ],
      },
    ],
  ])("%s", (_, args, expected) => {
    expect(calculateScore(...args)).toStrictEqual(expected);
  });
});

describe("computeWinner", () => {
  test.each<
    [string, Parameters<typeof computeWinner>, ReturnType<typeof computeWinner>]
  >([
    [
      'it judges as the game was finished if "pass" action is consecutive',
      [{ kind: "pass" }, { kind: "pass" }, createTileGrid()],
      "draw",
    ],
    [
      'it judges as the game was not finished if "pass" action is not consecutive',
      [{ kind: "pass" }, { kind: "drawCard" }, createTileGrid()],
      undefined,
    ],
    [
      "it judges as the game was finished if the number of occupied tiles is 52",
      [
        { kind: "drawCard" },
        { kind: "drawCard" },
        createTileGrid({
          initialOccupation: [
            "000000000",
            "000000000",
            "000000000",
            "000000000",
            "000000000",
            "0000000  ",
            "         ",
            "         ",
            "         ",
          ].join("\n"),
        }),
      ],
      0,
    ],
    [
      "it judges as the game was not finished if the number of occupied tiles is 51",
      [
        { kind: "drawCard" },
        { kind: "drawCard" },
        createTileGrid({
          initialOccupation: [
            "000000000",
            "000000000",
            "000000000",
            "000000000",
            "000000000",
            "000000   ",
            "         ",
            "         ",
            "         ",
          ].join("\n"),
        }),
      ],
      undefined,
    ],
    [
      "it can judge the the player 0 won",
      [
        { kind: "pass" },
        { kind: "pass" },
        (() => {
          const tileGrid = createTileGrid();
          tileGrid[0][0].occupation = 0;
          return tileGrid;
        })(),
      ],
      0,
    ],
    [
      "it can judge that the player 1 won",
      [
        { kind: "pass" },
        { kind: "pass" },
        (() => {
          const tileGrid = createTileGrid();
          tileGrid[0][0].occupation = 1;
          return tileGrid;
        })(),
      ],
      1,
    ],
  ])("%s", (_, args, expected) => {
    expect(computeWinner(...args)).toBe(expected);
  });
});

describe("computeLastPlayerIndex", () => {
  test.each<
    [
      string,
      Parameters<typeof computeLastPlayerIndex>,
      ReturnType<typeof computeLastPlayerIndex>
    ]
  >([
    [
      "it returns undefined right at the start of the game",
      [initialize({ firstPlayerIndex: 0 })],
      undefined,
    ],
    [
      "it returns 0 if firstPlayerIndex is 0 and the number of history records is 2",
      [
        (() => {
          const gamePlay = initialize({ firstPlayerIndex: 0 });
          gamePlay.history.push({
            game: gamePlay.game,
            playerAction: undefined,
            playerIndex: undefined,
          });
          return gamePlay;
        })(),
      ],
      0,
    ],
    [
      "it returns 1 if firstPlayerIndex is 1 and the number of history records is 2",
      [
        (() => {
          const gamePlay = initialize({ firstPlayerIndex: 1 });
          gamePlay.history.push({
            game: gamePlay.game,
            playerAction: undefined,
            playerIndex: undefined,
          });
          return gamePlay;
        })(),
      ],
      1,
    ],
    [
      "it returns 1 if firstPlayerIndex is 0 and the number of history records is 3",
      [
        (() => {
          const gamePlay = initialize({ firstPlayerIndex: 0 });
          gamePlay.history.push({
            game: gamePlay.game,
            playerAction: undefined,
            playerIndex: undefined,
          });
          gamePlay.history.push({
            game: gamePlay.game,
            playerAction: undefined,
            playerIndex: undefined,
          });
          return gamePlay;
        })(),
      ],
      1,
    ],
  ])("%s", (_, args, expected) => {
    expect(computeLastPlayerIndex(...args)).toBe(expected);
  });
});

describe("computeNextPlayerIndex", () => {
  test.each<
    [
      string,
      Parameters<typeof computeNextPlayerIndex>,
      ReturnType<typeof computeNextPlayerIndex>
    ]
  >([
    [
      "it returns firstPlayerIndex right at the start of the game",
      [initialize({ firstPlayerIndex: 1 })],
      1,
    ],
    [
      "it returns 0 if firstPlayerIndex is 1 and the number of history records is 2",
      [
        (() => {
          const gamePlay = initialize({ firstPlayerIndex: 1 });
          gamePlay.history.push({
            game: gamePlay.game,
            playerAction: undefined,
            playerIndex: undefined,
          });
          return gamePlay;
        })(),
      ],
      0,
    ],
  ])("%s", (_, args, expected) => {
    expect(computeNextPlayerIndex(...args)).toBe(expected);
  });
});

describe("playTurn", () => {
  test("it throws an error if the player take some action after the game was finished", () => {
    const gamePlay = initialize();
    gamePlay.winner = "draw";
    expect(() => {
      playTurn(gamePlay, {
        kind: "pass",
      });
    }).toThrowError(/already finished/);
  });
  test("it throws an error if the playerAction does not relate with the playerIndex", () => {
    const gamePlay = initialize();
    gamePlay.game.players[gamePlay.firstPlayerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    expect(() => {
      playTurn(gamePlay, {
        kind: "moveCrown",
        powerCard: { direction: "down", numberOfSteps: 1 },
      });
    }).toThrowError(/unselectable player action/);
  });
  test('it throws an error if the "drawCard" playerAction could not be use', () => {
    const gamePlay = initialize();
    gamePlay.game.players[gamePlay.firstPlayerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
      { direction: "up", numberOfSteps: 2 },
      { direction: "up", numberOfSteps: 3 },
      { direction: "left", numberOfSteps: 1 },
      { direction: "left", numberOfSteps: 2 },
    ];
    expect(() => {
      playTurn(gamePlay, {
        kind: "drawCard",
      });
    }).toThrowError(/unselectable player action/);
  });
  test('it throws an error if the "moveCrown" playerAction could not be use', () => {
    const gamePlay = initialize();
    gamePlay.game.players[gamePlay.firstPlayerIndex].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    gamePlay.game.board.crownPosition = [0, 0];
    expect(() => {
      playTurn(gamePlay, {
        kind: "moveCrown",
        powerCard: { direction: "up", numberOfSteps: 1 },
      });
    }).toThrowError(/unselectable player action/);
  });
  test("it can simulate the early stages of the game", () => {
    let gamePlay = initialize({ firstPlayerIndex: 0 });
    gamePlay.game.players[0].powerCardHand = [
      {
        direction: "up",
        numberOfSteps: 1,
      },
      {
        direction: "up",
        numberOfSteps: 2,
      },
      {
        direction: "up",
        numberOfSteps: 3,
      },
      {
        direction: "down",
        numberOfSteps: 1,
      },
      {
        direction: "down",
        numberOfSteps: 2,
      },
    ];
    gamePlay.game.players[1].powerCardHand = [
      {
        direction: "down",
        numberOfSteps: 3,
      },
      {
        direction: "left",
        numberOfSteps: 1,
      },
      {
        direction: "left",
        numberOfSteps: 2,
      },
      {
        direction: "left",
        numberOfSteps: 3,
      },
      {
        direction: "right",
        numberOfSteps: 1,
      },
    ];

    // 1st turn by 0
    //  012345678
    // 0
    // 1
    // 2
    // 3    0
    // 4
    // 5
    // 6
    // 7
    // 8
    gamePlay = playTurn(gamePlay, {
      kind: "moveCrown",
      powerCard: { direction: "up", numberOfSteps: 1 },
    });
    expect(gamePlay.game.board.tileGrid[3][4].occupation).toBe(0);
    expect(gamePlay.game.players[0].powerCardHand).toHaveLength(4);

    // 2nd turn by 1
    //  012345678
    // 0
    // 1
    // 2
    // 3   10
    // 4
    // 5
    // 6
    // 7
    // 8
    gamePlay = playTurn(gamePlay, {
      kind: "moveCrown",
      powerCard: { direction: "left", numberOfSteps: 1 },
    });
    expect(gamePlay.game.board.tileGrid[3][3].occupation).toBe(1);
    expect(gamePlay.game.players[1].powerCardHand).toHaveLength(4);

    // 3rd turn by 0
    //  012345678
    // 0   0
    // 1
    // 2
    // 3   10
    // 4
    // 5
    // 6
    // 7
    // 8
    gamePlay = playTurn(gamePlay, {
      kind: "moveCrown",
      powerCard: { direction: "up", numberOfSteps: 3 },
    });
    expect(gamePlay.game.board.tileGrid[0][3].occupation).toBe(0);
    expect(gamePlay.game.players[0].powerCardHand).toHaveLength(3);

    // 4th turn by 1
    //  012345678
    // 0   01
    // 1
    // 2
    // 3   10
    // 4
    // 5
    // 6
    // 7
    // 8
    gamePlay = playTurn(gamePlay, {
      kind: "moveCrown",
      powerCard: { direction: "right", numberOfSteps: 1 },
    });
    expect(gamePlay.game.board.tileGrid[0][4].occupation).toBe(1);
    expect(gamePlay.game.players[1].powerCardHand).toHaveLength(3);

    // 5th turn by 0
    gamePlay = playTurn(gamePlay, {
      kind: "drawCard",
    });
    expect(gamePlay.game.players[0].powerCardHand).toHaveLength(4);

    // 6th turn by 1
    //  012345678
    // 0   01
    // 1
    // 2
    // 3   11
    // 4
    // 5
    // 6
    // 7
    // 8
    gamePlay = playTurn(gamePlay, {
      kind: "moveCrown",
      powerCard: { direction: "down", numberOfSteps: 3 },
    });
    expect(gamePlay.game.board.tileGrid[3][4].occupation).toBe(1);
    expect(gamePlay.game.players[1].powerCardHand).toHaveLength(2);
    expect(gamePlay.game.players[1].numberOfKnightCards).toBe(3);
  });
  test("it can simulate a situation where a game ends with a series of passes", () => {
    let gamePlay = initialize({ firstPlayerIndex: 0 });
    gamePlay.game.players[0].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
      { direction: "up", numberOfSteps: 2 },
      { direction: "up", numberOfSteps: 3 },
      { direction: "left", numberOfSteps: 1 },
      { direction: "left", numberOfSteps: 2 },
    ];
    gamePlay.game.players[1].powerCardHand = [
      { direction: "upLeft", numberOfSteps: 1 },
      { direction: "upLeft", numberOfSteps: 2 },
      { direction: "upLeft", numberOfSteps: 3 },
      { direction: "upRight", numberOfSteps: 1 },
      { direction: "upRight", numberOfSteps: 2 },
    ];
    gamePlay.game.board.crownPosition = [0, 0];
    gamePlay = playTurn(gamePlay, { kind: "pass" });
    gamePlay = playTurn(gamePlay, { kind: "pass" });
    expect(gamePlay.winner).toBe("draw");
  });
  test("it can simulate a situation where the game is over because there are now 52 occupied tiles", () => {
    let gamePlay = initialize({ firstPlayerIndex: 0 });
    gamePlay.game.players[0].powerCardHand = [
      { direction: "up", numberOfSteps: 1 },
    ];
    gamePlay.game.players[1].powerCardHand = [
      { direction: "up", numberOfSteps: 2 },
    ];
    gamePlay.game.board.tileGrid = createTileGrid({
      initialOccupation: [
        "000000000",
        "000000000",
        "000000000",
        "000000000",
        "000000000",
        "00000    ",
        "         ",
        "         ",
        "         ",
      ].join("\n"),
    });
    gamePlay.game.board.crownPosition = [8, 8];
    gamePlay = playTurn(gamePlay, {
      kind: "moveCrown",
      powerCard: { direction: "up", numberOfSteps: 1 },
    });
    expect(gamePlay.winner).toBe(undefined);
    gamePlay = playTurn(gamePlay, {
      kind: "moveCrown",
      powerCard: { direction: "up", numberOfSteps: 2 },
    });
    expect(gamePlay.winner).toBe(0);
  });
});
