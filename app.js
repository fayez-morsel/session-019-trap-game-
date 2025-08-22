const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");
const livesText = document.getElementById("lives");
const levelText = document.getElementById("level");
const resetBtn = document.getElementById("reset");
const muteBtn = document.getElementById("mute");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const overlayBtn = document.getElementById("overlay-btn");

const gridSize = 10;
const cellSize = canvas.width / gridSize;

let gameStarted = false;
let lives = 3;
let level = 1;
let muted = false;
let flashTimer = 0;
let goalPulse = 0;
let currentPos = { r: -1, c: -1 };

// WebAudio for simple sounds
let audioCtx;
function initAudio() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioCtx();
  }
}
function playBeep(freq, duration = 200) {
  if (muted || !audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}

// Levels
const levels = [
  // Level 1
  [
    [2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 3],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Level 2
  [
    [2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 1, 3],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Level 3
  [
    [2, 1, 1, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    [0, 0, 1, 1, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 1, 0, 3],
    [0, 0, 0, 1, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Level 4
  [
    [2, 1, 1, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 0, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0, 0, 1, 3],
    [0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Level 5
  [
    [2, 1, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 1, 3],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Level 6
  [
    [2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 1, 1, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  ],
  // Level 7
  [
    [2, 0, 1, 0, 1, 0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    [1, 1, 1, 0, 1, 1, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 3],
  ],
  // Level 8
  [
    [2, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [1, 1, 0, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 1, 1, 0],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  ],
  // Level 9
  [
    [2, 0, 0, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 1, 0, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 1, 0, 1, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
    [1, 1, 0, 1, 0, 0, 1, 0, 1, 1],
    [0, 0, 0, 0, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
  ],
  // Level 10
  [
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 3, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let map = levels[level - 1];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (map[r][c] === 0) ctx.fillStyle = "#444";
      if (map[r][c] === 1) ctx.fillStyle = "#00BFFF";
      if (map[r][c] === 2) ctx.fillStyle = "red";
      if (map[r][c] === 3) {
        let pulse = Math.sin(goalPulse / 10) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,255,0,${pulse})`;
      }
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      ctx.strokeStyle = "#222";
      ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }
  if (flashTimer > 0) {
    ctx.fillStyle = "rgba(255,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    flashTimer--;
  }
  goalPulse++;
  requestAnimationFrame(drawBoard);
}

function getCell(mouseX, mouseY) {
  let c = Math.floor(mouseX / cellSize);
  let r = Math.floor(mouseY / cellSize);
  if (r < 0 || c < 0 || r >= gridSize || c >= gridSize) return { r: -1, c: -1 };
  return { r, c };
}

function updateHUD() {
  livesText.textContent = `Lives: ${"❤️".repeat(lives)}`;
  levelText.textContent = `Level: ${level}`;
  statusText.textContent = `Level ${level} - Lives: ${lives}`;
}

function resetPosition() {
  currentPos = { r: -1, c: -1 };
}

function levelComplete() {
  playBeep(1000);
  gameStarted = false;
  resetPosition();
  overlay.style.visibility = "visible";

  if (level < levels.length) {
    overlayText.textContent = `Level ${level} Complete!`;
    overlayBtn.textContent = "Next Level";
    overlayBtn.onclick = () => {
      overlay.style.visibility = "hidden";
      level++;
      updateHUD();
      resetPosition();
    };
  } else {
    overlayText.textContent = `🎉 Congratulations! You finished all levels! 🎉`;
    overlayBtn.textContent = "New Game";
    overlayBtn.onclick = () => {
      overlay.style.visibility = "hidden";
      level = 1;
      lives = 3;
      gameStarted = false;
      updateHUD();
      resetPosition();
    };
  }
}

function gameOver() {
  gameStarted = false;
  resetPosition();
  overlay.style.visibility = "visible";
  overlayText.textContent = `Game Over!`;
  overlayBtn.textContent = "Restart";
  overlayBtn.onclick = () => {
    overlay.style.visibility = "hidden";
    level = 1;
    lives = 3;
    gameStarted = false;
    updateHUD();
    resetPosition();
  };
}

canvas.addEventListener("click", (e) => {
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let { r, c } = getCell(x, y);
  if (r === -1) return;
  if (levels[level - 1][r][c] === 2) {
    gameStarted = true;
    initAudio();
    statusText.textContent = `Level ${level} - Lives: ${lives}`;
    playBeep(600);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!gameStarted) return;
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  let { r, c } = getCell(x, y);
  if (r === -1) return;

  if (currentPos.r === r && currentPos.c === c) return;
  currentPos = { r, c };

  let cell = levels[level - 1][r][c];
  if (cell === 0) {
    lives--;
    flashTimer = 10;
    playBeep(200);
    if (lives < 0) lives = 0;
    updateHUD();
    if (lives <= 0) gameOver();
  }
  if (cell === 3) levelComplete();
});

canvas.addEventListener("mouseleave", () => {
  if (!gameStarted) return;
  lives = 0;
  flashTimer = 10;
  playBeep(200);
  updateHUD();
  gameOver();
});

resetBtn.onclick = () => {
  level = 1;
  lives = 3;
  gameStarted = false;
  updateHUD();
  resetPosition();
};
muteBtn.onclick = () => {
  muted = !muted;
  muteBtn.textContent = muted ? "Unmute" : "Mute";
};

updateHUD();
drawBoard();
