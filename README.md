# rosenkoenig-core

![run-tests](https://github.com/kjirou/rosenkoenig-core/actions/workflows/run-tests.yml/badge.svg)

Core engine of the board game [Rosenkönig](https://de.wikipedia.org/wiki/Rosenk%C3%B6nig)

## :chess_pawn: Usage

This is a set of APIs to implement Rosenkönig.

For example, use the following image.  
Or see the [web demo](https://kjirou.github.io/rosenkoenig-core/) and its [pure HTML/JS source code](https://github.com/kjirou/rosenkoenig-core/blob/gh-pages/docs/index.html).

```js
import {
  computeNextPlayerIndex,
  computeSelectablePlayerActions,
  initialize,
  playTurn,
} from "rosenkoenig-core";

const gamePlay = initialize();

// Returns the next player to act as an index of 0 or 1.
const nextPlayerIndex = computeNextPlayerIndex(gamePlay);

// Returns a list of actions that the player can select from.
// The list includes the following types of actions.
//
// 1. Move the crown by using power card
// 2. Draw a power card
// 3. Pass the turn
const selectablePlayerActions = computeSelectablePlayerActions({
  board: gamePlay.game.board,
  player: gamePlay.game.players[nextPlayerIndex],
  playerIndex: nextPlayerIndex,
});

// Determines the action the player selects to take.
// Usually, the selection would be made through the UI.
const playerAction = selectablePlayerActions[0];

// Resolves the player action and generates new game states.
// Wins and losses are also computed at this point.
const newGamePlay = playTurn(gamePlay, playerAction);
```

## :cat: API Doc

Look at the [source code](/src/index.ts) :innocent:

## :hammer_and_wrench: Development

### Preparation

- [Node.js](https://nodejs.org/)
  - The version is defined in [.nvmrc](/.nvmrc).

### Installation

```
git clone git@github.com:kjirou/rosenkoenig-core.git
cd ./rosenkoenig-core
npm install
```
