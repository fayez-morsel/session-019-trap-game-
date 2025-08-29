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
