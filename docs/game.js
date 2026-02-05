const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const onlineCountEl = document.getElementById("online-count");
const botCountEl = document.getElementById("bot-count");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const healthEl = document.getElementById("health");
const ammoEl = document.getElementById("ammo");
const statusEl = document.getElementById("status");
const onlineInput = document.getElementById("online-input");
const applyOnlineBtn = document.getElementById("apply-online");
const toggleBtn = document.getElementById("toggle-game");
const resetBtn = document.getElementById("reset-game");

const world = {
  width: 1800,
  height: 1000,
};

const state = {
  player: {
    x: 0,
    y: 0,
    radius: 16,
    speed: 2.6,
    color: "#37f5a5",
    health: 100,
    maxHealth: 100,
    ammo: 12,
    maxAmmo: 12,
    reloadTime: 1200,
    reloadRemaining: 0,
    fireCooldown: 0,
  },
  bots: [],
  bullets: [],
  keys: new Set(),
  mouse: { x: 0, y: 0, down: false },
  score: 0,
  wave: 1,
  onlinePlayers: 0,
  running: false,
  gameOver: false,
};

const obstacles = [
  { x: 220, y: 180, width: 180, height: 220 },
  { x: 680, y: 120, width: 260, height: 120 },
  { x: 1100, y: 240, width: 240, height: 200 },
  { x: 420, y: 620, width: 220, height: 200 },
  { x: 960, y: 680, width: 320, height: 160 },
];

function resize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function resetGame() {
  state.player.x = world.width / 2;
  state.player.y = world.height / 2;
  state.player.health = state.player.maxHealth;
  state.player.ammo = state.player.maxAmmo;
  state.player.reloadRemaining = 0;
  state.player.fireCooldown = 0;
  state.bullets = [];
  state.score = 0;
  state.wave = 1;
  state.gameOver = false;
  spawnBotsIfNeeded();
  updateHUD();
  updateStatus();
}

function updateStatus() {
  if (state.gameOver) {
    statusEl.textContent = "Game over! Press Reset to try again.";
    return;
  }
  if (!state.running) {
    statusEl.textContent = "Waiting to start...";
    return;
  }
  statusEl.textContent = state.onlinePlayers > 0
    ? "Online players detected. Bots paused."
    : `Wave ${state.wave} in progress.`;
}

function spawnBotsIfNeeded() {
  state.bots = [];
  if (state.onlinePlayers > 0) {
    botCountEl.textContent = "0";
    return;
  }

  const botTotal = 5 + state.wave * 2;
  for (let i = 0; i < botTotal; i += 1) {
    state.bots.push({
      x: 200 + Math.random() * (world.width - 400),
      y: 140 + Math.random() * (world.height - 280),
      radius: 14,
      speed: 1.4 + Math.random() * 0.9,
      color: "#ffb347",
      angle: Math.random() * Math.PI * 2,
      health: 40 + state.wave * 6,
      damageCooldown: 0,
    });
  }
  botCountEl.textContent = String(botTotal);
}

function updateOnlinePlayers(value) {
  state.onlinePlayers = Math.max(0, Number(value) || 0);
  onlineCountEl.textContent = String(state.onlinePlayers);
  spawnBotsIfNeeded();
  updateStatus();
}

function clampToWorld(entity) {
  entity.x = Math.max(entity.radius, Math.min(world.width - entity.radius, entity.x));
  entity.y = Math.max(entity.radius, Math.min(world.height - entity.radius, entity.y));
}

function intersectsObstacle(x, y, radius) {
  return obstacles.some((obstacle) => {
    const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));
    const dx = x - closestX;
    const dy = y - closestY;
    return dx * dx + dy * dy < radius * radius;
  });
}

function resolveObstacleCollision(entity) {
  for (const obstacle of obstacles) {
    const closestX = Math.max(obstacle.x, Math.min(entity.x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(entity.y, obstacle.y + obstacle.height));
    const dx = entity.x - closestX;
    const dy = entity.y - closestY;
    if (dx * dx + dy * dy < entity.radius * entity.radius) {
      if (Math.abs(dx) > Math.abs(dy)) {
        entity.x = dx > 0 ? obstacle.x + obstacle.width + entity.radius : obstacle.x - entity.radius;
      } else {
        entity.y = dy > 0 ? obstacle.y + obstacle.height + entity.radius : obstacle.y - entity.radius;
      }
    }
  }
}

function updatePlayer(delta) {
  const { player, keys } = state;
  let dx = 0;
  let dy = 0;
  if (keys.has("w")) dy -= 1;
  if (keys.has("s")) dy += 1;
  if (keys.has("a")) dx -= 1;
  if (keys.has("d")) dx += 1;

  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    player.x += (dx / length) * player.speed;
    player.y += (dy / length) * player.speed;
  }
  clampToWorld(player);
  resolveObstacleCollision(player);

  if (player.fireCooldown > 0) {
    player.fireCooldown = Math.max(0, player.fireCooldown - delta);
  }

  if (player.reloadRemaining > 0) {
    player.reloadRemaining = Math.max(0, player.reloadRemaining - delta);
    if (player.reloadRemaining === 0) {
      player.ammo = player.maxAmmo;
    }
  }
}

