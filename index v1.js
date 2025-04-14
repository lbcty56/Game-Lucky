const allPlayersDiceElements = document.getElementsByClassName("dice");
const player1 = document.querySelectorAll(".player1Container .dice");
const player2 = document.querySelectorAll(".player2Container .dice");

const player1Rollbtn = document.querySelector(".player1btn");
const player2Rollbtn = document.querySelector(".player2btn");
const playersRollbtn = document.querySelector("#shakeAll");

const player1FinishedBtn = document.querySelector(".player1ClickedBtn");
const player2FinishedBtn = document.querySelector(".player2ClickedBtn");

const allFireElements = document.getElementsByClassName("fire");

const rotateFaceAngleX = [0, 90, 0, 0, -90, 180];
const rotateFaceAngleY = [0, 0, -90, 90, 0, 0];

var rollRecord = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
  7: false,
  8: false,
  9: false,
  10: false,
};

//records for 5 dices
var player1DiceLastRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
var player2DiceLastRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
var player1DiceNewRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
var player2DiceNewRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

//summary for dices value
var player1DiceSummary = {
  7: 0,
  6: 0,
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  0: 5,
};
var player2DiceSummary = {
  7: 0,
  6: 0,
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  0: 5,
};

let timeoutIDs = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
  7: null,
  8: null,
  9: null,
  10: null,
};

var rollRecord = {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
  7: false,
  8: false,
  9: false,
  10: false,
};

let lastWinner = 0,
  currentWinner;

var player1Screen = document.querySelector("#player1Screen");
var player2Screen = document.querySelector("#player2Screen");
var player1ScreenText = document.querySelector("#player1ScreenText");
var player2ScreenText = document.querySelector("#player2ScreenText");

var player1Rank = 0,
  player2Rank = 0;

var player1Board = document.querySelector("#player1ScoreBoard");
var player2Board = document.querySelector("#player2ScoreBoard");

var player1ScoreScreen = document.querySelector("#player1Rank");
var player2ScoreScreen = document.querySelector("#player2Rank");

function recordDices(position, randomNumber) {
  if (randomNumber == 1) {
    randomNumber = 7;
  }
  if (position < 6) {
    player1DiceNewRecord[position] = randomNumber;
  } else {
    player2DiceNewRecord[position - 5] = randomNumber;
  }
}

function updateSummary() {
  for (var k = 1; k <= 5; k++) {
    player1DiceSummary[player1DiceLastRecord[k]] -= 1;
    player1DiceSummary[player1DiceNewRecord[k]] += 1;
    player1DiceLastRecord[k] = player1DiceNewRecord[k];
    player2DiceSummary[player2DiceLastRecord[k]] -= 1;
    player2DiceSummary[player2DiceNewRecord[k]] += 1;
    player2DiceLastRecord[k] = player2DiceNewRecord[k];
  }
}

function getRandomRotation() {
  const randomNumber = Math.ceil(Math.random() * 6);
  const rotateX =
    rotateFaceAngleX[randomNumber - 1] +
    Math.floor(Math.random() * 9 - 4) * 360;
  const rotateY =
    rotateFaceAngleY[randomNumber - 1] +
    Math.floor(Math.random() * 9 - 4) * 360;
  return { randomNumber, rotateX, rotateY };
}

function randomDice(player, dices) {
  for (var i = 0; i < dices; i++) {
    const { randomNumber, rotateX, rotateY } = getRandomRotation();
    var position = Number(player[i].getAttribute("position"));
    recordDices(position, randomNumber);
    player[i].style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }
  updateSummary();
}

function btnEffectBeforeFinish() {
  var player1HasFalse = Object.values({
    1: rollRecord[1],
    2: rollRecord[2],
    3: rollRecord[3],
    4: rollRecord[4],
    5: rollRecord[5],
  }).some((value) => !value);
  var player2HasFalse = Object.values({
    1: rollRecord[6],
    2: rollRecord[7],
    3: rollRecord[8],
    4: rollRecord[9],
    5: rollRecord[10],
  }).some((value) => !value);
  if (player1HasFalse && player2HasFalse) {
    rollBtnEffect(4);
    finishBtnEffect(3);
  } else if (player1HasFalse) {
    rollBtnEffect(2); //Roll Btn: Case 2 Hide P2
    finishBtnEffect(2);
  } else if (player2HasFalse) {
    rollBtnEffect(1); //Roll Btn: case 1 Hide P1
    finishBtnEffect(1);
  }

  if (lastWinner == 0) {
    finishBtnEffect(3);
  }
}

