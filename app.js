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

let level = 1,
  lives = 3,
  muted = false,
  gameStarted = false;
let currentPos = { r: -1, c: -1 };
let flashTimer = 0,
  goalPulse = 0;
let levels = [];

// ---------------- AUDIO ----------------
let audioCtx, bgMusic;
const bgTracks = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
];

function beep(freq, dur = 200) {
  if (muted) return;
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  let osc = audioCtx.createOscillator(),
    gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur / 1000);
}

function startBackgroundMusic() {
  if (muted) return;
  if (!bgMusic) {
    let track = bgTracks[Math.floor(Math.random() * bgTracks.length)];
    bgMusic = new Audio(track);
    bgMusic.loop = true;
    bgMusic.volume = 0.2;
    bgMusic.play();
  } else {
    bgMusic.play();
  }
}

function toggleMusic() {
  if (!bgMusic) return;
  muted ? bgMusic.pause() : bgMusic.play();
}

// ---------------- LEVEL GEN ----------------
function gridSizeForLevel(lv) {
  return 10 + Math.floor((lv - 1) / 3);
}

function makeLevel(lv) {
  const size = gridSizeForLevel(lv);
  const g = Array.from({ length: size }, () => Array(size).fill(0));
  let r = 0,
    c = 0;
  g[0][0] = 2; // start
  while (r !== size - 1 || c !== size - 1) {
    let moves = [];
    if (r < size - 1) moves.push([1, 0]);
    if (c < size - 1) moves.push([0, 1]);
    if (r > 0 && Math.random() < 0.3) moves.push([-1, 0]);
    if (c > 0 && Math.random() < 0.3) moves.push([0, -1]);
    let [dr, dc] = moves[Math.floor(Math.random() * moves.length)];
    r += dr;
    c += dc;
    g[r][c] = 1;
  }
  g[size - 1][size - 1] = 3; // goal
  return g;
}

function newGame() {
  levels = [];
  for (let i = 1; i <= 20; i++) levels.push(makeLevel(i));
  level = 1;
  lives = 3;
  gameStarted = false;
  currentPos = { r: -1, c: -1 };
  updateHUD();
  startBackgroundMusic();
  draw();
}

// ---------------- DRAW ----------------
function draw() {
  let map = levels[level - 1],
    size = map.length,
    cell = canvas.width / size;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (map[r][c] === 0) ctx.fillStyle = "#444";
      if (map[r][c] === 1) ctx.fillStyle = "#00BFFF";
      if (map[r][c] === 2) ctx.fillStyle = "red"; // start
      if (map[r][c] === 3) {
        let pulse = Math.sin(goalPulse / 10) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,255,0,${pulse})`; // goal
      }
      ctx.fillRect(c * cell, r * cell, cell, cell);
      ctx.strokeStyle = "#222";
      ctx.strokeRect(c * cell, r * cell, cell, cell);
    }
  if (flashTimer > 0) {
    ctx.fillStyle = "rgba(255,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    flashTimer--;
  }
  goalPulse++;
  requestAnimationFrame(draw);
}

function getCell(x, y) {
  let map = levels[level - 1],
    size = map.length,
    cell = canvas.width / size;
  let c = Math.floor(x / cell),
    r = Math.floor(y / cell);
  return r < 0 || c < 0 || r >= size || c >= size ? { r: -1, c: -1 } : { r, c };
}

// ---------------- GAME LOGIC ----------------
function updateHUD() {
  livesText.textContent = "Lives: " + "❤️".repeat(lives);
  levelText.textContent = "Level: " + level;
  statusText.textContent = `Level ${level} - Lives: ${lives}`;
}

function resetPos() {
  currentPos = { r: -1, c: -1 };
}

function nextLevel() {
  beep(1000);
  gameStarted = false;
  resetPos();
  overlay.style.display = "flex";
  overlayText.textContent = `Level ${level} Complete!`;
  overlayBtn.textContent = "Next Level";
  overlayBtn.style.background = "green";
  overlayBtn.onclick = () => {
    overlay.style.display = "none";
    level++;
    updateHUD();
  };
}

function gameOver() {
  gameStarted = false;
  resetPos();
  overlay.style.display = "flex";
  overlayText.textContent = "Game Over!";
  overlayBtn.textContent = "Restart";
  overlayBtn.style.background = "red";
  overlayBtn.onclick = () => {
    overlay.style.display = "none";
    newGame();
  };
}

// ---------------- EVENTS ----------------
canvas.addEventListener("click", (e) => {
  let { r, c } = getCell(e.offsetX, e.offsetY);
  if (r !== -1 && levels[level - 1][r][c] === 2) {
    gameStarted = true;
    beep(600);
    updateHUD();
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!gameStarted) return;
  let { r, c } = getCell(e.offsetX, e.offsetY);
  if (r === -1 || (r === currentPos.r && c === currentPos.c)) return;
  currentPos = { r, c };
  let cell = levels[level - 1][r][c];
  if (cell === 0) {
    lives--;
    flashTimer = 10;
    beep(200);
    updateHUD();
    if (lives <= 0) gameOver();
  }
  if (cell === 3) nextLevel();
});

canvas.addEventListener("mouseleave", () => {
  if (gameStarted) {
    lives = 0;
    updateHUD();
    gameOver();
  }
});

// ---------------- BUTTONS ----------------
resetBtn.style.display = "inline-block";
resetBtn.style.background = "red";
resetBtn.style.borderRadius = "5px";
resetBtn.onclick = () => newGame();

muteBtn.style.display = "inline-block";
muteBtn.style.background = "green";
muteBtn.style.borderRadius = "5px";
muteBtn.onclick = () => {
  muted = !muted;
  toggleMusic();
  muteBtn.textContent = muted ? "Unmute" : "Mute";
};

overlayBtn.style.borderRadius = "5px";
overlayBtn.style.display = "inline-block";
overlayBtn.style.padding = "10px 20px";
overlayBtn.style.color = "#fff";

// ---------------- START ----------------
newGame();
draw();
