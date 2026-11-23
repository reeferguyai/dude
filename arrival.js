(() => {
  'use strict';

  const destinations = {
    discovery: { glyph: '✦', color: '#9cff77', alt: 'Glowing star-map icon for the Discovery Nebula' },
    marketplace: { glyph: '◈', color: '#ffd278', alt: 'Golden glass-like portal icon for the Ghost Marketplace' },
    studio: { glyph: '✎', color: '#c4a4ff', alt: 'Violet blueprint icon for the Dream-It creative studio' },
    xr: { glyph: '◉', color: '#8eeaff', alt: 'Cyan holographic lens icon for the AR and VR lab' },
    knowledge: { glyph: '❋', color: '#ff9bd5', alt: 'Botanical leaf icon for the Knowledge Grove' },
    rewards: { glyph: '✧', color: '#adffb1', alt: 'Green ember icon for the SmokeSeeds rewards vault' }
  };

  function iconImage(glyph, color, alt) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${alt}"><circle cx="32" cy="32" r="25" fill="${color}" fill-opacity=".08" stroke="${color}" stroke-opacity=".55" stroke-width="1.5"/><circle cx="32" cy="32" r="19" fill="none" stroke="${color}" stroke-opacity=".22"/><text x="32" y="43" text-anchor="middle" fill="${color}" font-size="34" font-family="serif">${glyph}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function addStars(arena) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'arrival-star-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    arena.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const stars = Array.from({ length: 64 }, () => ({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.4, phase: Math.random() * 6.28, speed: .3 + Math.random() * .7 }));
    let frame = 0;
    const draw = (time) => {
      const rect = arena.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const star of stars) {
        const alpha = .18 + (Math.sin(time * .001 * star.speed + star.phase) + 1) * .3;
        ctx.beginPath();
        ctx.arc(star.x * rect.width, star.y * rect.height, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218,255,204,${alpha})`;
        ctx.shadowColor = '#aaff91';
        ctx.shadowBlur = star.r * 5;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
  }

  function playArrival(arena) {
    if (document.body.dataset.ageVerified !== 'true') return;
    if (document.querySelector('.arrival-intro')) return;

    const intro = document.createElement('div');
    intro.className = 'arrival-intro';
    intro.setAttribute('role', 'status');
    intro.setAttribute('aria-live', 'polite');
    intro.innerHTML = `
      <div class="arrival-intro__word">reeferdude.com</div>
      <div class="arrival-intro__breathe">BREATHE.</div>
      <span class="arrival-intro__ember" aria-hidden="true"></span>
      <div class="arrival-intro__welcome">You made it. Welcome to the trip.<br><span>What’s the first move?</span></div>
    `;
    document.body.append(intro);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      document.body.classList.add('arrival-revealed');
      intro.classList.add('is-leaving');
      window.setTimeout(() => intro.remove(), reduced ? 50 : 850);
    };
    if (reduced) {
      window.setTimeout(finish, 900);
      return;
    }
    window.setTimeout(() => intro.classList.add('is-igniting'), 1050);
    window.setTimeout(() => intro.classList.add('is-blooming'), 1950);
    window.setTimeout(() => {
      document.body.classList.add('arrival-revealed');
      intro.classList.add('is-revealing');
    }, 3650);
    window.setTimeout(() => intro.classList.add('is-welcoming'), 4400);
    window.setTimeout(finish, 6200);
  }

  function init() {
    const nav = document.getElementById('primary-spatial-nav');
    const header = document.getElementById('primary-hud-header');
    const arena = document.getElementById('rd-gravity-arena');
    if (!nav || !header || !arena) return;

    const heading = header.querySelector('.arrival-title') || document.createElement('h1');
    heading.className = 'arrival-title';
    heading.textContent = 'ReeferDude.com';
    if (!heading.parentNode) header.append(heading);

    const avatar = document.getElementById('ganjagroot-heading');
    if (avatar) {
      avatar.innerHTML = '<img src="/assets/botanical-guardian.svg" alt="GanjaGroot, a friendly cannabis-inspired botanical guardian with a glowing leafy crown, holding a lit blunt as soft emerald smoke curls into the floating destinations" title="Meet GanjaGroot, your guide through the ReeferDude universe" width="420" height="420"><span aria-hidden="true">GANJAGROOT</span>';
      avatar.setAttribute('aria-label', 'GanjaGroot, botanical guardian. Activate to open the Discovery Nebula.');
      const welcome = document.createElement('p');
      welcome.className = 'arrival-welcome';
      welcome.innerHTML = 'You made it. Welcome to the trip. <em>What’s the first move?</em>';
      arena.append(welcome);
    }

    document.querySelectorAll('.rd-floating-portal').forEach((portal, index) => {
      const data = destinations[portal.dataset.portalId] || { glyph: '✦', color: '#9cff77', alt: 'Floating universe destination' };
      const image = document.createElement('img');
      image.className = 'rd-portal-art';
      image.src = iconImage(data.glyph, data.color, data.alt);
      image.alt = data.alt;
      image.title = data.alt;
      image.width = 64;
      image.height = 64;
      portal.prepend(image);
      portal.style.animationDelay = `${index * 110}ms, 0s`;
    });
    addStars(arena);

    const input = document.getElementById('rd-guru-input');
    if (input) {
      input.placeholder = 'Search the universe or ask GanjaGuru…';
      input.setAttribute('aria-label', 'Search the site or ask GanjaGuru AI Budtender');
    }
    const feed = document.querySelector('.rd-guru-feed span');
    if (feed) feed.textContent = 'Good to have you here. Find a portal, toss it around, or ask me where to start.';

    const ageDialog = document.getElementById('age-gate-modal');
    if (document.body.dataset.ageVerified === 'true') playArrival(arena);
    else ageDialog?.addEventListener('close', () => playArrival(arena), { once: true });

    const dialog = document.getElementById('active-portal-dialog');
    dialog?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-request-item], #rd-generate-blueprint-btn');
      if (!target) return;
      event.preventDefault();
      const selector = target.matches('[data-request-item]')
        ? `[data-request-item="${CSS.escape(target.dataset.requestItem)}"]`
        : '#rd-generate-blueprint-btn';
      const original = [...document.querySelectorAll(selector)].find((node) => !dialog.contains(node));
      original?.click();
    });
    dialog?.addEventListener('submit', (event) => {
      if (event.target.id !== 'ganjaguru-command-form') return;
      event.preventDefault();
      const dialogInput = event.target.querySelector('#rd-guru-input');
      const liveInput = document.querySelector('#ganjaguru-voice-dock #rd-guru-input');
      if (dialogInput && liveInput) liveInput.value = dialogInput.value;
      document.querySelector('#ganjaguru-voice-dock #ganjaguru-command-form')?.requestSubmit();
    });

    let pointerFrame = 0;
    window.addEventListener('pointermove', (event) => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        arena.style.setProperty('--pointer-x', `${event.clientX}px`);
        arena.style.setProperty('--pointer-y', `${event.clientY}px`);
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