function finishedRollingAndDetermineWinner() {
  const player1Result = evaluateHand(player1DiceSummary, player1DiceLastRecord);
  const player2Result = evaluateHand(player2DiceSummary, player2DiceLastRecord);

  document.querySelector("#rollText").innerHTML = "Click any Dice to Roll";

  player1ScreenText.innerHTML = player1Result[0];
  player2ScreenText.innerHTML = player2Result[0];

  //1st Rolling for both Players Finished in Game
  if (lastWinner == 0) {
    lastWinner = determineWinner(player1Result, player2Result);
    //   gameStartEffect();
    if (lastWinner == 1 || lastWinner == 2) {
      gameProgressEffect(lastWinner);
      rollBtnEffect(lastWinner); //Roll Btn: case 1 Hide P1, case 2 Hide P2
      finishBtnEffect(lastWinner); //Finish Btn: Case 1 Hide P1, case 2 Hide P2
    }
    //Special Case: Same Dices for both Players
    else if (lastWinner == 3) {
      gameFinished();
      firstRoundNoWinnerEffect();
      player1ScreenText.innerHTML = "Reroll";
      player2ScreenText.innerHTML = "Reroll";
      rollBtnEffect(4); //Roll Btn: Case 4 No Hide
      finishBtnEffect(3); //Finish Btn: Case 3 All Hide
    }
    return;
  }
  //Nth Rolling for both Players Finished in Game after 1st Rolling
  else {
    currentWinner = determineWinner(player1Result, player2Result);
    //Special Case: Same Dices for both Players
    if (currentWinner == 3) {
      gameEndEffect(lastWinner);
      gameFinished();
      rollBtnEffect(4); //Roll Btn: case 4 No Hide
      finishBtnEffect(3); //Finish Btn: Case 1 All Hide
      return;
    }
    //One Player wins consecutively
    if (currentWinner == lastWinner) {
      gameEndEffect(lastWinner);
      gameFinished();
      rollBtnEffect(4); //Roll Btn: case 4 No Hide
      finishBtnEffect(3); //Finish Btn: Case 1 All Hide
      return;
    }
    //One Player win and lose consecutively
    else {
      lastWinner = currentWinner;
      gameProgressEffect(lastWinner);
      rollBtnEffect(lastWinner); //Roll Btn: case 1 Hide P1, case 2 Hide P2
      finishBtnEffect(lastWinner); //Finish Btn: Case 1 Player 1 Hide
    }
  }
}

function diceLightingEffect() {
  for (var i = 1; i <= 10; i++) {
    if (!rollRecord[i]) {
      if (i <= 5) {
        allFireElements[i - 1].style.setProperty("--fireColor", "#00ffc7");
        allFireElements[i - 1].style.setProperty(
          "--fireSpreadColor",
          "rgba(64, 255, 213, 0.78)"
        );
      } else {
        allFireElements[i - 1].style.setProperty("--fireColor", "#00efff");
        allFireElements[i - 1].style.setProperty(
          "--fireSpreadColor",
          "rgba(78, 176, 255, 0.78)"
        );
      }
    } else {
      allFireElements[i - 1].style.setProperty("--fireColor", "#8a8a8a");
      allFireElements[i - 1].style.setProperty(
        "--fireSpreadColor",
        "rgba(138, 138, 138, 0.78)"
      );
    }
  }
}

function firstRoundNoWinnerEffect() {
  const style = {
    textColor: "#f7ef8a",
    baseColor: "#f7ef8a",
    endTextColor: "#f7ef8a",
    textShadowColor: "#f7ef8a",
  };

  Object.entries(style).forEach(([key, value]) => {
    [player1ScreenText, player2ScreenText].forEach((element) => {
      element.style.setProperty(`--${key}`, value);
    });
  });
}

function gameProgressEffect(tempWinner) {
  const classesToRemove = [
    "gameProgressWinner",
    "gameEndWinner",
    "gameEndLoser",
  ];

  [player1ScreenText, player2ScreenText].forEach((element) => {
    classesToRemove.forEach((className) => {
      element.classList.remove(className);
    });
  });

  const loserStyle = {
    textColor: "#f7ef8a",
    baseColor: "#444444",
    endTextColor: "#FF7F7F",
    textShadowColor: "#990F02",
  };
  let winnerText;
  let loserText;

  if (tempWinner === 1) {
    winnerText = [player1ScreenText, player1Board];
    loserText = [player2ScreenText, player2Board];
  } else {
    winnerText = [player2ScreenText, player2Board];
    loserText = [player1ScreenText, player1Board];
  }

  winnerText[0].classList.add("gameProgressWinner");
  Object.entries(loserStyle).forEach(([key, value]) =>
    loserText[0].style.setProperty(`--${key}`, value)
  );
}

