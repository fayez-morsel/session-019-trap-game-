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
