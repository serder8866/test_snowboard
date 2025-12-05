// Simple HTML5 canvas dodge game inspired by an Asteroids-like flow.
// The game starts on the first key press to keep the title overlay visible initially.

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const titleOverlay = document.getElementById("titleOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const lessonButton = document.getElementById("lessonButton");

// Player sprite
const playerImage = new Image();
playerImage.src = "snowboard.png";
const rockImage = new Image();
rockImage.src = "rock.png";

const player = {
  x: 0,
  y: 0,
  radius: 24, // collision circle radius
  speed: 260, // units per second
  imageLoaded: false,
};

const rockState = {
  imageLoaded: false,
};

playerImage.onload = () => {
  player.imageLoaded = true;
};

rockImage.onload = () => {
  rockState.imageLoaded = true;
};

// Input state (both arrow keys and WASD are supported)
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  KeyA: false,
  KeyD: false,
  KeyW: false,
  KeyS: false,
};

let rocks = [];
let lastTime = 0;
let lastSpawn = 0;
let spawnInterval = 900; // ms between spawns
const minSpawnInterval = 420;
let difficultyTimer = 0;

let gameStarted = false;
let gameRunning = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Keep player within bounds after resize
  clampPlayerPosition();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function resetGame() {
  rocks = [];
  spawnInterval = 900;
  difficultyTimer = 0;
  player.x = canvas.width * 0.5;
  player.y = canvas.height * 0.75;
  gameRunning = true;
  gameOverOverlay.classList.add("hidden");
  lastTime = 0;
  lastSpawn = 0;
}

function startGameOnFirstInput() {
  if (!gameStarted) {
    gameStarted = true;
    titleOverlay.classList.add("hidden");
    resetGame();
  }
}

// Input handling
window.addEventListener("keydown", (e) => {
  if (e.code in keys) {
    keys[e.code] = true;
    startGameOnFirstInput();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code in keys) {
    keys[e.code] = false;
  }
});

// Navigation to the instructor page from the overlay button
lessonButton.addEventListener("click", () => {
  window.location.href = "instructor.html";
});

function updateGame(delta, timestamp) {
  // Movement is normalized so diagonal speed stays consistent
  const moveX = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  const moveY = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY) || 1;
    player.x += (moveX / length) * player.speed * delta;
    player.y += (moveY / length) * player.speed * delta;
  }

  // Clamp player inside the canvas
  clampPlayerPosition();

  // Difficulty scaling over time: gradually tighten spawn interval
  difficultyTimer += delta;
  if (difficultyTimer > 5 && spawnInterval > minSpawnInterval) {
    spawnInterval = Math.max(minSpawnInterval, spawnInterval - delta * 60);
  }

  // Rock spawning from the top edge
  if (timestamp - lastSpawn >= spawnInterval) {
    spawnRock();
    lastSpawn = timestamp;
  }

  // Update rocks and remove those that leave the screen
  for (let i = rocks.length - 1; i >= 0; i -= 1) {
    const rock = rocks[i];
    rock.y += rock.speed * delta;
    if (rock.y - rock.radius > canvas.height) {
      rocks.splice(i, 1);
      continue;
    }
    if (checkCollision(player, rock)) {
      triggerGameOver();
      break;
    }
  }
}

function spawnRock() {
  const radius = randomInRange(14, 34);
  const speed = randomInRange(120, 230);
  const x = randomInRange(radius, canvas.width - radius);
  rocks.push({ x, y: -radius, radius, speed });
}

function checkCollision(circleA, circleB) {
  // Simple circle-circle collision for player vs rock
  const dx = circleA.x - circleB.x;
  const dy = circleA.y - circleB.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = circleA.radius + circleB.radius;
  return distSq < radiusSum * radiusSum;
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRocks();
  drawPlayer();
}

function drawPlayer() {
  // Collision circle for visualization
  ctx.save();
  ctx.fillStyle = "rgba(77, 226, 255, 0.2)";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw the snowboarder sprite centered on the circle
  const size = player.radius * 2.3;
  if (player.imageLoaded) {
    ctx.drawImage(playerImage, player.x - size / 2, player.y - size / 2, size, size);
  } else {
    ctx.fillStyle = "#4de2ff";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRocks() {
  ctx.save();
  rocks.forEach((rock) => {
    // Draw collision circle tint for clarity
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw sprite centered on the collision circle
    const size = rock.radius * 2.2;
    if (rockState.imageLoaded) {
      ctx.drawImage(rockImage, rock.x - size / 2, rock.y - size / 2, size, size);
    } else {
      const gradient = ctx.createRadialGradient(
        rock.x - rock.radius * 0.3,
        rock.y - rock.radius * 0.3,
        rock.radius * 0.2,
        rock.x,
        rock.y,
        rock.radius
      );
      gradient.addColorStop(0, "#607a8f");
      gradient.addColorStop(1, "#2b3949");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function triggerGameOver() {
  gameRunning = false;
  gameOverOverlay.classList.remove("hidden");
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clampPlayerPosition() {
  player.x = Math.min(Math.max(player.radius, player.x), canvas.width - player.radius);
  player.y = Math.min(Math.max(player.radius, player.y), canvas.height - player.radius);
}

function gameLoop(timestamp) {
  if (!gameStarted) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!lastTime) {
    lastTime = timestamp;
  }

  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (gameRunning) {
    updateGame(delta, timestamp);
  }
  drawGame();

  requestAnimationFrame(gameLoop);
}

// Kick off the render loop immediately; gameplay begins on the first key press
requestAnimationFrame(gameLoop);
