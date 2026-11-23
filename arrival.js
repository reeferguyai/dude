(() => {
  'use strict';
  const icons = {
    discovery: ['✦', '#9cff77', 'A glowing star map for exploring the Discovery Nebula'],
    marketplace: ['◈', '#ffd278', 'A golden floating marketplace portal'],
    studio: ['✎', '#c4a4ff', 'A violet creative studio portal with a design symbol'],
    xr: ['◉', '#8eeaff', 'A cyan immersive reality portal'],
    knowledge: ['❋', '#ff9bd5', 'A pink botanical knowledge grove portal'],
    rewards: ['✧', '#adffb1', 'A green rewards vault portal']
  };
  function art(label, color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>${label}</title><desc>Glowing floating destination icon in ${color}</desc><circle cx="32" cy="32" r="24" fill="none" stroke="${color}" stroke-opacity=".35" stroke-width="2"/><circle cx="32" cy="32" r="17" fill="${color}" fill-opacity=".1"/><text x="32" y="43" text-anchor="middle" fill="${color}" font-size="36" font-family="serif">${label}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  function addStars(arena) {
    const canvas = document.createElement('canvas');
    canvas.className = 'arrival-star-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    arena.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const points = Array.from({ length: 68 }, () => ({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.5, phase: Math.random() * 6.28, speed: .3 + Math.random() * .8 }));
    let frame = 0;
    function draw(time) {
      const rect = arena.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const p of points) {
        const alpha = .2 + (Math.sin(time * .001 * p.speed + p.phase) + 1) * .32;
        ctx.beginPath(); ctx.arc(p.x * rect.width, p.y * rect.height, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218,255,204,${alpha})`; ctx.shadowColor = '#aaff91'; ctx.shadowBlur = p.r * 5; ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) frame = requestAnimationFrame(draw);
    }
    draw(0);
    window.addEventListener('resize', () => { if (!frame) draw(0); }, { passive: true });
  }
  function init() {
    const nav = document.getElementById('primary-spatial-nav');
    const header = document.getElementById('primary-hud-header');
    const arena = document.getElementById('rd-gravity-arena');
    if (!nav || !header || !arena) return;

    const heading = document.createElement('h1');
    heading.className = 'arrival-title'; heading.textContent = 'ReeferDude.com';
    header.append(heading);

    const avatar = document.getElementById('ganjagroot-heading');
    if (avatar) {
      avatar.innerHTML = '<img src="/assets/botanical-guardian.svg" alt="GanjaGroot, a friendly botanical guardian glowing at the heart of the Gravity-Gone universe" title="Meet GanjaGroot, your guide through the ReeferDude universe" width="420" height="420"><span aria-hidden="true">GANJAGROOT</span>';
      avatar.setAttribute('aria-label', 'GanjaGroot, botanical guardian. Activate to open the Discovery Nebula.');
      const welcome = document.createElement('p'); welcome.className = 'arrival-welcome';
      welcome.innerHTML = 'You made it. Welcome to the trip. <em>What\'s the first move?</em>';
      arena.append(welcome);
    }
    document.querySelectorAll('.rd-floating-portal').forEach((portal, index) => {
      const key = portal.dataset.portalId;
      const data = icons[key] || ['✦', '#9cff77', 'Floating destination'];
      const img = document.createElement('img');
      img.className = 'rd-portal-art'; img.src = art(data[0], data[1]);
      img.alt = data[2]; img.title = data[2]; img.width = 64; img.height = 64;
      portal.prepend(img);
      portal.style.animationDelay = `${index * 110}ms, 0s`;
    });
    addStars(arena);

    const guruInput = document.getElementById('rd-guru-input');
    if (guruInput) {
      guruInput.placeholder = 'Search the universe or ask GanjaGuru…';
      guruInput.setAttribute('aria-label', 'Search the site or ask GanjaGuru AI Budtender');
    }
    const feed = document.querySelector('.rd-guru-feed span');
    if (feed) feed.textContent = 'Good to have you here. Find a portal, toss it around, or ask me where to start.';

    // Cloned portal contents in the dialog delegate actions back to the live controls,
    // so the visible destinations keep their real behavior.
    const dialog = document.getElementById('active-portal-dialog');
    dialog?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-request-item], #rd-generate-blueprint-btn');
      if (!target) return;
      event.preventDefault();
      const selector = target.matches('[data-request-item]')
        ? `[data-request-item="${CSS.escape(target.dataset.requestItem)}"]`
        : '#rd-generate-blueprint-btn';
      const original = [...document.querySelectorAll(selector)].find((node) => !dialog.contains(node));
      if (original) original.click();
    });
    dialog?.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.id !== 'ganjaguru-command-form') return;
      event.preventDefault();
      const input = form.querySelector('#rd-guru-input');
      if (input) document.getElementById('rd-guru-input').value = input.value;
      document.getElementById('ganjaguru-command-form')?.requestSubmit();
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
