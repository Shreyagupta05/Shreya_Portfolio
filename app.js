/* ================================================================
   SHREYA GUPTA — 3D INTERACTIVE PORTFOLIO
   Particles · 3D Cube · Tilt · Scroll Reveal · Typed · Cursor
   ================================================================ */

// ─── LOADER ─────────────────────────────────────────────────
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('done'), 600);
  });
  // Fallback: hide after 3s even if load event missed
  setTimeout(() => loader.classList.add('done'), 3000);
}
initLoader();

// ─── TYPED TEXT ──────────────────────────────────────────────
const ROLES = [
  'intelligent Python tools',
  'ML prediction pipelines',
  'modern web experiences',
  'AI-powered assistants',
  'clean backend systems',
];
let rIdx = 0, cIdx = 0, deleting = false;

function typeLoop() {
  const el = document.getElementById('role-typed');
  if (!el) return;
  const word = ROLES[rIdx];
  el.textContent = deleting ? word.slice(0, cIdx--) : word.slice(0, cIdx++);
  let wait = deleting ? 45 : 80;
  if (!deleting && cIdx > word.length) { wait = 2000; deleting = true; }
  else if (deleting && cIdx < 0) { deleting = false; cIdx = 0; rIdx = (rIdx + 1) % ROLES.length; wait = 350; }
  setTimeout(typeLoop, wait);
}

// ─── PARTICLES ──────────────────────────────────────────────
function initParticles() {
  const c = document.getElementById('particle-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H;
  const pts = [];
  const N = 100;
  const LINK = 120;
  const mouse = { x: -999, y: -999 };

  function resize() { W = c.width = innerWidth; H = c.height = innerHeight; }
  resize();
  addEventListener('resize', resize);
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  class P {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - .5) * .35;
      this.vy = (Math.random() - .5) * .35;
      this.r = Math.random() * 1.6 + .4;
      this.a = Math.random() * .4 + .15;
      this.col = Math.random() > .5 ? '168,85,247' : '34,211,238';
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90) { this.x += dx / d * 1.2; this.y += dy / d * 1.2; }
      if (this.x < 0) this.x = W; if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H; if (this.y > H) this.y = 0;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.col},${this.a})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < N; i++) pts.push(new P());

  function lines() {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(168,85,247,${(1 - d / LINK) * .2})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
  }

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => { p.update(); p.draw(); });
    lines();
    requestAnimationFrame(loop);
  })();
}

// ─── CUSTOM CURSOR ──────────────────────────────────────────
function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;
  let mx = 0, my = 0, dx = 0, dy = 0, rx = 0, ry = 0;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    dx += (mx - dx) * .15; dy += (my - dy) * .15;
    rx += (mx - rx) * .08; ry += (my - ry) * .08;
    dot.style.left = dx + 'px'; dot.style.top = dy + 'px';
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();
}

// ─── 3D TILT CARDS ──────────────────────────────────────────
function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      el.style.transform = `perspective(700px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) scale(1.02)`;
      el.style.transition = 'transform .08s ease';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform .5s ease';
    });
  });
}

// ─── 3D MODEL TURNTABLE STAGE (360° rotation with front-view snapping) ──
function initCube() {
  const container = document.getElementById('turntable-container');
  const stage = document.getElementById('stage-rotator');
  const hint = document.getElementById('stage-hint');
  if (!container || !stage) return;

  stage.style.animation = 'none';

  let currentAngleY = 0;
  let currentAngleX = 0;
  let targetSnapY = 0;
  let isRotating = true;
  let isSnapping = false;
  let isDragging = false;
  let startX = 0, startY = 0;
  let dragVelocityY = 0;
  let clickTimer = null;
  let lastTouchTime = 0;

  const ROTATION_SPEED = 0.55; // Consistent, smooth 360° rotation speed

  // Smooth requestAnimationFrame 60FPS loop with front view snap easing
  function spinLoop() {
    if (isRotating && !isDragging) {
      currentAngleY += ROTATION_SPEED + dragVelocityY;
      dragVelocityY *= 0.95;
    } else if (!isRotating && !isDragging && isSnapping) {
      // Smoothly snap to front view angle (nearest 180° / 360° alignment)
      const diffY = targetSnapY - currentAngleY;
      const diffX = 0 - currentAngleX;

      currentAngleY += diffY * 0.12;
      currentAngleX += diffX * 0.12;

      if (Math.abs(diffY) < 0.05 && Math.abs(diffX) < 0.05) {
        currentAngleY = targetSnapY;
        currentAngleX = 0;
        isSnapping = false;
      }
    }

    stage.style.transform = `rotateX(${currentAngleX}deg) rotateY(${currentAngleY}deg)`;
    requestAnimationFrame(spinLoop);
  }
  requestAnimationFrame(spinLoop);

  // Toggle Rotation Helper (Single Tap / Click)
  function toggleRotation() {
    if (isRotating) {
      isRotating = false;
      dragVelocityY = 0;
      targetSnapY = Math.round(currentAngleY / 180) * 180;
      isSnapping = true;
      if (hint) hint.innerHTML = '<i data-lucide="check-circle"></i> 🎯 Stopped & Snapped to Front (Tap to Start)';
    } else {
      isRotating = true;
      isSnapping = false;
      if (hint) hint.innerHTML = '<i data-lucide="rotate-3d"></i> 🟢 360° Rotation Active (Tap to Stop & Snap)';
    }
    if (window.lucide) lucide.createIcons();
  }

  // Single Tap / Click toggles Rotation (Start / Stop & Snap)
  container.addEventListener('click', e => {
    if (!isDragging) {
      toggleRotation();
    }
  });

  // Mobile Touch Gestures (Single Tap to Start/Stop)
  container.addEventListener('touchend', e => {
    if (!isDragging) {
      toggleRotation();
    }
  });

  // Drag / Touch-Move 3D stage interaction
  container.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    e.preventDefault();
  });

  container.addEventListener('touchstart', e => {
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  addEventListener('mousemove', e => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    dragVelocityY = deltaX * 0.2;
    currentAngleY += deltaX * 0.5;
    currentAngleX -= deltaY * 0.2;
    currentAngleX = Math.max(-25, Math.min(25, currentAngleX));
    startX = e.clientX;
    startY = e.clientY;
  });

  addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    const deltaX = t.clientX - startX;
    const deltaY = t.clientY - startY;
    dragVelocityY = deltaX * 0.2;
    currentAngleY += deltaX * 0.5;
    currentAngleX -= deltaY * 0.2;
    currentAngleX = Math.max(-25, Math.min(25, currentAngleX));
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  addEventListener('mouseup', () => { isDragging = false; });
  addEventListener('touchend', () => { isDragging = false; });
}