function updateBots(delta) {
  for (const bot of state.bots) {
    if (bot.damageCooldown > 0) {
      bot.damageCooldown = Math.max(0, bot.damageCooldown - delta);
    }
    const targetDx = state.player.x - bot.x;
    const targetDy = state.player.y - bot.y;
    const targetDistance = Math.hypot(targetDx, targetDy);
    const chase = targetDistance < 260;

    if (chase && targetDistance > 1) {
      bot.x += (targetDx / targetDistance) * bot.speed;
      bot.y += (targetDy / targetDistance) * bot.speed;
    } else {
      bot.angle += (Math.random() - 0.5) * 0.2;
      bot.x += Math.cos(bot.angle) * bot.speed * 0.6;
      bot.y += Math.sin(bot.angle) * bot.speed * 0.6;
    }

    clampToWorld(bot);
    resolveObstacleCollision(bot);

    if (targetDistance < bot.radius + state.player.radius + 4 && bot.damageCooldown === 0) {
      state.player.health = Math.max(0, state.player.health - 12);
      bot.damageCooldown = 600;
      if (state.player.health === 0) {
        state.gameOver = true;
        state.running = false;
        toggleBtn.textContent = "Start";
        updateStatus();
      }
    }
  }
}

function fireBullet() {
  const { player } = state;
  if (state.gameOver || !state.running) return;
  if (player.reloadRemaining > 0 || player.fireCooldown > 0) return;
  if (player.ammo <= 0) {
    player.reloadRemaining = player.reloadTime;
    return;
  }

  const worldTarget = screenToWorld(state.mouse.x, state.mouse.y);
  const dx = worldTarget.x - player.x;
  const dy = worldTarget.y - player.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 8.5;

  state.bullets.push({
    x: player.x + (dx / distance) * (player.radius + 4),
    y: player.y + (dy / distance) * (player.radius + 4),
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
    radius: 4,
    life: 1200,
  });
  player.ammo -= 1;
  player.fireCooldown = 140;
}

function updateBullets(delta) {
  state.bullets = state.bullets.filter((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.life -= delta;
    return (
      bullet.life > 0 &&
      bullet.x > 0 &&
      bullet.x < world.width &&
      bullet.y > 0 &&
      bullet.y < world.height &&
      !intersectsObstacle(bullet.x, bullet.y, bullet.radius)
    );
  });
}

function handleBulletHits() {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    for (let j = state.bots.length - 1; j >= 0; j -= 1) {
      const bot = state.bots[j];
      const dx = bullet.x - bot.x;
      const dy = bullet.y - bot.y;
      if (dx * dx + dy * dy < (bullet.radius + bot.radius) ** 2) {
        bot.health -= 25;
        state.bullets.splice(i, 1);
        if (bot.health <= 0) {
          state.bots.splice(j, 1);
          state.score += 100;
        }
        break;
      }
    }
  }

  if (state.bots.length === 0 && state.onlinePlayers === 0 && state.running) {
    state.wave += 1;
    spawnBotsIfNeeded();
  }
}

function screenToWorld(screenX, screenY) {
  const offsetX = canvas.width / devicePixelRatio / 2 - state.player.x;
  const offsetY = canvas.height / devicePixelRatio / 2 - state.player.y;
  return {
    x: screenX - offsetX,
    y: screenY - offsetY,
  };
}

function drawArena() {
  ctx.fillStyle = "#0c0f14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const offsetX = canvas.width / devicePixelRatio / 2 - state.player.x;
  const offsetY = canvas.height / devicePixelRatio / 2 - state.player.y;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  ctx.fillStyle = "#111824";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, world.width, world.height);

  ctx.fillStyle = "#1c2433";
  for (const obstacle of obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }

  drawEntity(state.player, "You");
  state.bots.forEach((bot, index) => drawEntity(bot, `Bot ${index + 1}`));

  ctx.fillStyle = "#67b7ff";
  for (const bullet of state.bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEntity(entity, label) {
  ctx.beginPath();
  ctx.fillStyle = entity.color;
  ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, entity.x, entity.y - entity.radius - 8);
}

function updateHUD() {
  scoreEl.textContent = String(state.score);
  waveEl.textContent = String(state.wave);
  healthEl.textContent = String(state.player.health);
  ammoEl.textContent = state.player.reloadRemaining > 0
    ? "Reloading"
    : String(state.player.ammo);
  botCountEl.textContent = String(state.bots.length);
}

let lastFrame = performance.now();
function loop(now) {
  const delta = Math.min(32, now - lastFrame);
  lastFrame = now;

  if (state.running && !state.gameOver) {
    updatePlayer(delta);
    if (state.mouse.down) {
      fireBullet();
    }
    if (state.onlinePlayers === 0) {
      updateBots(delta);
      updateBullets(delta);
      handleBulletHits();
    }
  }

  drawArena();
  updateHUD();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === " " && event.target === document.body) {
    if (!state.gameOver) {
      state.running = !state.running;
      toggleBtn.textContent = state.running ? "Pause" : "Start";
      updateStatus();
    }
    event.preventDefault();
    return;
  }
  state.keys.add(key);
  if (key === "r" && state.player.reloadRemaining === 0) {
    state.player.reloadRemaining = state.player.reloadTime;
  }
});
window.addEventListener("keyup", (event) => {
  state.keys.delete(event.key.toLowerCase());
});
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = event.clientX - rect.left;
  state.mouse.y = event.clientY - rect.top;
});
canvas.addEventListener("mousedown", () => {
  state.mouse.down = true;
  fireBullet();
});
canvas.addEventListener("mouseup", () => {
  state.mouse.down = false;
});

applyOnlineBtn.addEventListener("click", () => updateOnlinePlayers(onlineInput.value));
toggleBtn.addEventListener("click", () => {
  if (state.gameOver) return;
  state.running = !state.running;
  toggleBtn.textContent = state.running ? "Pause" : "Start";
  updateStatus();
});
resetBtn.addEventListener("click", () => {
  state.running = false;
  toggleBtn.textContent = "Start";
  resetGame();
});

resize();
resetGame();
updateOnlinePlayers(onlineInput.value);
requestAnimationFrame(loop);
