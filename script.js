const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake, velocityX, velocityY, food, score, highScore, level, speed, lives;
let obstacles = [];
let gameRunning = false;
let gameInterval;

// Load high score
highScore = localStorage.getItem("snakeHigh") || 0;
document.getElementById("highScore").innerText = "High Score: " + highScore;

// Start button
startBtn.addEventListener("click", startGame);

function startGame() {
  startScreen.style.display = "none";

  snake = [{ x: 10, y: 10 }];
  velocityX = 0; // don't move until input
  velocityY = 0;
  food = randomFood();
  score = 0;
  level = 1;
  speed = 120;
  lives = 3;
  obstacles = generateObstacles(3);

  gameRunning = true;
  updateInfo();

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speed);
}

function gameLoop() {
  update();
  draw();
}

function randomFood() {
  return { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
}

function generateObstacles(count) {
  let obs = [];
  for (let i = 0; i < count; i++) {
    obs.push(randomFood());
  }
  return obs;
}

function resetAfterLifeLost() {
  snake = [{ x: 10, y: 10 }];
  velocityX = 0;
  velocityY = 0;
  score = 0;
  level = 1;
  speed = 120;
  obstacles = generateObstacles(3);
  updateInfo();

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speed);
}

function update() {
  if (!gameRunning) return;

  // ⚡ Fix: don't move or check collisions until player moves
  if (velocityX === 0 && velocityY === 0) return;

  const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

  // Collision checks
  if (head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount) return lifeLost();
  for (let part of snake) if (part.x === head.x && part.y === head.y) return lifeLost();
  for (let obs of obstacles) if (obs.x === head.x && obs.y === head.y) return lifeLost();

  snake.unshift(head);

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    if (score % 5 === 0) {
      level++;
      speed = Math.max(50, speed - 10);
      clearInterval(gameInterval);
      gameInterval = setInterval(gameLoop, speed);
      obstacles.push(randomFood());
    }
    food = randomFood();
  } else {
    snake.pop();
  }

  updateInfo();
}

function lifeLost() {
  lives--;
  if (lives <= 0) {
    gameRunning = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHigh", highScore);
      alert("New High Score!");
    } else {
      alert("Game Over!");
    }
    startScreen.style.display = "block";
    startBtn.innerText = "Restart Game";
  } else {
    alert(`Life lost! Remaining lives: ${lives}`);
    resetAfterLifeLost();
  }
}

function updateInfo() {
  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("level").innerText = "Level: " + level;
  document.getElementById("lives").innerText = "Lives: " + lives;
  document.getElementById("highScore").innerText = "High Score: " + highScore;
}

// Draw cube (3D look)
function drawCube(x, y, size, color) {
  // Base
  ctx.fillStyle = color.base;
  ctx.fillRect(x, y, size, size);

  // Top face
  ctx.fillStyle = color.top;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size - 5, y - 5);
  ctx.lineTo(x - 5, y - 5);
  ctx.closePath();
  ctx.fill();

  // Side face
  ctx.fillStyle = color.side;
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size - 5, y + size - 5);
  ctx.lineTo(x + size - 5, y - 5);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Snake
  snake.forEach((part, index) => {
    const x = part.x * gridSize;
    const y = part.y * gridSize;
    drawCube(x, y, gridSize - 2, { base: "lime", top: "lightgreen", side: "green" });

    if (index === 0) {
      ctx.fillStyle = "white";
      let eyeX = x + 5;
      let eyeY = y + 5;
      if (velocityX === 1) eyeX += 5;
      if (velocityY === 1) eyeY += 5;
      ctx.fillRect(eyeX, eyeY, 4, 4);
      ctx.fillRect(eyeX + 6, eyeY, 4, 4);
    }
  });

  // Fruit
  const fx = food.x * gridSize;
  const fy = food.y * gridSize;
  const gradient = ctx.createRadialGradient(fx + gridSize / 2, fy + gridSize / 2, 2, fx + gridSize / 2, fy + gridSize / 2, gridSize / 2);
  gradient.addColorStop(0, "yellow");
  gradient.addColorStop(1, "orange");
  ctx.fillStyle = gradient;
  ctx.fillRect(fx + 2, fy + 2, gridSize - 4, gridSize - 4);

  // Obstacles
  obstacles.forEach(o => {
    const ox = o.x * gridSize;
    const oy = o.y * gridSize;
    drawCube(ox, oy, gridSize - 2, { base: "gray", top: "lightgray", side: "darkgray" });
  });
}

// Keyboard
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" && velocityY !== 1) setDirection(0, -1);
  if (e.key === "ArrowDown" && velocityY !== -1) setDirection(0, 1);
  if (e.key === "ArrowLeft" && velocityX !== 1) setDirection(-1, 0);
  if (e.key === "ArrowRight" && velocityX !== -1) setDirection(1, 0);
});

// Mobile buttons
function setDirection(x, y) {
  if (x === 1 && velocityX === -1) return;
  if (x === -1 && velocityX === 1) return;
  if (y === 1 && velocityY === -1) return;
  if (y === -1 && velocityY === 1) return;
  velocityX = x;
  velocityY = y;
}
// Detect if the user is on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Create audio objects
let eatSound, lifeLostSound, gameOverSound;
if (!isMobile) {
    eatSound = new Audio("sounds/eat.mp3");
    lifeLostSound = new Audio("sounds/lifeLost.mp3");
    gameOverSound = new Audio("sounds/gameOver.mp3");
}

// Example: play sound only on desktop
if (!isMobile) eatSound.play();