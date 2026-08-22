(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const waveEl = document.getElementById('wave');
  const messageEl = document.getElementById('message');
  const startEl = document.getElementById('start');
  const restartEl = document.getElementById('restart');

  const W = canvas.width, H = canvas.height;
  let ship, bullets, rocks, particles, score, lives, wave, running, keys, thrusting;

  function reset() {
    ship = { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0, r: 14, cool: 0 };
    bullets = []; particles = []; rocks = [];
    score = 0; lives = 3; wave = 1;
    scoreEl.textContent = '0'; livesEl.textContent = '3'; waveEl.textContent = '1';
    spawnWave();
  }

  function spawnWave() {
    for (let i = 0; i < 3 + wave; i++) {
      let x, y;
      do { x = Math.random() * W; y = Math.random() * H; }
      while (Math.hypot(x - ship.x, y - ship.y) < 140);
      const ang = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 0.8;
      rocks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, size: 3, r: 38 });
    }
  }

  function newGame() { reset(); running = false; messageEl.textContent = 'Press Start to fly.'; draw(); }

  function burst(x, y, col) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * 3 + 1;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 30, col });
    }
  }

  function fire() {
    if (ship.cool > 0) return;
    ship.cool = 8;
    const sp = 7;
    bullets.push({ x: ship.x + Math.cos(ship.a) * ship.r, y: ship.y + Math.sin(ship.a) * ship.r,
      vx: Math.cos(ship.a) * sp + ship.vx, vy: Math.sin(ship.a) * sp + ship.vy, life: 60 });
  }

  function split(rock) {
    if (rock.size > 1) {
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2, sp = 1 + Math.random();
        rocks.push({ x: rock.x, y: rock.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: rock.size - 1, r: rock.r * 0.62 });
      }
    }
    burst(rock.x, rock.y, '#9fd6ff');
    score += (4 - rock.size) * 20;
    scoreEl.textContent = String(score);
  }

  function wrap(o) {
    if (o.x < 0) o.x += W; if (o.x > W) o.x -= W;
    if (o.y < 0) o.y += H; if (o.y > H) o.y -= H;
  }

  function update() {
    if (keys['ArrowUp']) {
      thrusting = true;
      ship.vx += Math.cos(ship.a) * 0.12; ship.vy += Math.sin(ship.a) * 0.12;
    } else thrusting = false;
    if (keys['ArrowLeft']) ship.a -= 0.07;
    if (keys['ArrowRight']) ship.a += 0.07;
    if (keys[' ']) fire();
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx; ship.y += ship.vy; ship.cool--;
    wrap(ship);

    bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; wrap(b); });
    bullets = bullets.filter(b => b.life > 0);

    rocks.forEach(r => { r.x += r.vx; r.y += r.vy; wrap(r); });

    for (const b of bullets) {
      for (let i = rocks.length - 1; i >= 0; i--) {
        const r = rocks[i];
        if (Math.hypot(b.x - r.x, b.y - r.y) < r.r) { split(r); rocks.splice(i, 1); b.life = 0; break; }
      }
    }

    for (let i = rocks.length - 1; i >= 0; i--) {
      if (Math.hypot(ship.x - rocks[i].x, ship.y - rocks[i].y) < rocks[i].r + ship.r) {
        burst(ship.x, ship.y, '#ff5e7e');
        lives--; livesEl.textContent = String(lives);
        if (lives <= 0) { running = false; messageEl.textContent = 'Game Over! Press Restart.'; }
        else { ship.x = W / 2; ship.y = H / 2; ship.vx = ship.vy = 0; }
        rocks.splice(i, 1);
      }
    }

    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    particles = particles.filter(p => p.life > 0);

    if (rocks.length === 0 && running) { wave++; waveEl.textContent = String(wave); spawnWave(); }
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0c1d'); g.addColorStop(1, '#10133a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % W, y = (i * 53) % H;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    if (running || lives > 0) {
      ctx.save();
      ctx.translate(ship.x, ship.y); ctx.rotate(ship.a);
      if (thrusting) {
        ctx.fillStyle = '#ff9d5e';
        ctx.beginPath(); ctx.moveTo(-ship.r, -5); ctx.lineTo(-ship.r - 10, 0); ctx.lineTo(-ship.r, 5); ctx.fill();
      }
      ctx.strokeStyle = '#4cc9f0'; ctx.lineWidth = 2; ctx.shadowBlur = 12; ctx.shadowColor = '#4cc9f0';
      ctx.beginPath();
      ctx.moveTo(ship.r, 0); ctx.lineTo(-ship.r, -ship.r * 0.7); ctx.lineTo(-ship.r * 0.5, 0); ctx.lineTo(-ship.r, ship.r * 0.7);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    }

    ctx.strokeStyle = '#9fd6ff'; ctx.lineWidth = 2;
    rocks.forEach(r => {
      ctx.save(); ctx.translate(r.x, r.y); ctx.shadowBlur = 10; ctx.shadowColor = '#9fd6ff';
      ctx.beginPath();
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r.r * (0.75 + 0.25 * ((i * 37) % 5) / 5);
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.stroke(); ctx.restore();
    });

    ctx.fillStyle = '#ffe66d';
    bullets.forEach(b => { ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = '#ffe66d'; ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });

    particles.forEach(p => {
      ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.col;
      ctx.fillRect(p.x, p.y, 2, 2); ctx.globalAlpha = 1;
    });
  }

  function loop() {
    if (running) update();
    draw();
    requestAnimationFrame(loop);
  }

  keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'Shift') { ship.x = Math.random() * W; ship.y = Math.random() * H; ship.vx = ship.vy = 0; }
    if (e.key === ' ') e.preventDefault();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  startEl.addEventListener('click', () => { if (!running && lives > 0) { running = true; messageEl.textContent = 'Fly!'; } });
  restartEl.addEventListener('click', newGame);

  newGame();
  requestAnimationFrame(loop);
})();
