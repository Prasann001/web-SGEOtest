// SGEO — mirrors the exact Arduino threshold logic
const HIGH_T = 1400, MOD_T = 900, LOW_T = 400;

const slider   = document.getElementById('powerSlider');
const simVal   = document.getElementById('simVal');
const dayNight = document.getElementById('dayNight');
const lcd1     = document.getElementById('lcdLine1');
const lcd2     = document.getElementById('lcdLine2');
const zH = document.getElementById('zHospital');
const zS = document.getElementById('zSchool');
const zT = document.getElementById('zStreet');

let night = true;

// build LED dots
document.querySelectorAll('.leds').forEach(el => {
  const n = parseInt(el.dataset.count, 10);
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'led';
    el.appendChild(d);
  }
});

function setZone(zone, on) {
  zone.classList.toggle('on', on);
  zone.querySelector('.zstate').textContent = on ? 'ON' : 'OFF';
}

function update() {
  const total = parseInt(slider.value, 10);
  simVal.textContent = total;
  lcd1.textContent = 'Total:' + total;

  let hosp = true, school = false, street = false, mode;

  if (total >= HIGH_T) {
    school = true;
    street = night; // LDR gating: street lights only at night
    mode = night ? 'HIGH: all ON' : 'HIGH: street off';
  } else if (total >= MOD_T) {
    school = true;
    mode = 'MODERATE';
  } else if (total >= LOW_T) {
    mode = 'LOW: hosp only';
  } else {
    mode = 'CRITICAL';
  }

  lcd2.textContent = mode;
  setZone(zH, hosp);
  setZone(zS, school);
  setZone(zT, street);
}

slider.addEventListener('input', update);

// --- interactive 3D tilt that follows the cursor ---
function apply3DTilt(selector, intensity = 25) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -intensity;
      const ry = ((x / r.width) - 0.5) * intensity;
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}
apply3DTilt('.card');
apply3DTilt('.flow-node.brain, .flow-node.big');
apply3DTilt('.zone');

// --- background parallax drift on mouse move ---
document.addEventListener('mousemove', e => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;
  document.querySelector('.grid-bg').style.transform = `translate(${x}px, ${y}px)`;
});
dayNight.addEventListener('click', () => {
  night = !night;
  dayNight.textContent = night ? '🌙 Night' : '☀️ Day';
  dayNight.setAttribute('aria-pressed', night);
  update();
});
update();

// scroll reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// --- 3D flip cards ---
document.querySelectorAll('.flip-card').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('flipped'));
});

// --- scroll-linked 3D rotation ---
function updateScrollRotation() {
  const vh = window.innerHeight;
  document.querySelectorAll('.section.visible').forEach(sec => {
    const r = sec.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const dist = Math.max(-1, Math.min(1, (center - vh / 2) / vh));
    const rotate = dist * -6;
    const scale = 1 - Math.abs(dist) * 0.025;
    sec.style.transform = `perspective(1200px) rotateX(${rotate}deg) scale(${scale})`;
  });
}
window.addEventListener('scroll', updateScrollRotation, { passive: true });
window.addEventListener('resize', updateScrollRotation);
updateScrollRotation();

// --- intro loader ---
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('.loader-screen').classList.add('hide');
  }, 1400);
});

// --- scroll progress bar ---
function updateScrollProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  document.querySelector('.scroll-progress').style.width = pct + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// --- splash cursor trail ---
(() => {
  const canvas = document.getElementById('splashCursor');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const colors = ['#00e5ff', '#00ff9d', '#ffb300'];

  window.addEventListener('mousemove', e => {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      });
    }
  });

  // touch support for mobile
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    particles.push({ x: t.clientX, y: t.clientY, size: 6, color: colors[Math.floor(Math.random()*colors.length)], life: 1 });
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.fill();
     p.life -= 0.03;
if (p.vx !== undefined) { p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; }
else { p.y -= 0.5; }
    });
    ctx.globalAlpha = 1;
    particles = particles.filter(p => p.life > 0);
    requestAnimationFrame(animate);
  }
  animate();
})();

// --- stats counter animation ---
const statObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 60));
      const tick = () => {
        current += step;
        if (current >= target) { el.textContent = target; }
        else { el.textContent = current; requestAnimationFrame(tick); }
      };
      tick();
      statObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => statObs.observe(el));

// --- copy code button ---
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const code = btn.closest('.code-box').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      btn.textContent = '✅ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
    });
  });
});

// --- magnetic CTA button ---
const magneticBtn = document.querySelector('.hero-cta');
if (magneticBtn) {
  magneticBtn.addEventListener('mousemove', e => {
    const r = magneticBtn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    magneticBtn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });
  magneticBtn.addEventListener('mouseleave', () => {
    magneticBtn.style.transform = '';
  });
}

// --- staggered heading word reveal ---
document.querySelectorAll('.section h2').forEach(h => {
  const text = h.textContent;
  h.innerHTML = text.split(' ').map((w, i) =>
    `<span class="word" style="transition-delay:${i * 0.08}s">${w}&nbsp;</span>`
  ).join('');
});

// --- custom cursor ring ---
const ring = document.getElementById('cursorRing');
if (ring) {
  window.addEventListener('mousemove', e => {
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, .card, .flip-card, .zone, .member-card, input[type=range]').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
  });
}

// --- active nav highlight on scroll ---
const navLinks = document.querySelectorAll('.nav-links a');
const navSections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
function updateActiveNav() {
  const scrollPos = window.scrollY + window.innerHeight * 0.3;
  let current = navSections[0];
  navSections.forEach(sec => { if (sec.offsetTop <= scrollPos) current = sec; });
  navLinks.forEach(a => a.classList.toggle('active', document.querySelector(a.getAttribute('href')) === current));
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
if (typeof lenis !== 'undefined') lenis.on('scroll', updateActiveNav);
updateActiveNav();

// --- particle burst on zone activation ---
function burstAt(el, color) {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18;
    const speed = 3 + Math.random() * 3;
    particles.push({
      x: cx, y: cy, size: Math.random() * 4 + 3, color,
      life: 1, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed
    });
  }
}
// hook into existing setZone (redefine to add burst on turning ON)
const _origSetZone = setZone;
setZone = function(zone, on) {
  const wasOn = zone.classList.contains('on');
  _origSetZone(zone, on);
  if (on && !wasOn) {
    const color = zone.classList.contains('zone-red') ? '#ff4757' : zone.classList.contains('zone-green') ? '#00ff9d' : '#ffb300';
    burstAt(zone, color);
  }
};

// --- LCD digit roll animation ---
let lastLcdTotal = null;
function animateLcdRoll() {
  if (lcd1.textContent !== lastLcdTotal) {
    lcd1.classList.add('rolling-parent');
    lcd1.style.animation = 'none';
    void lcd1.offsetWidth;
    lcd1.style.animation = '';
    lastLcdTotal = lcd1.textContent;
  }
}
const lcdObs = new MutationObserver(animateLcdRoll);
lcdObs.observe(lcd1, { childList: true, characterData: true, subtree: true });
