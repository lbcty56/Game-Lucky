// ui.js - Contains the UI interactions
import { GameState, GameLogic } from './game.js';
import Dice3D from './dice.js';

// Constants for dice rotation angles
const rotateFaceAngleX = [0, 90, 0, 0, -90, 180];
const rotateFaceAngleY = [0, 0, -90, 90, 0, 0];

// DOM Elements
const UI = {
  // Dice elements
  player1Dice: document.querySelectorAll(".player1Container .dice"),
  player2Dice: document.querySelectorAll(".player2Container .dice"),

  // Button elements
  player1RollBtn: document.querySelector(".player1btn"),
  player2RollBtn: document.querySelector(".player2btn"),
  playersRollBtn: document.querySelector("#shakeAll"),
  player1FinishedBtn: document.querySelector(".player1ClickedBtn"),
  player2FinishedBtn: document.querySelector(".player2ClickedBtn"),

  // Fire elements
  allFireElements: document.getElementsByClassName("fire"),

  // Screen elements
  player1Screen: document.querySelector("#player1Screen"),
  player2Screen: document.querySelector("#player2Screen"),
  player1ScreenText: document.querySelector("#player1ScreenText"),
  player2ScreenText: document.querySelector("#player2ScreenText"),
  rollText: document.querySelector("#rollText"),

  // Score elements
  player1Board: document.querySelector("#player1ScoreBoard"),
  player2Board: document.querySelector("#player2ScoreBoard"),
  player1ScoreScreen: document.querySelector("#player1Rank"),
  player2ScoreScreen: document.querySelector("#player2Rank"),

  // Dice instances
  diceInstances: new Map(), // Store dice instances by position
  diceSize: 130,

  // Initialize all UI elements
  init() {
    this.initializeDice();
    this.setupEventListeners();
    this.setupKeyboardControls();
  },

  initializeDice() {
    // Initialize dice for both players
    const player1Container = document.querySelector("#player1DiceContainer");
    const player2Container = document.querySelector("#player2DiceContainer");

    // Create 5 dice for each player
    for (let i = 1; i <= 10; i++) {
      const dice = new Dice3D(this.diceSize);
      const diceElement = dice.renderer.domElement;

      // Configure dice element
      diceElement.classList.add('dice');
      diceElement.setAttribute('position', i);

      // Create a wrapper div for each dice
      const diceWrapper = document.createElement('div');
      diceWrapper.className = 'dice-wrapper';
      diceWrapper.style.width = `${this.diceSize}px`;
      diceWrapper.style.height = `${this.diceSize}px`;
      diceWrapper.appendChild(diceElement);

      // Add to appropriate container
      i <= 5 ? player1Container.appendChild(diceWrapper) : player2Container.appendChild(diceWrapper);

      // Store dice instance
      this.diceInstances.set(i, dice);

      // Set up dice completion callback
      dice.onRollComplete = (value) => {
        GameLogic.recordDice(i, value);
        GameState.rollRecord[i] = true;
        this.updateDiceLighting();
        this.updateButtonVisibility();

        if (GameLogic.allDiceRolled()) {
          this.processRollingResults();
        }
      };
    }
  },

  // Set up event listeners
  setupEventListeners() {
    // Roll buttons
    this.player1RollBtn.addEventListener("click", () => {
      this.rollPlayerDice(1);
    });

    this.player2RollBtn.addEventListener("click", () => {
      this.rollPlayerDice(2);
    });

    this.playersRollBtn.addEventListener("click", () => {
      this.rollAllDice();
    });

    // Finished buttons
    this.player1FinishedBtn.addEventListener("click", () => {
      if (!this.player1FinishedBtn.classList.contains("btnHide")) {
        GameLogic.markPlayerDiceAsRolled(1);
        for (let i = 1; i <= 5; i++) {
          clearTimeout(GameState.timeoutIDs[i]);
        }
        this.processRollingResults();
      }
    });

    this.player2FinishedBtn.addEventListener("click", () => {
      if (!this.player2FinishedBtn.classList.contains("btnHide")) {
        GameLogic.markPlayerDiceAsRolled(2);
        for (let i = 6; i <= 10; i++) {
          clearTimeout(GameState.timeoutIDs[i]);
        }
        this.processRollingResults();
      }
    });

    // Dice click events
    this.diceInstances.forEach((dice, position) => {
      dice.renderer.domElement.addEventListener("click", (event) => {
        if (!GameState.rollRecord[position]) {
          dice.handleClick(event);
        }
      });
    });

    // Animation removal on first click
    Array.from(document.querySelectorAll("button")).forEach((btn) =>
      btn.addEventListener("click", () => {
        if (GameState.gameNumber === 0) {
          this.player1Screen.classList.remove("appear");
          this.player2Screen.classList.remove("appear");
          this.player1Screen.style.setProperty("animation-delay", "0s");
          this.player2Screen.style.setProperty("animation-delay", "0s");
          GameLogic.incrementGameNumber();
        }
      })
    );
  },

  // Set up keyboard controls
  setupKeyboardControls() {
    document.addEventListener("keydown", (event) => {
      const key = event.key;

      switch (key) {
        case "Enter":
        case " ":
          this.playersRollBtn.click();
          break;
        case "a":
        case "A":
          this.player1RollBtn.click();
          break;
        case "j":
        case "J":
          this.player2RollBtn.click();
          break;
        case "d":
        case "D":
          this.player1FinishedBtn.click();
          break;
        case "l":
        case "L":
          this.player2FinishedBtn.click();
          break;
        default:
          // Number keys for dice
          if (key >= "1" && key <= "9") {
            const diceIndex = parseInt(key, 10) - 1;
            const dice = this.diceInstances.get(diceIndex + 1);
            if (dice) {
              dice.click();
            }
          } else if (key === "0") {
            const dice = this.diceInstances.get(10); // 10th dice (index 9)
            if (dice) {
              dice.click();
            }
          }
      }
    });
  },

  // Roll dice for a specific player (1 or 2)
  rollPlayerDice(playerId) {
    const startIndex = playerId === 1 ? 1 : 6;
    const endIndex = startIndex + 4;

    if (this.hasUnrolledDice(startIndex, endIndex)) {
      for (let i = startIndex; i <= endIndex; i++) {
        if (!GameState.rollRecord[i]) {
          const diceInstance = this.diceInstances.get(i);
          if (diceInstance) {
            clearTimeout(GameState.timeoutIDs[i]);
            diceInstance.rollDice();
          }
        }
      }
    }
  },

  // Roll all dice
  rollAllDice() {
    GameLogic.resetGame();
    this.updateButtonVisibility(4, 3); // Show all roll buttons, hide all finish buttons

    // Clear all timeouts
    for (let i = 1; i <= 10; i++) {
      clearTimeout(GameState.timeoutIDs[i]);
      const diceInstance = this.diceInstances.get(i);
      if (diceInstance) {
        diceInstance.rollDice();
      }
    }
  },

  // Process results after rolling is complete
  processRollingResults() {
    const results = GameLogic.processResults();

    // Update dice hand text
    this.player1ScreenText.innerHTML = results.player1Result[0];
    this.player2ScreenText.innerHTML = results.player2Result[0];
    this.rollText.innerHTML = "Click any Dice to Roll";

    // Handle different game states
    switch (results.status) {
      case 'tie':
        this.handleTieResult();
        break;
      case 'firstRound':
        this.handleFirstRoundResult(results.winner);
        break;
      case 'roundProgress':
        this.handleRoundProgressResult(results.winner);
        break;
      case 'gameEnd':
        this.handleGameEndResult(results.winner);
        break;
    }
  },

  // Handle tie result
  handleTieResult() {
    this.applyFirstRoundNoWinnerEffect();
    this.player1ScreenText.innerHTML = "Reroll";
    this.player2ScreenText.innerHTML = "Reroll";
    this.updateButtonVisibility(4, 3); // Show all roll buttons, hide all finish buttons
    this.updateDiceLighting();
  },

  // Handle first round result
  handleFirstRoundResult(winner) {
    this.applyGameProgressEffect(winner);
    this.updateButtonVisibility(winner, winner); // Show appropriate buttons
    this.updateDiceLighting();
  },

  // Handle round progress result
  handleRoundProgressResult(winner) {
    this.applyGameProgressEffect(winner);
    this.updateButtonVisibility(winner, winner);
    this.updateDiceLighting();
  },

  // Handle game end result
  handleGameEndResult(winner) {
    this.applyGameEndEffect(winner);
    this.updateButtonVisibility(4, 3); // Show all roll buttons, hide all finish buttons
    this.updateDiceLighting();
  },

  // Apply visual effects for first round tie
  applyFirstRoundNoWinnerEffect() {
    const style = {
      textColor: "#f7ef8a",
      baseColor: "#f7ef8a",
      endTextColor: "#f7ef8a",
      textShadowColor: "#f7ef8a",
    };

    Object.entries(style).forEach(([key, value]) => {
      [this.player1ScreenText, this.player2ScreenText].forEach((element) => {
        element.style.setProperty(`--${key}`, value);
      });
    });
  },

  // Apply visual effects for game progress
  applyGameProgressEffect(winner) {
    // Remove all existing effect classes
    const classesToRemove = [
      "gameProgressWinner",
      "gameEndWinner",
      "gameEndLoser",
    ];

    [this.player1ScreenText, this.player2ScreenText].forEach((element) => {
      classesToRemove.forEach((className) => {
        element.classList.remove(className);
      });
    });

    // Apply loser style
    const loserStyle = {
      textColor: "#f7ef8a",
      baseColor: "#444444",
      endTextColor: "#FF7F7F",
      textShadowColor: "#990F02",
    };

    let winnerText;
    let loserText;

    if (winner === 1) {
      winnerText = [this.player1ScreenText, this.player1Board];
      loserText = [this.player2ScreenText, this.player2Board];
    } else {
      winnerText = [this.player2ScreenText, this.player2Board];
      loserText = [this.player1ScreenText, this.player1Board];
    }

    // Apply winner/loser effects
    winnerText[0].classList.add("gameProgressWinner");
    Object.entries(loserStyle).forEach(([key, value]) =>
      loserText[0].style.setProperty(`--${key}`, value)
    );
  },

  // Apply visual effects for game end
  applyGameEndEffect(winner) {
    // Remove all existing effect classes
    const classesToRemove = [
      "gameProgressWinner",
      "gameEndWinner",
      "gameEndLoser",
    ];

    [this.player1ScreenText, this.player2ScreenText].forEach((element) => {
      classesToRemove.forEach((className) => {
        element.classList.remove(className);
      });
    });

    let winnerText;
    let loserText;

    if (winner === 1) {
      winnerText = [this.player1ScreenText, this.player1ScoreScreen, this.player1Board];
      loserText = [this.player2ScreenText, this.player2ScoreScreen, this.player2Board];
    } else if (winner === 2) {
      winnerText = [this.player2ScreenText, this.player2ScoreScreen, this.player2Board];
      loserText = [this.player1ScreenText, this.player1ScoreScreen, this.player1Board];
    }

    // Set text and scores
    winnerText[0].innerHTML = "Win";
    winnerText[1].innerHTML = GameLogic.getPlayerRank(winner);
    loserText[0].innerHTML = "Lose";
    loserText[1].innerHTML = GameLogic.getPlayerRank(winner === 1 ? 2 : 1);

    // Add css classes
    winnerText[0].classList.add("gameEndWinner");
    loserText[0].classList.add("gameEndLoser");

    // Animation for score board
    setTimeout(() => {
      winnerText[2].style.setProperty("--lightColor", "#f7ef8a");
      winnerText[2].style.setProperty(
        "box-shadow",
        "0 0 1rem 0.25rem #f7ef8a, inset 0 0 1rem 0.25rem #f7ef8a"
      );
      setTimeout(() => {
        winnerText[2].style.setProperty(
          "--lightColor",
          winner === 1 ? "#00ffc7" : "#00efff"
        );
        winnerText[2].style.setProperty("box-shadow", "none");
      }, 2000);
    }, 1000);
  },

  // Update the fire lighting under dice
  updateDiceLighting() {
    for (let i = 1; i <= 10; i++) {
      if (!GameState.rollRecord[i]) {
        if (i <= 5) {
          this.allFireElements[i - 1].style.setProperty("--fireColor", "#00ffc7");
          this.allFireElements[i - 1].style.setProperty(
            "--fireSpreadColor",
            "rgba(64, 255, 213, 0.78)"
          );
        } else {
          this.allFireElements[i - 1].style.setProperty("--fireColor", "#00efff");
          this.allFireElements[i - 1].style.setProperty(
            "--fireSpreadColor",
            "rgba(78, 176, 255, 0.78)"
          );
        }
      } else {
        this.allFireElements[i - 1].style.setProperty("--fireColor", "#8a8a8a");
        this.allFireElements[i - 1].style.setProperty(
          "--fireSpreadColor",
          "rgba(138, 138, 138, 0.78)"
        );
      }
    }
  },

  // Update button visibility
  updateButtonVisibility(rollBtnSituation, finishBtnSituation) {
    if (rollBtnSituation === undefined || finishBtnSituation === undefined) {
      const { player1HasFalse, player2HasFalse } = GameLogic.checkPlayerRollStatus();

      if (player1HasFalse && player2HasFalse) {
        rollBtnSituation = 4; // Show all roll buttons
        finishBtnSituation = 3; // Hide all finish buttons
      } else if (player1HasFalse) {
        rollBtnSituation = 2; // Show player1 roll button
        finishBtnSituation = 2; // Show player2 finish button
      } else if (player2HasFalse) {
        rollBtnSituation = 1; // Show player2 roll button
        finishBtnSituation = 1; // Show player1 finish button
      }

      if (GameState.lastWinner === 0) {
        finishBtnSituation = 3; // Hide all finish buttons in first round
      }
    }

    this.updateRollButtonVisibility(rollBtnSituation);
    this.updateFinishButtonVisibility(finishBtnSituation);
  },

  // Update roll button visibility
  updateRollButtonVisibility(situation) {
    // Hide all roll buttons by default
    this.player1RollBtn.classList.add("btnHide");
    this.player2RollBtn.classList.add("btnHide");

    switch (situation) {
      // Case 1: Hide Player 1 roll button
      case 1:
        this.player1RollBtn.classList.add("btnHide");
        this.player2RollBtn.classList.remove("btnHide");
        break;
      // Case 2: Hide Player 2 roll button
      case 2:
        this.player1RollBtn.classList.remove("btnHide");
        this.player2RollBtn.classList.add("btnHide");
        break;
      // Case 4: Show all roll buttons
      case 4:
        this.player1RollBtn.classList.remove("btnHide");
        this.player2RollBtn.classList.remove("btnHide");
        break;
      // Case 3: Hide all roll buttons (default)
      default:
        this.player1RollBtn.classList.add("btnHide");
        this.player2RollBtn.classList.add("btnHide");
        break;
    }
  },

  // Update finish button visibility
  updateFinishButtonVisibility(situation) {
    // Hide all finish buttons by default
    this.player1FinishedBtn.classList.add("btnHide");
    this.player2FinishedBtn.classList.add("btnHide");

    switch (situation) {
      // Case 1: Hide Player 1 finish button
      case 1:
        this.player1FinishedBtn.classList.add("btnHide");
        this.player2FinishedBtn.classList.remove("btnHide");
        break;
      // Case 2: Hide Player 2 finish button
      case 2:
        this.player1FinishedBtn.classList.remove("btnHide");
        this.player2FinishedBtn.classList.add("btnHide");
        break;
      // Case 4: Show all finish buttons
      case 4:
        this.player1FinishedBtn.classList.remove("btnHide");
        this.player2FinishedBtn.classList.remove("btnHide");
        break;
      // Case 3: Hide all finish buttons (default)
      default:
        this.player1FinishedBtn.classList.add("btnHide");
        this.player2FinishedBtn.classList.add("btnHide");
        break;
    }
  },

  // Check if there are unrolled dice in a range
  hasUnrolledDice(startIndex, endIndex) {
    return Object.values(GameState.rollRecord)
      .slice(startIndex - 1, endIndex + 1)
      .some(value => !value);
  },

  // Add cleanup method for Three.js resources
  cleanup() {
    this.diceInstances.forEach(dice => {
      dice.renderer.dispose();
      dice.scene.dispose();
      // Clean up any other Three.js resources
    });
    this.diceInstances.clear();
  }
};

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});

// Add window cleanup
window.addEventListener('beforeunload', () => {
  UI.cleanup();
});

export default UI;