(() => {
  const board = document.getElementById('snake-board');
  const ctx = board?.getContext('2d');
  if (!board || !ctx) return;

  const scoreP1El = document.querySelector('[data-score-p1]');
  const scoreP2El = document.querySelector('[data-score-p2]');
  const bestEl = document.querySelector('[data-best]');
  const statusEl = document.querySelector('[data-status]');
  const actionButtons = document.querySelectorAll('[data-action]');
  const dirButtons = document.querySelectorAll('[data-dir]');
  const playerButtons = document.querySelectorAll('[data-player]');

  const grid = 20;
  const cells = board.width / grid;
  const storageKey = 'loop-engineering-snake-best';
  const palette = {
    background: '#050505',
    grid: 'rgba(255,255,255,0.06)',
    food: '#ffffff',
    foodGlow: 'rgba(84,66,219,0.45)',
    p1Head: '#5442db',
    p1Body: '#f2f2f2',
    p2Head: '#d8d8d8',
    p2Body: '#8f8f8f',
    text: '#f5f5f5',
  };

  const state = {
    players: {
      p1: { name: 'P1', score: 0, alive: true, snake: [], direction: { x: 1, y: 0 }, nextDirection: { x: 1, y: 0 } },
      p2: { name: 'P2', score: 0, alive: true, snake: [], direction: { x: -1, y: 0 }, nextDirection: { x: -1, y: 0 } },
    },
    food: { x: 10, y: 10 },
    best: Number(window.localStorage.getItem(storageKey) || 0),
    running: false,
    paused: false,
    gameOver: false,
    loopId: null,
    lastTick: 0,
    speed: 110,
    winnerText: 'Ready',
    mobilePlayer: 'p1',
  };

  function updateHud(text) {
    if (scoreP1El) scoreP1El.textContent = String(state.players.p1.score);
    if (scoreP2El) scoreP2El.textContent = String(state.players.p2.score);
    if (bestEl) bestEl.textContent = String(state.best);
    if (statusEl) statusEl.textContent = text;
    playerButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.player === state.mobilePlayer.replace('p', '')));
    });
  }

  function randomCell() {
    return Math.floor(Math.random() * cells);
  }

  function placeFood() {
    let food = { x: randomCell(), y: randomCell() };
    const occupied = state.players.p1.snake.concat(state.players.p2.snake);
    while (occupied.some((segment) => segment.x === food.x && segment.y === food.y)) {
      food = { x: randomCell(), y: randomCell() };
    }
    state.food = food;
  }

  function createSnake(startX, startY, bodyX, direction) {
    return [
      { x: startX, y: startY },
      { x: bodyX, y: startY },
      { x: bodyX - 1, y: startY },
    ].map((segment, index) => (index === 0 ? segment : { x: segment.x, y: segment.y }));
  }

  function resetGame() {
    state.players.p1.snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    state.players.p2.snake = [
      { x: 20, y: 18 },
      { x: 21, y: 18 },
      { x: 22, y: 18 },
    ];
    state.players.p1.direction = { x: 1, y: 0 };
    state.players.p1.nextDirection = { x: 1, y: 0 };
    state.players.p2.direction = { x: -1, y: 0 };
    state.players.p2.nextDirection = { x: -1, y: 0 };
    state.players.p1.score = 0;
    state.players.p2.score = 0;
    state.players.p1.alive = true;
    state.players.p2.alive = true;
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.loopId = null;
    state.lastTick = 0;
    state.winnerText = 'Ready';
    state.mobilePlayer = 'p1';
    placeFood();
    updateHud('Ready');
    draw();
  }

  function startGame() {
    if (state.gameOver) {
      resetGame();
    }
    if (state.running && !state.paused) return;
    state.running = true;
    state.paused = false;
    state.winnerText = 'Running';
    updateHud('Running');
    if (!state.loopId) {
      state.loopId = requestAnimationFrame(tick);
    }
  }

  function pauseGame() {
    if (!state.running || state.gameOver) return;
    state.paused = !state.paused;
    state.winnerText = state.paused ? 'Paused' : 'Running';
    updateHud(state.paused ? 'Paused' : 'Running');
    if (!state.paused && !state.loopId) {
      state.loopId = requestAnimationFrame(tick);
    }
  }

  function endGame(message) {
    state.running = false;
    state.paused = false;
    state.gameOver = true;
    state.loopId = null;
    state.winnerText = message;
    updateHud(message);
  }

  function setDirection(playerKey, dx, dy) {
    const player = state.players[playerKey];
    if (!player || !player.alive) return;
    const reference = player.nextDirection;
    const opposite = reference.x === -dx && reference.y === -dy;
    if (opposite) return;
    if (reference.x === dx && reference.y === dy) return;
    player.nextDirection = { x: dx, y: dy };
  }

  function snakeToOccupancy(snake, eat) {
    return snake.slice(0, eat ? snake.length : snake.length - 1);
  }

  function nextHead(player) {
    const head = player.snake[0];
    return {
      x: head.x + player.nextDirection.x,
      y: head.y + player.nextDirection.y,
    };
  }

  function collidesWithSnake(point, snake) {
    return snake.some((segment) => segment.x === point.x && segment.y === point.y);
  }

  function moveRound() {
    const p1 = state.players.p1;
    const p2 = state.players.p2;
    const p1Next = nextHead(p1);
    const p2Next = nextHead(p2);
    const p1Ate = p1Next.x === state.food.x && p1Next.y === state.food.y;
    const p2Ate = p2Next.x === state.food.x && p2Next.y === state.food.y;
    const p1Body = snakeToOccupancy(p1.snake, p1Ate);
    const p2Body = snakeToOccupancy(p2.snake, p2Ate);
    const sameCell = p1Next.x === p2Next.x && p1Next.y === p2Next.y;
    const swapCells =
      p1Next.x === p2.snake[0].x &&
      p1Next.y === p2.snake[0].y &&
      p2Next.x === p1.snake[0].x &&
      p2Next.y === p1.snake[0].y;

    const p1Wall = p1Next.x < 0 || p1Next.x >= cells || p1Next.y < 0 || p1Next.y >= cells;
    const p2Wall = p2Next.x < 0 || p2Next.x >= cells || p2Next.y < 0 || p2Next.y >= cells;
    const p1HitsSelf = collidesWithSnake(p1Next, p1Body);
    const p2HitsSelf = collidesWithSnake(p2Next, p2Body);
    const p1HitsP2 = collidesWithSnake(p1Next, p2Body);
    const p2HitsP1 = collidesWithSnake(p2Next, p1Body);

    p1.direction = p1.nextDirection;
    p2.direction = p2.nextDirection;

    if (sameCell || swapCells) {
      endGame('Draw');
      draw();
      return;
    }

    if (p1Wall || p1HitsSelf || p1HitsP2) {
      p1.alive = false;
    }
    if (p2Wall || p2HitsSelf || p2HitsP1) {
      p2.alive = false;
    }

    if (!p1.alive || !p2.alive) {
      if (p1.alive && !p2.alive) {
        endGame('P1 Wins');
      } else if (!p1.alive && p2.alive) {
        endGame('P2 Wins');
      } else {
        endGame('Draw');
      }
      draw();
      return;
    }

    p1.snake.unshift(p1Next);
    p2.snake.unshift(p2Next);

    if (p1Ate) {
      p1.score += 10;
    } else {
      p1.snake.pop();
    }

    if (p2Ate) {
      p2.score += 10;
    } else {
      p2.snake.pop();
    }

    state.best = Math.max(state.best, p1.score, p2.score);
    window.localStorage.setItem(storageKey, String(state.best));
    if (p1Ate || p2Ate) {
      placeFood();
    }
    updateHud('Running');
  }

  function drawGrid() {
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, board.width, board.height);

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= cells; i += 1) {
      const pos = i * grid + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, board.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(board.width, pos);
      ctx.stroke();
    }
  }

  function drawFood() {
    const x = state.food.x * grid;
    const y = state.food.y * grid;
    ctx.save();
    ctx.fillStyle = palette.foodGlow;
    ctx.beginPath();
    ctx.arc(x + grid / 2, y + grid / 2, grid * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.food;
    ctx.fillRect(x + 4, y + 4, grid - 8, grid - 8);
    ctx.restore();
  }

  function drawSnake(snake, headColor, bodyColor) {
    snake.forEach((segment, index) => {
      const inset = index === 0 ? 1.5 : 3.5;
      const x = segment.x * grid + inset;
      const y = segment.y * grid + inset;
      const size = grid - inset * 2;
      ctx.fillStyle = index === 0 ? headColor : bodyColor;
      ctx.fillRect(x, y, size, size);
    });
  }

  function drawOverlay() {
    if (!state.running && !state.gameOver) {
      drawBanner('Press Start or Space');
    } else if (state.paused) {
      drawBanner('Paused');
    } else if (state.gameOver) {
      drawBanner(state.winnerText);
    }
  }

  function drawBanner(text) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, board.height / 2 - 52, board.width, 104);
    ctx.fillStyle = palette.text;
    ctx.font = '700 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, board.width / 2, board.height / 2 - 12);
    ctx.font = '400 16px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('P1: arrows/WASD  |  P2: IJKL', board.width / 2, board.height / 2 + 20);
    ctx.restore();
  }

  function draw() {
    drawGrid();
    drawFood();
    drawSnake(state.players.p1.snake, palette.p1Head, palette.p1Body);
    drawSnake(state.players.p2.snake, palette.p2Head, palette.p2Body);
    drawOverlay();
  }

  function tick(timestamp) {
    if (!state.loopId) return;
    if (!state.running || state.paused || state.gameOver) {
      state.loopId = null;
      draw();
      return;
    }
    if (!state.lastTick) state.lastTick = timestamp;
    const delta = timestamp - state.lastTick;
    if (delta >= state.speed) {
      state.lastTick = timestamp;
      moveRound();
      draw();
      if (!state.running || state.gameOver) {
        state.loopId = null;
        return;
      }
    }
    state.loopId = requestAnimationFrame(tick);
  }

  function handleAction(action) {
    if (action === 'start') startGame();
    if (action === 'pause') pauseGame();
    if (action === 'restart') {
      resetGame();
      startGame();
    }
  }

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'w'].includes(key)) {
      event.preventDefault();
      setDirection('p1', 0, -1);
      startGame();
    }
    if (['arrowdown', 's'].includes(key)) {
      event.preventDefault();
      setDirection('p1', 0, 1);
      startGame();
    }
    if (['arrowleft', 'a'].includes(key)) {
      event.preventDefault();
      setDirection('p1', -1, 0);
      startGame();
    }
    if (['arrowright', 'd'].includes(key)) {
      event.preventDefault();
      setDirection('p1', 1, 0);
      startGame();
    }
    if (['i'].includes(key)) {
      event.preventDefault();
      setDirection('p2', 0, -1);
      startGame();
    }
    if (['k'].includes(key)) {
      event.preventDefault();
      setDirection('p2', 0, 1);
      startGame();
    }
    if (['j'].includes(key)) {
      event.preventDefault();
      setDirection('p2', -1, 0);
      startGame();
    }
    if (['l'].includes(key)) {
      event.preventDefault();
      setDirection('p2', 1, 0);
      startGame();
    }
    if (key === ' ' || key === 'spacebar') {
      event.preventDefault();
      if (state.gameOver) {
        resetGame();
        startGame();
      } else if (state.running) {
        pauseGame();
      } else {
        startGame();
      }
    }
    if (key === 'r') {
      event.preventDefault();
      resetGame();
      startGame();
    }
  });

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action));
  });

  playerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.mobilePlayer = button.dataset.player === '2' ? 'p2' : 'p1';
      updateHud(state.winnerText);
    });
  });

  dirButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const dir = button.dataset.dir;
      const target = state.mobilePlayer;
      if (dir === 'up') setDirection(target, 0, -1);
      if (dir === 'down') setDirection(target, 0, 1);
      if (dir === 'left') setDirection(target, -1, 0);
      if (dir === 'right') setDirection(target, 1, 0);
      startGame();
    });
  });

  document.querySelectorAll('a[href="#games"]').forEach((link) => {
    link.addEventListener('click', () => {
      setTimeout(() => board.focus({ preventScroll: true }), 50);
    });
  });

  board.setAttribute('tabindex', '0');
  resetGame();
})();