// ─── SCROLL REVEAL ──────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('[data-anim]');
  const fills = document.querySelectorAll('.bar-fill');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.animDelay || 0;
        setTimeout(() => entry.target.classList.add('in'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .1, rootMargin: '0px 0px -30px 0px' });

  // Stagger siblings
  const groups = new Map();
  els.forEach(el => {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  });
  groups.forEach(group => group.forEach((el, i) => { el.dataset.animDelay = i * 90; }));
  els.forEach(el => io.observe(el));

  // Skill bars
  const barIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const w = entry.target.dataset.w;
        entry.target.style.setProperty('--w', w + '%');
        entry.target.classList.add('active');
        barIO.unobserve(entry.target);
      }
    });
  }, { threshold: .3 });
  fills.forEach(b => barIO.observe(b));
}

// ─── SCROLL PROGRESS ───────────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (scrollY / h * 100) + '%';
  }, { passive: true });
}

// ─── NAV ────────────────────────────────────────────────────
function initNav() {
  const header = document.getElementById('main-header');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  const ham = toggle?.querySelector('.hamburger');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', scrollY > 40);
  }, { passive: true });

  function setActive() {
    let cur = '';
    sections.forEach(s => { if (scrollY >= s.offsetTop - 120) cur = s.id; });
    links.forEach(l => l.classList.toggle('active', l.dataset.section === cur));
  }
  addEventListener('scroll', setActive, { passive: true });
  setActive();

  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    ham?.classList.toggle('open', open);
  });
  mobileLinks.forEach(l => l.addEventListener('click', () => {
    menu.classList.remove('open');
    ham?.classList.remove('open');
  }));

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

// ─── BACK TO TOP ────────────────────────────────────────────
function initBTT() {
  const btn = document.getElementById('btt');
  if (!btn) return;
  addEventListener('scroll', () => btn.classList.toggle('show', scrollY > 500), { passive: true });
  btn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── CONTACT FORM (Automatic Email API submit - No mail client option) ──
function initForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const btn = document.getElementById('send-btn');
  if (!form) return;

  const targetEmail = 'email-nobitashizuka543543@gmail.com';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('c-name')?.value.trim();
    const email = document.getElementById('c-email')?.value.trim();
    const message = document.getElementById('c-message')?.value.trim();
    const subject = document.getElementById('c-subject')?.value.trim() || 'Portfolio Message from ' + name;

    // Strict Field Validation (All fields required)
    if (!name) {
      return showStatus('err', '⚠ Name field is required.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showStatus('err', '⚠ A valid Email address is required.');
    }
    if (!message) {
      return showStatus('err', '⚠ Message field is required.');
    }

    btn.innerHTML = '<i data-lucide="loader-2" class="spin-icon"></i> <span>Sending Message…</span>';
    if (window.lucide) lucide.createIcons();
    btn.disabled = true;

    try {
      // Background Email Service Dispatch via FormSubmit API (Sends directly to email without opening any mail client)
      const res = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          _subject: subject,
          message: message,
          _captcha: 'false'
        })
      });

      if (res.ok) {
        form.reset();
        showStatus('ok', '🎉 Thank you for contacting me!');
      } else {
        // Fallback Web3Forms background API
        const fallbackRes = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: '564a5c54-469b-4395-926e-4c57c2c8f85f',
            name: name,
            email: email,
            subject: subject,
            message: message
          })
        });

        if (fallbackRes.ok) {
          form.reset();
          showStatus('ok', '🎉 Thank you for contacting me!');
        } else {
          showStatus('err', '❌ Failed to send message. Please try again.');
        }
      }
    } catch (err) {
      showStatus('err', '❌ Failed to send message. Please try again.');
    } finally {
      btn.innerHTML = '<i data-lucide="send"></i> <span>Send Message</span>';
      btn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }
  });

  function showStatus(type, msg) {
    status.textContent = msg;
    status.className = 'form-status ' + type;
    setTimeout(() => { status.className = 'form-status'; }, 6000);
  }
}

// ─── GALLERY FLIP (touch support) ──────────────────────────
function initGallery() {
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const front = item.querySelector('.g-front');
      const back = item.querySelector('.g-back');
      if (!front || !back) return;
      const isFlipped = front.style.transform === 'rotateY(-180deg)';
      front.style.transform = isFlipped ? '' : 'rotateY(-180deg)';
      back.style.transform = isFlipped ? 'rotateY(180deg)' : '';
    });
  });
}

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  initParticles();
  initCursor();
  initTilt();
  initCube();
  initScrollReveal();
  initScrollProgress();
  initNav();
  initBTT();
  initForm();
  initGallery();

  setTimeout(typeLoop, 1000);
});
