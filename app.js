const gameBoard = document.getElementById("game-board");
const gameMessage = document.getElementById("game-message");
const resetButton = document.getElementById("reset-button");
const muteButton = document.getElementById("mute-button");
const levelDisplay = document.getElementById("level-display");
const livesDisplay = document.getElementById("lives-display");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const overlayBtn = document.getElementById("overlay-btn");

let currentLevel = 1;
let currentLives = 3;
let gameStarted = false;
let playerPos = { r: -1, c: -1 };
let boardData = [];
let flashTimeoutId = null;
let muted = false;

// ---------------- AUDIO ----------------
let audioCtx;

function beep(freq, dur = 100, type = "sine") {
  if (muted) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + dur / 1000
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + dur / 1000);
}

//Game Configuratio
function gridSizeForLevel(lv) {
  return 10 + Math.floor((lv - 1) / 2);
}

//Path Generation
function makeLevel(lv) {
  const size = gridSizeForLevel(lv);
  const g = Array.from({ length: size }, () => Array(size).fill(0));
  let r = 0,
    c = 0;
  g[0][0] = 2;

  while (r !== size - 1 || c !== size - 1) {
    let moves = [];
    if (r < size - 1) moves.push([1, 0]);
    if (c < size - 1) moves.push([0, 1]);

    if (r > 0 && Math.random() < 0.2) moves.push([-1, 0]);
    if (c > 0 && Math.random() < 0.2) moves.push([0, -1]);

    if (moves.length === 0) {
      if (r < size - 1) moves.push([1, 0]);
      if (c < size - 1) moves.push([0, 1]);
      if (r > 0) moves.push([-1, 0]);
      if (c > 0) moves.push([0, -1]);
    }
    if (moves.length === 0) break;

    let [dr, dc] = moves[Math.floor(Math.random() * moves.length)];
    r += dr;
    c += dc;
    if (g[r][c] !== 2 && g[r][c] !== 3) {
      g[r][c] = 1;
    }
  }
  g[size - 1][size - 1] = 3;
  return g;
}

//UI Update Functions
function updateHUD() {
  levelDisplay.textContent = `Level: ${currentLevel}`;
  livesDisplay.textContent = `Lives: ${"❤️".repeat(currentLives)}`;
  gameMessage.textContent = gameStarted
    ? `Level ${currentLevel} - Lives: ${currentLives}`
    : "Click the red square to start!";
}

function applyFlashEffect() {
  document.body.classList.add("flash-red-bg");
  if (flashTimeoutId) clearTimeout(flashTimeoutId);
  flashTimeoutId = setTimeout(() => {
    document.body.classList.remove("flash-red-bg");
  }, 200);
}

function showOverlay(text, buttonText, buttonBg, onClickHandler) {
  overlayText.textContent = text;
  overlayBtn.textContent = buttonText;
  overlayBtn.style.background = buttonBg;
  overlayBtn.style.boxShadow = `0 0 20px ${
    buttonBg.includes("red")
      ? "rgba(255, 107, 107, 0.8)"
      : "rgba(46, 204, 113, 0.8)"
  }`;
  overlayBtn.onclick = () => {
    overlay.classList.remove("visible");
    onClickHandler();
  };
  overlay.classList.add("visible");
}

// Game State Management
function resetGame() {
  currentLevel = 1;
  currentLives = 3;
  gameStarted = false;
  playerPos = { r: -1, c: -1 };
  startGame();
}

function nextLevel() {
  beep(1000, 200);
  currentLevel++;
  gameStarted = false;
  playerPos = { r: -1, c: -1 };
  showOverlay(
    `Level ${currentLevel - 1} Complete!`,
    "Next Level",
    "linear-gradient(to right, #2ecc71, #27ae60)",
    startGame
  );
}

function gameOver() {
  beep(150, 300, "sawtooth");
  gameStarted = false;
  playerPos = { r: -1, c: -1 };
  showOverlay(
    "Game Over!",
    "Restart",
    "linear-gradient(to right, #ff6b6b, #ee5253)",
    resetGame
  );
}
// Game Initialization
function startGame() {
  boardData = makeLevel(currentLevel);
  renderBoard();
  playerPos = { r: -1, c: -1 };
  gameStarted = false;
  updateHUD();
}

// Event Listeners
gameBoard.addEventListener("click", (e) => {
  const clickedCell = e.target.closest(".grid-cell");
  if (!clickedCell) return;

  const r = parseInt(clickedCell.dataset.row);
  const c = parseInt(clickedCell.dataset.col);

  if (!gameStarted && boardData[r][c] === 2) {
    gameStarted = true;
    beep(600, 100);
    updatePlayerPosition(r, c);
    gameMessage.textContent =
      "Game Started! Follow the path to the green square.";
  }
});

gameBoard.addEventListener("mousemove", (e) => {
  if (!gameStarted) return;

  const hoveredCell = e.target.closest(".grid-cell");
  if (!hoveredCell) return;

  const r = parseInt(hoveredCell.dataset.row);
  const c = parseInt(hoveredCell.dataset.col);

  if (r === playerPos.r && c === playerPos.c) return;

  const dr = Math.abs(r - playerPos.r);
  const dc = Math.abs(c - playerPos.c);

  if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
    updatePlayerPosition(r, c);
  } else if (dr === 0 && dc === 0) {
  } else {
    currentLives = 0;
    beep(150, 300, "sawtooth");
    applyFlashEffect();
    updateHUD();
    gameOver();
  }
});

gameBoard.addEventListener("mouseleave", () => {
  if (gameStarted) {
    currentLives = 0;
    beep(150, 300, "sawtooth");
    applyFlashEffect();
    updateHUD();
    gameOver();
  }
});

resetButton.addEventListener("click", resetGame);

muteButton.addEventListener("click", () => {
  muted = !muted;
  muteButton.textContent = muted ? "Unmute" : "Mute";
  muteButton.classList.toggle("muted", muted);
});

startGame();
