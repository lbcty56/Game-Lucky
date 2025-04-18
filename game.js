// game.js - Contains the core game logic

// Game state data
const GameState = {
  // Roll tracking
  rollRecord: {
    1: false, 2: false, 3: false, 4: false, 5: false,
    6: false, 7: false, 8: false, 9: false, 10: false,
  },

  // Timeout IDs for animation
  timeoutIDs: {
    1: null, 2: null, 3: null, 4: null, 5: null,
    6: null, 7: null, 8: null, 9: null, 10: null,
  },

  // Player dice records - simplified to one record per player
  player1DiceRecord: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  player2DiceRecord: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },

  // Game progress tracking
  lastWinner: 0,
  currentWinner: null,
  player1Rank: 0,
  player2Rank: 0,
  gameNumber: 0
};


// Game logic functions
const GameLogic = {

  // Record dice value
  recordDice(position, randomNumber) {
    if (randomNumber == 1) {
      randomNumber = 7;
    }
    if (position < 6) {
      GameState.player1DiceRecord[position] = randomNumber;
    } else {
      GameState.player2DiceRecord[position - 5] = randomNumber;
    }
  },

  // Roll dice and update state (combines generating and recording)
  rollDice(position) {
    // Generate random dice value (1-6)
    const randomNumber = Math.ceil(Math.random() * 6);
    this.recordDice(position, randomNumber);
    return randomNumber;
  },

  // Hand evaluation
  evaluateHand(hand) {
    // Sort dice by frequency (high to low), then by value (high to low)
    const sortedDice = Object.values(hand).sort((a, b) => Object.values(hand).filter(v => v === b).length - Object.values(hand).filter(v => v === a).length || b - a);

    // Extract frequencies in descending order (e.g. [3,2] for full house)
    const frequencies = [...new Set(sortedDice)].map(val => sortedDice.filter(v => v === val).length).sort((a, b) => b - a);

    // All dice values are the same and it's a 7
    if (frequencies.length === 1 && sortedDice[0] === 7) {
      return ["Lucky af", sortedDice];
    }

    // All dice values are the same (five of a kind)
    if (frequencies.length === 1) {
      return ["Five of a kind", sortedDice];
    }

    // Four of the same value
    if (frequencies[0] === 4) {
      return ["Four of a kind", sortedDice];
    }

    // Three of one value, two of another (full house)
    if (frequencies[0] === 3 && frequencies[1] === 2) {
      return ["Full House", sortedDice];
    }

    // Five different values and no 6 or no 7 (straight)
    if (frequencies.length === 5 && (!sortedDice.includes(6) || !sortedDice.includes(7))) {
      return ["A Straight", sortedDice];
    }

    // Three of the same value (set)
    if (frequencies[0] === 3) {
      return ["One Set", sortedDice];
    }

    // Two pairs
    if (frequencies[0] === 2 && frequencies[1] === 2) {
      return ["Two Pairs", sortedDice];
    }

    // One pair
    if (frequencies[0] === 2) {
      return ["One Pair", sortedDice];
    }

    // Nothing
    return ["Drink la", sortedDice];
  },

  // Determine winner
  determineWinner(result1, result2) {
    const resultScore = {
      "Drink la": 0,
      "One Pair": 1,
      "Two Pairs": 2,
      "One Set": 3,
      "A Straight": 4,
      "Full House": 5,
      "Four of a kind": 6,
      "Five of a kind": 7,
      "Lucky af": 8,
    };

    var player1TempScore = resultScore[result1[0]],
        player2TempScore = resultScore[result2[0]];

    if (player1TempScore == player2TempScore) {
      for (let i = 0; i < 5; i++) {
        const diff = result1[1][i] - result2[1][i];
        if (diff != 0) {
          diff > 0 ? ++player1TempScore : ++player2TempScore;
          break;
        }
      }
    }

    if (player1TempScore > player2TempScore) {
      for (let i = 6; i <= 10; i++) {
        GameState.rollRecord[i] = false;
      }
      return 1;
    } else if (player2TempScore > player1TempScore) {
      for (let i = 1; i <= 5; i++) {
        GameState.rollRecord[i] = false;
      }
      return 2;
    } else if (player1TempScore == player2TempScore) {
      return 3;
    }
  },

  // Reset game state
  resetGame() {
    GameState.lastWinner = 0;
    GameState.currentWinner = 0;

    for (let i = 1; i <= 10; i++) {
      GameState.rollRecord[i] = false;
    }

    GameState.player1DiceRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    GameState.player2DiceRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  },

  // Check if player has unrolled dice
  checkPlayerRollStatus() {
    const player1HasFalse = Object.values({
      1: GameState.rollRecord[1],
      2: GameState.rollRecord[2],
      3: GameState.rollRecord[3],
      4: GameState.rollRecord[4],
      5: GameState.rollRecord[5],
    }).some((value) => !value);

    const player2HasFalse = Object.values({
      1: GameState.rollRecord[6],
      2: GameState.rollRecord[7],
      3: GameState.rollRecord[8],
      4: GameState.rollRecord[9],
      5: GameState.rollRecord[10],
    }).some((value) => !value);

    return { player1HasFalse, player2HasFalse };
  },

  // Check if all dice are rolled
  allDiceRolled() {
    return !Object.values(GameState.rollRecord).some((value) => !value);
  },

  // Mark player's dice as rolled
  markPlayerDiceAsRolled(playerId) {
    const startIndex = playerId === 1 ? 1 : 6;
    const endIndex = playerId === 1 ? 5 : 10;

    for (let i = startIndex; i <= endIndex; i++) {
      GameState.rollRecord[i] = true;
    }
  },

  // Process results after rolling is finished
  processResults() {
    const player1Result = this.evaluateHand(GameState.player1DiceRecord);
    const player2Result = this.evaluateHand(GameState.player2DiceRecord);

    // First round result
    if (GameState.lastWinner === 0) {
      GameState.lastWinner = this.determineWinner(player1Result, player2Result);

      // Handle tie
      if (GameState.lastWinner === 3) {
        this.resetGame();
        return {
          status: 'tie',
          player1Result,
          player2Result
        };
      }

      return {
        status: 'firstRound',
        winner: GameState.lastWinner,
        player1Result,
        player2Result
      };
    }
    // Subsequent rounds
    else {
      GameState.currentWinner = this.determineWinner(player1Result, player2Result);

      // Handle tie
      if (GameState.currentWinner === 3) {
        const winner = GameState.lastWinner;
        this.resetGame();
        return {
          status: 'gameEnd',
          winner,
          player1Result,
          player2Result
        };
      }

      // Consecutive win by same player
      if (GameState.currentWinner === GameState.lastWinner) {
        const winner = GameState.lastWinner;
        // Update player ranks
        if (winner === 1) {
          GameState.player1Rank++;
        } else {
          GameState.player2Rank++;
        }
        this.resetGame();
        return {
          status: 'gameEnd',
          winner,
          player1Result,
          player2Result,
          player1Rank: GameState.player1Rank,
          player2Rank: GameState.player2Rank
        };
      }
      // Different winner than last round
      else {
        GameState.lastWinner = GameState.currentWinner;
        return {
          status: 'roundProgress',
          winner: GameState.lastWinner,
          player1Result,
          player2Result
        };
      }
    }
  },

  // Game state getters
  getPlayerRank(playerId) {
    return playerId === 1 ? GameState.player1Rank : GameState.player2Rank;
  },

  incrementGameNumber() {
    GameState.gameNumber++;
    return GameState.gameNumber;
  }
};

// Export the game logic and state
export { GameState, GameLogic };