function gameEndEffect(winner) {
  const classesToRemove = [
    "gameProgressWinner",
    "gameEndWinner",
    "gameEndLoser",
  ];

  [player1ScreenText, player2ScreenText].forEach((element) => {
    classesToRemove.forEach((className) => {
      element.classList.remove(className);
    });
  });

  let winnerText;
  let loserText;

  if (winner === 1) {
    winnerText = [player1ScreenText, player1ScoreScreen, player1Board];
    loserText = [player2ScreenText, player2ScoreScreen, player2Board];
    player1Rank++;
  } else if (winner === 2) {
    winnerText = [player2ScreenText, player2ScoreScreen, player2Board];
    loserText = [player1ScreenText, player1ScoreScreen, player1Board];
    player2Rank++;
  }

  winnerText[0].innerHTML = "Win";
  winnerText[1].innerHTML = winner === 1 ? player1Rank : player2Rank;
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
  winnerText[0].classList.add("gameEndWinner");
  loserText[0].innerHTML = "Lose";
  loserText[1].innerHTML = winner === 1 ? player2Rank : player1Rank;
  loserText[0].classList.add("gameEndLoser");
}

function rollBtnEffect(situation) {
  player1Rollbtn.classList.add("btnHide");
  player2Rollbtn.classList.add("btnHide");

  switch (situation) {
    // Case 1: Hide Player 1
    case 1:
      player1Rollbtn.classList.add("btnHide");
      player2Rollbtn.classList.remove("btnHide");
      break;
    // Case 2: Hide Player 2
    case 2:
      player1Rollbtn.classList.remove("btnHide");
      player2Rollbtn.classList.add("btnHide");
      break;
    // Case 4: No Hide
    case 4:
      player1Rollbtn.classList.remove("btnHide");
      player2Rollbtn.classList.remove("btnHide");
      break;
    // Case 3: Hide All (default)
    default:
      player1Rollbtn.classList.add("btnHide");
      player2Rollbtn.classList.add("btnHide");
      break;
  }
}

function finishBtnEffect(situation) {
  player1FinishedBtn.classList.add("btnHide");
  player2FinishedBtn.classList.add("btnHide");
  switch (situation) {
    // Case 1: Hide Player 1
    case 1:
      player1FinishedBtn.classList.add("btnHide");
      player2FinishedBtn.classList.remove("btnHide");
      break;
    // Case 2: Hide Player 2
    case 2:
      player1FinishedBtn.classList.remove("btnHide");
      player2FinishedBtn.classList.add("btnHide");
      break;
    // Case 4: No Hide
    case 4:
      player1FinishedBtn.classList.remove("btnHide");
      player2FinishedBtn.classList.remove("btnHide");
      break;
    // Case 3: Hide All (default)
    default:
      player1FinishedBtn.classList.add("btnHide");
      player2FinishedBtn.classList.add("btnHide");
      break;
  }
}

function evaluateHand(summary, hand) {
  // sort array according to frequency first and then value
  const sortedValueHandArray = Object.values(hand).sort((a, b) => b - a);
  const sortedHandArray = sortedValueHandArray.sort((a, b) => {
    const freqA = summary[a];
    const freqB = summary[b];
    return freqB - freqA;
  });

  const handCount = Object.values(summary)
    .filter((count) => count > 0)
    .sort((a, b) => b - a);
  const uniqueHandCount = [...new Set(handCount)];

  if (handCount.length == 5 && (summary[6] == 0 || summary[7] == 0)) {
    return ["A Straight", sortedHandArray];
  } else if (handCount.length == 1 && sortedHandArray[0] == 7) {
    return ["Lucky af", sortedHandArray];
  } else if (handCount.length == 1) {
    return ["Five of a kind", sortedHandArray];
  } else if (uniqueHandCount[0] == 4) {
    return ["Four of a kind", sortedHandArray];
  } else if (uniqueHandCount[0] == 3 && uniqueHandCount[1] == 2) {
    return ["Full House", sortedHandArray];
  } else if (uniqueHandCount[0] == 3) {
    return ["One Set", sortedHandArray];
  } else if (handCount.length == 3) {
    return ["Two Pairs", sortedHandArray];
  } else if (uniqueHandCount.length == 2) {
    return ["One Pair", sortedHandArray];
  } else {
    return ["Drink la", sortedHandArray];
  }
}

function determineWinner(result1, result2) {
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
      if (result1[1][i] - result2[1][i] > 0) {
        player1TempScore++;
        break;
      } else if (result1[1][i] - result2[1][i] < 0) {
        player2TempScore++;
        break;
      }
    }
  }

  if (player1TempScore > player2TempScore) {
    for (let i = 6; i <= 10; i++) {
      rollRecord[i] = false;
      diceLightingEffect();
    }
    return 1;
  } else if (player2TempScore > player1TempScore) {
    for (let i = 1; i <= 5; i++) {
      rollRecord[i] = false;
      diceLightingEffect();
    }
    return 2;
  } else if (player1TempScore == player2TempScore) {
    return 3;
  }
}

