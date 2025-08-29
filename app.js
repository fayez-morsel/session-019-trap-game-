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