function gameFinished() {
  lastWinner = 0;
  currentWinner = 0;
  for (let i = 1; i <= 10; i++) {
    rollRecord[i] = false;
  }
  player1DiceLastRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  player2DiceLastRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  player1DiceNewRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  player2DiceNewRecord = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  player1DiceSummary = {
    7: 0,
    6: 0,
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    0: 5,
  };
  player2DiceSummary = {
    7: 0,
    6: 0,
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    0: 5,
  };
  diceLightingEffect();
}

function rollIfRollRecordNotTrue(startIndex) {
  if (
    Object.values(rollRecord)
      .slice(startIndex - 1, startIndex + 4)
      .some((value) => !value)
  ) {
    for (let i = startIndex; i <= startIndex + 4; i++) {
      if (!rollRecord[i]) {
        clearTimeout(timeoutIDs[i]);
        randomDice([allPlayersDiceElements[i - 1]], 1);
        timeoutIDs[i] = setTimeout(() => {
          rollRecord[i] = true;
          diceLightingEffect();
          btnEffectBeforeFinish();
          if (!Object.values(rollRecord).some((value) => !value)) {
            finishedRollingAndDetermineWinner();
          }
        }, 1300);
      }
    }
  }
}

player1Rollbtn.addEventListener("click", function () {
  rollIfRollRecordNotTrue(1); // Player 1 uses indices 1 to 5
});

player2Rollbtn.addEventListener("click", function () {
  rollIfRollRecordNotTrue(6); // Player 2 uses indices 6 to 10
});

playersRollbtn.addEventListener("click", function () {
  gameFinished();
  rollBtnEffect(4);
  finishBtnEffect(3);
  for (var k = 1; k <= 10; k++) {
    clearTimeout(timeoutIDs[k]);
  }
  randomDice(allPlayersDiceElements, allPlayersDiceElements.length);
  for (let i = 1; i <= 10; i++) {
    timeoutIDs[i] = setTimeout(() => {
      rollRecord[i] = true;
      diceLightingEffect();
      btnEffectBeforeFinish();
      if (!Object.values(rollRecord).some((value) => !value)) {
        finishedRollingAndDetermineWinner();
      }
    }, 1300);
  }
});

// Set up click event listeners for all dice only once
Array.from(allPlayersDiceElements).forEach((dice) => {
  dice.addEventListener("click", function () {
    var dicePosition = dice.getAttribute("position");
    if (!rollRecord[dicePosition]) {
      clearTimeout(timeoutIDs[dicePosition]);
      randomDice([dice], 1);
      timeoutIDs[dicePosition] = setTimeout(() => {
        rollRecord[dicePosition] = true;
        diceLightingEffect();
        btnEffectBeforeFinish();
        if (!Object.values(rollRecord).some((value) => !value)) {
          finishedRollingAndDetermineWinner();
        }
      }, 1300);
    }
  });
});

player1FinishedBtn.addEventListener("click", function () {
  if (!player1FinishedBtn.classList.contains("btnHide")) {
    for (let i = 1; i <= 5; i++) {
      rollRecord[i] = true;
      clearTimeout(timeoutIDs[i]);
    }
    finishedRollingAndDetermineWinner();
  }
});

player2FinishedBtn.addEventListener("click", function () {
  if (!player2FinishedBtn.classList.contains("btnHide")) {
    for (let i = 6; i <= 10; i++) {
      rollRecord[i] = true;
      clearTimeout(timeoutIDs[i]);
    }
    finishedRollingAndDetermineWinner();
  }
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  switch (key) {
    case "Enter":
    case " ":
      playersRollbtn.click();
      break;
    case "a":
    case "A":
      player1Rollbtn.click();
      break;
    case "j":
    case "J":
      player2Rollbtn.click();
      break;
    case "d":
    case "D":
      player1FinishedBtn.click();
      break;
    case "l":
    case "L":
      player2FinishedBtn.click();
      break;
    default:
      // Check for number keys '1' to '9' and '0'
      if (key >= "1" && key <= "9") {
        const diceIndex = parseInt(key, 10) - 1;
        const dice = allPlayersDiceElements[diceIndex];
        if (dice) {
          dice.click();
        }
      } else if (key === "0") {
        const dice = allPlayersDiceElements[9]; // 10th dice (index 9)
        if (dice) {
          dice.click();
        }
      }
  }
});

var gameNumber = 0;
Array.from(document.querySelectorAll("button")).forEach((btn) =>
  btn.addEventListener("click", function () {
    if (gameNumber == 0) {
      player1Screen.classList.remove("appear");
      player2Screen.classList.remove("appear");
      player1Screen.style.setProperty("animation-delay", "0s");
      player1Screen.style.setProperty("animation-delay", "0s");
      gameNumber++;
    }
    // if (!Object.values(rollRecord).some((value) => !value)) {
    //   finishedRollingAndDetermineWinner();
    // }
  })
);
