(() => {
  'use strict';

  const STORAGE_KEYS = {
    ageVerified: 'rd_age_verified_21_v1',
    consent: 'rd_cookie_consent_matrix_v1',
    gamification: 'rd_gamification_ledger_v1',
    portals: 'rd_gravity_portals_v1',
    theme: 'rd_theme_mode_v1',
    lang: 'rd_locale_lang_v1',
    reducedMotion: 'rd_reduced_motion_v1',
    blueprintDraft: 'rd_dream_studio_draft_v1'
  };

  const DEFAULT_CONSENT = {
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
    timestamp: null
  };

  const DEFAULT_GAMIFICATION = {
    xp: 120,
    level: 2,
    streakDays: 1,
    smokeSeeds: 250,
    lastCheckIn: new Date().toISOString().slice(0, 10),
    unlockedBadges: ['First Drift', 'Eco Explorer'],
    completedQuests: []
  };

  const PORTAL_DEFS = [
    {
      id: 'discovery',
      title: 'Discovery Nebula',
      subtitle: 'Guided zero-gravity tour & ecosystem map',
      color: '#7cff8a',
      x: -210,
      y: -120,
      vx: 0.24,
      vy: -0.16
    },
    {
      id: 'marketplace',
      title: 'Ghost Marketplace',
      subtitle: 'Zero-inventory hemp, glassware & 3DPoD gear',
      color: '#ffd36b',
      x: 210,
      y: -120,
      vx: -0.22,
      vy: 0.18
    },
    {
      id: 'studio',
      title: 'Dream-It Studio',
      subtitle: 'SVG merch & 3DPoD STL blueprint builder',
      color: '#c69bff',
      x: -210,
      y: 125,
      vx: 0.19,
      vy: 0.21
    },
    {
      id: 'xr',
      title: 'WebXR AR / VR Lab',
      subtitle: 'Spatial 3D preview & AR placement',
      color: '#72f5ff',
      x: 210,
      y: 125,
      vx: -0.21,
      vy: -0.17
    },
    {
      id: 'knowledge',
      title: 'Knowledge Grove',
      subtitle: 'Hemp materials, terpenes & Socket guides',
      color: '#ff8ad8',
      x: 0,
      y: -175,
      vx: 0.15,
      vy: 0.12
    },
    {
      id: 'rewards',
      title: 'SmokeSeeds Vault',
      subtitle: 'Quests, daily spin & creator milestones',
      color: '#a6ffae',
      x: 0,
      y: 175,
      vx: -0.16,
      vy: -0.14
    }
  ];

  const MARKETPLACE_CATALOG = [
    {
      id: 'item-hemp-hoodie',
      name: 'Organic Hemp Heavyweight Hoodie',
      category: 'Hemp Apparel',
      mode: 'Print-on-Demand (Zero Inventory)',
      price: '$58.00',
      eco: '100% organic hemp & recycled fiber, made to order'
    },
    {
      id: 'item-3dpod-tray',
      name: 'Modular Biodegradable Rolling & Herb Tray',
      category: '3DPoD Accessories',
      mode: '3D Print-on-Demand (PLA+)',
      price: '$24.00',
      eco: 'Plant-based biodegradable PLA+ printed on demand'
    },
    {
      id: 'item-odor-pouch',
      name: 'Activated Carbon Smell-Proof Travel Pouch',
      category: 'Lifestyle Gear',
      mode: 'Verified Eco Partner',
      price: '$34.00',
      eco: 'Recycled weave with replaceable carbon filter'
    },
    {
      id: 'item-3dpod-stash',
      name: 'Gravity-Gone Hex Stash Pod (STL / 3DPoD)',
      category: '3DPoD Accessories',
      mode: '3D Print-on-Demand (PLA+)',
      price: '$19.00',
      eco: 'Zero-waste batch production with snap-fit lid'
    }
  ];

  const KNOWLEDGE_ITEMS = [
    {
      id: 'k-socket',
      title: 'Zero-Inventory "Socket" Commerce',
      topic: 'Business & POD/3DPoD',
      summary: 'Connect custom SVG/STL designs directly to Print-on-Demand and 3DPoD partners so you never hold dead stock.'
    },
    {
      id: 'k-hemp',
      title: 'Hemp Textiles & Biodegradable PLA+',
      topic: 'Sustainability',
      summary: 'Durable bast fibers and plant-derived 3D printing polymers designed for lower environmental impact.'
    },
    {
      id: 'k-offline-ai',
      title: 'Local-First AI & Offline Resilience',
      topic: 'GanjaGuru AI',
      summary: 'Combine browser storage, Service Worker caching, and local GGUF/Ollama models for dependable assistance.'
    }
  ];

  const QUESTS = [
    { id: 'q-flick', label: 'Drag or flick a floating Gravity-Gone portal', rewardSeeds: 50, rewardXp: 35 },
    { id: 'q-studio', label: 'Generate a POD or 3DPoD blueprint in Dream-It Studio', rewardSeeds: 75, rewardXp: 50 },
    { id: 'q-guru', label: 'Ask GanjaGuru AI a question or test voice mode', rewardSeeds: 40, rewardXp: 25 }
  ];

  const state = {
    ageVerified: false,
    consent: { ...DEFAULT_CONSENT },
    gamification: { ...DEFAULT_GAMIFICATION },
    portals: PORTAL_DEFS.map((p) => ({ ...p, isDragging: false })),
    reducedMotion: false,
    theme: 'gravity-gone-dark',
    lang: 'en',
    activePortalId: null,
    pendingApproval: null
  };

  function safeReadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function safeWriteJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota errors
    }
  }

  function announce(message, assertive = false) {
    const target = document.getElementById(
      assertive ? 'alert-announcer-region' : 'live-announcer-region'
    );
    if (target) {
      target.textContent = '';
      requestAnimationFrame(() => {
        target.textContent = message;
      });
    }
  }

  function updateConsentMode(consent) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: consent.marketing ? 'granted' : 'denied',
        ad_user_data: consent.marketing ? 'granted' : 'denied',
        ad_personalization: consent.marketing ? 'granted' : 'denied',
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        personalization_storage: consent.personalization ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
      });
    }
    document.body.dataset.consentReady = 'true';
  }

  function awardGamification(seedsDelta, xpDelta, reasonLabel) {
    const g = state.gamification;
    g.smokeSeeds = Math.max(0, g.smokeSeeds + seedsDelta);
    g.xp += xpDelta;
    g.level = Math.max(1, Math.floor(g.xp / 100) + 1);
    safeWriteJSON(STORAGE_KEYS.gamification, g);
    renderGamificationHUD();
    if (reasonLabel) {
      announce(`${reasonLabel}: +${seedsDelta} SmokeSeeds, +${xpDelta} XP. Level ${g.level}.`);
    }
  }

  function completeQuest(questId) {
    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest || state.gamification.completedQuests.includes(questId)) return;
    state.gamification.completedQuests.push(questId);
    awardGamification(quest.rewardSeeds, quest.rewardXp, `Quest completed: ${quest.label}`);
  }

  function renderGamificationHUD() {
    const bar = document.getElementById('gamification-status-bar');
    if (!bar) return;
    const g = state.gamification;
    bar.innerHTML = `
      <span class="rd-stat-chip rd-stat-chip--green" title="Current Level">LVL ${g.level}</span>
      <span class="rd-stat-chip rd-stat-chip--violet" title="Experience Points">${g.xp} XP</span>
      <span class="rd-stat-chip" title="SmokeSeeds Balance">🌱 ${g.smokeSeeds} Seeds</span>
      <span class="rd-stat-chip" title="Daily Streak">🔥 ${g.streakDays}d</span>
      <button type="button" class="rd-btn rd-btn--gold" id="rd-daily-spin-btn">Daily Spin</button>
    `;
    const spinBtn = document.getElementById('rd-daily-spin-btn');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => {
        const bonus = [25, 50, 75, 100, 150][Math.floor(Math.random() * 5)];
        awardGamification(bonus, 20, 'Cosmic Wheel Spin');
        setGuruMessage(
          `Cosmic wheel spun! You pulled +${bonus} SmokeSeeds and +20 XP. Put them toward a 3DPoD or POD blueprint in Dream-It Studio.`
        );
      });
    }
  }

  function renderTopHUD() {
    const nav = document.getElementById('primary-spatial-nav');
    if (!nav) return;
    nav.innerHTML = `
      <button type="button" class="rd-brand-trigger" id="rd-home-btn" aria-label="ReeferDude Home">
        <span>🌿</span>
        <span>REEFERDUDE</span>
      </button>
      <button type="button" class="rd-nav-pill" data-open-portal="discovery">Discovery</button>
      <button type="button" class="rd-nav-pill" data-open-portal="marketplace">Marketplace</button>
      <button type="button" class="rd-nav-pill" data-open-portal="studio">Dream-It Studio</button>
      <button type="button" class="rd-nav-pill" data-open-portal="xr">AR / VR</button>
      <button type="button" class="rd-nav-pill" data-open-portal="knowledge">Knowledge</button>
      <button type="button" class="rd-nav-pill" data-open-portal="rewards">Rewards</button>
      <button type="button" class="rd-btn" id="rd-motion-toggle" aria-pressed="${state.reducedMotion}">
        ${state.reducedMotion ? 'Motion: Off' : 'Motion: On'}
      </button>
      <button type="button" class="rd-btn" id="rd-theme-toggle" aria-label="Toggle color theme">
        ${state.theme === 'gravity-gone-dark' ? 'Light' : 'Dark'}
      </button>
      <button type="button" class="rd-btn" id="rd-reset-portals-btn" title="Reset floating portals">
        Reset Orbits
      </button>
      <select class="rd-select" id="rd-lang-select" aria-label="Language selector">
        <option value="en" ${state.lang === 'en' ? 'selected' : ''}>EN</option>
        <option value="es" ${state.lang === 'es' ? 'selected' : ''}>ES</option>
        <option value="de" ${state.lang === 'de' ? 'selected' : ''}>DE</option>
        <option value="fr" ${state.lang === 'fr' ? 'selected' : ''}>FR</option>
        <option value="ja" ${state.lang === 'ja' ? 'selected' : ''}>JA</option>
        <option value="zh" ${state.lang === 'zh' ? 'selected' : ''}>ZH</option>
      </select>
    `;

    document.getElementById('rd-home-btn')?.addEventListener('click', () => {
      closePortalDialog();
      window.scrollTo({ top: 0, behavior: state.reducedMotion ? 'auto' : 'smooth' });
    });

    nav.querySelectorAll('[data-open-portal]').forEach((btn) => {
      btn.addEventListener('click', () => openPortalDialog(btn.dataset.openPortal));
    });

    document.getElementById('rd-motion-toggle')?.addEventListener('click', () => {
      state.reducedMotion = !state.reducedMotion;
      safeWriteJSON(STORAGE_KEYS.reducedMotion, state.reducedMotion);
      applyMotionAndTheme();
      renderTopHUD();
      announce(`Motion ${state.reducedMotion ? 'disabled' : 'enabled'}.`);
    });

    document.getElementById('rd-theme-toggle')?.addEventListener('click', () => {
      state.theme =
        state.theme === 'gravity-gone-dark' ? 'gravity-gone-light' : 'gravity-gone-dark';
      safeWriteJSON(STORAGE_KEYS.theme, state.theme);
      applyMotionAndTheme();
      renderTopHUD();
    });

    document.getElementById('rd-reset-portals-btn')?.addEventListener('click', () => {
      state.portals = PORTAL_DEFS.map((p) => ({ ...p, isDragging: false }));
      safeWriteJSON(STORAGE_KEYS.portals, state.portals);
      renderPortals();
      announce('Gravity-Gone floating portals reset to default orbits.');
    });

    document.getElementById('rd-lang-select')?.addEventListener('change', (e) => {
      state.lang = e.target.value;
      document.documentElement.lang = state.lang;
      safeWriteJSON(STORAGE_KEYS.lang, state.lang);
      announce(`Language set to ${state.lang.toUpperCase()}.`);
    });
  }

  function applyMotionAndTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.body.classList.toggle('rd-reduced-motion', state.reducedMotion);
  }

  function renderMonetizationSlots() {
    const topSlot = document.getElementById('monetization-top-slot');
    if (topSlot) {
      topSlot.innerHTML = `
        <span>
          <strong>ZERO-INVENTORY SOCKET:</strong> Sustainable hemp apparel, biodegradable 3DPoD gear &amp; verified partners.
          <em>Affiliate &amp; creator links may earn rewards at no extra cost to you.</em>
        </span>
        <span style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <a class="rd-btn rd-btn--primary" href="https://potgrowhub.store/" target="_blank" rel="noopener noreferrer">PotGrowHub.store</a>
          <button type="button" class="rd-btn" id="rd-open-studio-cta">Launch Dream-It Studio</button>
        </span>
      `;
      document.getElementById('rd-open-studio-cta')?.addEventListener('click', () => {
        openPortalDialog('studio');
      });
    }

    const drawer = document.getElementById('monetization-sidebar-drawer');
    if (drawer) {
      drawer.innerHTML = '';
    }
  }

  function renderSpatialStage() {
    const hub = document.getElementById('ganjagroot-central-hub');
    if (!hub) return;
    hub.innerHTML = `
      <div class="rd-gravity-arena" id="rd-gravity-arena">
        <div class="rd-smoke-halo" aria-hidden="true"></div>
        <button type="button" class="rd-ganjagroot-avatar" id="ganjagroot-heading" aria-label="GanjaGroot central hub — click to open Discovery Nebula">
          <span style="font-size:2rem;" aria-hidden="true">🌿</span>
          <strong style="font-family:var(--font-display);font-size:0.92rem;color:var(--accent-green);">GANJAGROOT</strong>
          <span style="font-size:0.7rem;color:var(--text-secondary);">Gravity-Gone Core</span>
        </button>
        <div id="rd-portals-layer"></div>
      </div>
    `;

    document.getElementById('ganjagroot-heading')?.addEventListener('click', () => {
      openPortalDialog('discovery');
    });

    renderPortals();
  }

  function renderPortals() {
    const layer = document.getElementById('rd-portals-layer');
    if (!layer) return;

    layer.innerHTML = state.portals
      .map(
        (p) => `
          <button
            type="button"
            class="rd-floating-portal"
            data-portal-id="${p.id}"
            style="--portal-color:${p.color};transform:translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0);"
            aria-label="${p.title}: ${p.subtitle}. Drag, flick, or activate to open."
          >
            <div class="rd-floating-portal__title">${p.title}</div>
            <div class="rd-floating-portal__sub">${p.subtitle}</div>
          </button>
        `
      )
      .join('');

    layer.querySelectorAll('.rd-floating-portal').forEach((el) => {
      const id = el.dataset.portalId;
      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastY = 0;
      let lastT = 0;
      let moved = false;

      el.addEventListener('pointerdown', (e) => {
        pointerId = e.pointerId;
        el.setPointerCapture(pointerId);
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        lastT = performance.now();
        moved = false;
        const p = state.portals.find((item) => item.id === id);
        if (p) {
          p.isDragging = true;
          p.vx = 0;
          p.vy = 0;
        }
      });

      el.addEventListener('pointermove', (e) => {
        if (pointerId !== e.pointerId) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 7) {
          moved = true;
        }
        const dt = Math.max(8, now - lastT);
        const p = state.portals.find((item) => item.id === id);
        if (p) {
          p.x += dx;
          p.y += dy;
          p.vx = Math.max(-16, Math.min(16, (dx / dt) * 12));
          p.vy = Math.max(-16, Math.min(16, (dy / dt) * 12));
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
        }
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
      });

      el.addEventListener('pointerup', (e) => {
        if (pointerId !== e.pointerId) return;
        el.releasePointerCapture(pointerId);
        pointerId = null;
        const p = state.portals.find((item) => item.id === id);
        if (p) p.isDragging = false;
        safeWriteJSON(STORAGE_KEYS.portals, state.portals);
        if (moved) {
          completeQuest('q-flick');
        } else {
          openPortalDialog(id);
        }
      });
    });
  }

  function startPhysicsLoop() {
    const step = () => {
      const arena = document.getElementById('rd-gravity-arena');
      const layer = document.getElementById('rd-portals-layer');
      if (!state.reducedMotion && arena && layer) {
        const w = arena.clientWidth;
        const h = arena.clientHeight;
        const maxX = Math.max(90, w * 0.36);
        const maxY = Math.max(80, h * 0.32);

        state.portals.forEach((p) => {
          if (p.isDragging) return;
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.988;
          p.vy *= 0.988;
          if (Math.abs(p.vx) < 0.08) p.vx = (Math.sign(p.vx) || 1) * 0.08;
          if (Math.abs(p.vy) < 0.08) p.vy = (Math.sign(p.vy) || 1) * 0.08;

          if (p.x > maxX) {
            p.x = maxX;
            p.vx = -Math.abs(p.vx);
          } else if (p.x < -maxX) {
            p.x = -maxX;
            p.vx = Math.abs(p.vx);
          }

          if (p.y > maxY) {
            p.y = maxY;
            p.vy = -Math.abs(p.vy);
          } else if (p.y < -maxY) {
            p.y = -maxY;
            p.vy = Math.abs(p.vy);
          }

          const node = layer.querySelector(`[data-portal-id="${p.id}"]`);
          if (node) {
            node.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
          }
        });
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderSections() {
    const disc = document.getElementById('discovery-nebula-section');
    if (disc) {
      disc.innerHTML = `
        <div class="rd-section-header">
          <h2 id="discovery-heading" class="rd-section-title">Discovery Nebula</h2>
          <span class="rd-badge">Gravity-Gone Spatial Engine</span>
        </div>
        <div class="rd-grid">
          <article class="rd-card">
            <span class="rd-badge">Spatial Physics</span>
            <h3>Zero-Gravity Portal Navigation</h3>
            <p>Grab, drag, or flick any portal across the arena. Positions save locally and respect reduced-motion preferences.</p>
          </article>
          <article class="rd-card">
            <span class="rd-badge">Zero Inventory</span>
            <h3>"We Are The Socket" Model</h3>
            <p>Bridge ideas directly to Print-on-Demand and 3D Print-on-Demand partners with eco-conscious sourcing.</p>
          </article>
        </div>
      `;
    }

    const market = document.getElementById('ghost-marketplace-section');
    if (market) {
      market.innerHTML = `
        <div class="rd-section-header">
          <h2 id="marketplace-heading" class="rd-section-title">Ghost Marketplace</h2>
          <input type="search" class="rd-input" id="rd-market-filter" style="max-width:280px;" placeholder="Filter hemp, 3DPoD, gear..." aria-label="Filter marketplace catalog" />
        </div>
        <div class="rd-grid" id="rd-market-grid"></div>
      `;
      renderMarketItems('');
      document.getElementById('rd-market-filter')?.addEventListener('input', (e) => {
        renderMarketItems(e.target.value.trim().toLowerCase());
      });
    }

    const studio = document.getElementById('dream-it-studio-section');
    if (studio) {
      const savedDraft = safeReadJSON(STORAGE_KEYS.blueprintDraft, '');
      studio.innerHTML = `
        <div class="rd-section-header">
          <h2 id="studio-heading" class="rd-section-title">Dream-It 3DPoD &amp; POD Studio</h2>
          <span class="rd-badge">SVG + 3DPoD STL Spec</span>
        </div>
        <label for="rd-studio-prompt" class="sr-only">Describe your product or 3D print idea</label>
        <input type="text" id="rd-studio-prompt" class="rd-input" value="${savedDraft}" placeholder="Describe a hemp hoodie, rolling tray, or biodegradable 3D accessory..." />
        <div style="display:flex;gap:0.6rem;margin-top:0.75rem;flex-wrap:wrap;">
          <button type="button" class="rd-btn rd-btn--primary" id="rd-generate-blueprint-btn">Generate Blueprint (+75 Seeds)</button>
        </div>
        <div id="rd-blueprint-output" style="margin-top:0.85rem;"></div>
      `;
      document.getElementById('rd-generate-blueprint-btn')?.addEventListener('click', () => {
        const promptEl = document.getElementById('rd-studio-prompt');
        const outEl = document.getElementById('rd-blueprint-output');
        const idea = (promptEl?.value || '').trim();
        if (!idea || !outEl) return;
        safeWriteJSON(STORAGE_KEYS.blueprintDraft, idea);
        completeQuest('q-studio');
        outEl.innerHTML = `
          <div class="rd-card">
            <span class="rd-badge">Blueprint Ready (Human Review Required Before Order)</span>
            <h4>Concept: ${idea}</h4>
            <ul style="padding-left:1.2rem;font-size:0.88rem;">
              <li><strong>Apparel / POD Path:</strong> 300 DPI vector SVG on organic hemp/recycled cotton blank.</li>
              <li><strong>3DPoD Path:</strong> Watertight manifold STL/GLB mesh spec in biodegradable PLA+ (min 1.6mm wall).</li>
              <li><strong>Pricing Guardrail:</strong> Target 2.3x–2.8x base fulfillment cost before publishing.</li>
            </ul>
          </div>
        `;
      });
    }

    const xr = document.getElementById('webxr-ar-vr-stage-section');
    if (xr) {
      xr.innerHTML = `
        <div class="rd-section-header">
          <h2 id="webxr-heading" class="rd-section-title">WebXR AR / VR Showroom</h2>
          <span class="rd-badge">3D / AR Capable</span>
        </div>
        <p style="font-size:0.9rem;color:var(--text-secondary);">
          Inspect 3D models and AR product previews on compatible devices. Fallback 2D spatial cards stay active everywhere.
        </p>
      `;
    }

    const know = document.getElementById('knowledge-grove-section');
    if (know) {
      know.innerHTML = `
        <div class="rd-section-header">
          <h2 id="knowledge-heading" class="rd-section-title">Knowledge Grove</h2>
          <span class="rd-badge">AEO &amp; Offline RAG Ready</span>
        </div>
        <div class="rd-grid">
          ${KNOWLEDGE_ITEMS.map(
            (k) => `
              <article class="rd-card">
                <span class="rd-badge">${k.topic}</span>
                <h3>${k.title}</h3>
                <p style="font-size:0.88rem;color:var(--text-secondary);">${k.summary}</p>
              </article>
            `
          ).join('')}
        </div>
      `;
    }

    const rew = document.getElementById('gamification-rewards-section');
    if (rew) {
      rew.innerHTML = `
        <div class="rd-section-header">
          <h2 id="rewards-heading" class="rd-section-title">SmokeSeeds Quests &amp; Badges</h2>
          <span class="rd-badge">Gamification Active</span>
        </div>
        <div class="rd-grid">
          ${QUESTS.map((q) => {
            const done = state.gamification.completedQuests.includes(q.id);
            return `
              <article class="rd-card">
                <span class="rd-badge">${done ? 'Completed ✓' : `+${q.rewardSeeds} Seeds / +${q.rewardXp} XP`}</span>
                <h3>${q.label}</h3>
              </article>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  function renderMarketItems(filterText) {
    const grid = document.getElementById('rd-market-grid');
    if (!grid) return;
    const items = MARKETPLACE_CATALOG.filter(
      (it) =>
        !filterText ||
        it.name.toLowerCase().includes(filterText) ||
        it.category.toLowerCase().includes(filterText) ||
        it.mode.toLowerCase().includes(filterText)
    );
    grid.innerHTML = items
      .map(
        (it) => `
          <article class="rd-card">
            <span class="rd-badge">${it.mode}</span>
            <h3>${it.name}</h3>
            <p style="font-weight:700;color:var(--accent-gold);">${it.price}</p>
            <p style="font-size:0.84rem;color:var(--text-secondary);">${it.eco}</p>
            <button type="button" class="rd-btn rd-btn--primary" data-request-item="${it.id}">
              Request Verified Fulfillment Quote
            </button>
          </article>
        `
      )
      .join('');

    grid.querySelectorAll('[data-request-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = MARKETPLACE_CATALOG.find((x) => x.id === btn.dataset.requestItem);
        if (!item) return;
        openApprovalDialog(item);
      });
    });
  }

  function openPortalDialog(portalId) {
    const dlg = document.getElementById('active-portal-dialog');
    if (!dlg) return;
    const sectionMap = {
      discovery: 'discovery-nebula-section',
      marketplace: 'ghost-marketplace-section',
      studio: 'dream-it-studio-section',
      xr: 'webxr-ar-vr-stage-section',
      knowledge: 'knowledge-grove-section',
      rewards: 'gamification-rewards-section'
    };
    const portalMeta = PORTAL_DEFS.find((p) => p.id === portalId);
    dlg.className = 'rd-dialog';
    dlg.innerHTML = `
      <div class="rd-section-header">
        <h2 id="active-portal-dialog-title" class="rd-section-title">${portalMeta ? portalMeta.title : 'ReeferDude Portal'}</h2>
        <button type="button" class="rd-btn" id="rd-close-portal-btn">Close</button>
      </div>
      <p id="active-portal-dialog-desc" style="margin-bottom:1rem;color:var(--text-secondary);">
        ${portalMeta ? portalMeta.subtitle : 'Spatial module view'}
      </p>
      <div id="rd-portal-modal-body"></div>
    `;
    const sourceEl = document.getElementById(sectionMap[portalId]);
    const modalBody = document.getElementById('rd-portal-modal-body');
    if (sourceEl && modalBody) {
      modalBody.innerHTML = sourceEl.innerHTML;
    }
    document.getElementById('rd-close-portal-btn')?.addEventListener('click', closePortalDialog);
    if (!dlg.open) dlg.showModal();
  }

  function closePortalDialog() {
    const dlg = document.getElementById('active-portal-dialog');
    if (dlg && dlg.open) dlg.close();
  }

  function openApprovalDialog(item) {
    const dlg = document.getElementById('checkout-approval-dialog');
    if (!dlg) return;
    state.pendingApproval = item;
    dlg.className = 'rd-dialog';
    dlg.innerHTML = `
      <div class="rd-section-header">
        <h2 id="checkout-approval-title" class="rd-section-title">Human Approval Required</h2>
        <button type="button" class="rd-btn" id="rd-cancel-approval-btn">Cancel</button>
      </div>
      <p id="checkout-approval-desc" style="margin-bottom:0.85rem;color:var(--text-secondary);">
        No funds or supplier orders are submitted automatically. Confirm to stage a fulfillment request draft for:
      </p>
      <div class="rd-card" style="margin-bottom:1rem;">
        <strong>${item.name}</strong>
        <span>Estimated Price: ${item.price} (${item.mode})</span>
      </div>
      <div style="display:flex;gap:0.6rem;justify-content:flex-end;">
        <button type="button" class="rd-btn" id="rd-cancel-approval-btn-2">Keep Browsing</button>
        <button type="button" class="rd-btn rd-btn--primary" id="rd-confirm-approval-btn">Stage Approved Draft</button>
      </div>
    `;
    const closeFn = () => {
      state.pendingApproval = null;
      if (dlg.open) dlg.close();
    };
    document.getElementById('rd-cancel-approval-btn')?.addEventListener('click', closeFn);
    document.getElementById('rd-cancel-approval-btn-2')?.addEventListener('click', closeFn);
    document.getElementById('rd-confirm-approval-btn')?.addEventListener('click', () => {
      awardGamification(15, 10, `Staged draft for ${item.name}`);
      closeFn();
    });
    if (!dlg.open) dlg.showModal();
  }

  function setGuruMessage(text) {
    const dock = document.getElementById('ganjaguru-voice-dock');
    if (!dock) return;
    let feed = dock.querySelector('.rd-guru-feed');
    if (!feed) {
      feed = document.createElement('div');
      feed.className = 'rd-guru-feed';
      dock.querySelector('.rd-guru-inner')?.prepend(feed);
    }
    feed.innerHTML = `<strong>GanjaGuru AI:</strong> <span>${text}</span>`;
  }

  function renderGuruDock() {
    const dock = document.getElementById('ganjaguru-voice-dock');
    if (!dock) return;
    dock.innerHTML = `
      <div class="rd-guru-inner">
        <div class="rd-guru-feed" role="status" aria-live="polite">
          <strong>GanjaGuru AI:</strong>
          <span>Step into the Gravity-Gone cosmos. Ask about hemp gear, 3DPoD/POD blueprints, or flick a portal.</span>
        </div>
        <form id="ganjaguru-command-form" role="search" aria-label="Ask GanjaGuru AI">
          <input type="text" id="rd-guru-input" class="rd-input" placeholder="Ask GanjaGuru (e.g., '3dpod tray', 'hemp hoodie', 'offline ai')..." aria-label="Message GanjaGuru AI" />
          <button type="button" class="rd-btn" id="rd-guru-voice-btn" aria-label="Voice input">🎤 Voice</button>
          <button type="submit" class="rd-btn rd-btn--primary">Ask</button>
        </form>
      </div>
    `;

    const form = document.getElementById('ganjaguru-command-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('rd-guru-input');
      const q = (input?.value || '').trim();
      if (!q) return;
      completeQuest('q-guru');
      const lower = q.toLowerCase();
      let reply = `Got it—for "${q}", check Dream-It Studio for zero-inventory POD/3DPoD blueprints or Ghost Marketplace for eco-friendly gear.`;
      if (lower.includes('3d') || lower.includes('stl') || lower.includes('print') || lower.includes('studio')) {
        reply = 'Opening Dream-It Studio so you can generate a 3DPoD STL or hemp POD blueprint.';
        openPortalDialog('studio');
      } else if (lower.includes('hemp') || lower.includes('shop') || lower.includes('market') || lower.includes('tray')) {
        reply = 'Opening Ghost Marketplace with zero-inventory hemp and biodegradable 3DPoD items.';
        openPortalDialog('marketplace');
      } else if (lower.includes('ar') || lower.includes('vr') || lower.includes('xr')) {
        reply = 'Opening WebXR AR / VR Showroom details.';
        openPortalDialog('xr');
      }
      setGuruMessage(reply);
      if (input) input.value = '';
    });

    document.getElementById('rd-guru-voice-btn')?.addEventListener('click', () => {
      completeQuest('q-guru');
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        setGuruMessage('Speech recognition is not supported in this browser—type your prompt above.');
        return;
      }
      const rec = new SpeechRec();
      rec.lang = state.lang || 'en-US';
      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript || '';
        const input = document.getElementById('rd-guru-input');
        if (input) input.value = transcript;
        form?.requestSubmit();
      };
      rec.onerror = () => {
        setGuruMessage('Voice mic could not capture audio—check microphone permissions or type your prompt.');
      };
      rec.start();
    });
  }

  function renderAgeGate() {
    const dlg = document.getElementById('age-gate-modal');
    if (!dlg) return;
    dlg.className = 'rd-dialog';
    dlg.innerHTML = `
      <div class="rd-section-header">
        <h2 id="age-gate-title" class="rd-section-title">21+ Age Verification</h2>
      </div>
      <p id="age-gate-desc" style="margin-bottom:1.1rem;color:var(--text-secondary);">
        ReeferDude.com and PotGrowHub.store feature adult lifestyle, hemp, and accessory content. Confirm you are 21 years of age or older to enter.
      </p>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:flex-end;">
        <button type="button" class="rd-btn" id="rd-age-exit-btn">Exit (Under 21)</button>
        <button type="button" class="rd-btn rd-btn--primary" id="rd-age-confirm-btn">I Am 21 or Older — Enter</button>
      </div>
    `;

    document.getElementById('rd-age-confirm-btn')?.addEventListener('click', () => {
      state.ageVerified = true;
      document.body.dataset.ageVerified = 'true';
      safeWriteJSON(STORAGE_KEYS.ageVerified, { verified: true, at: Date.now() });
      if (dlg.open) dlg.close();
      announce('Age 21+ verified. Welcome to ReeferDude.');
    });

    document.getElementById('rd-age-exit-btn')?.addEventListener('click', () => {
      window.location.href = 'https://www.google.com/';
    });

    if (!state.ageVerified && !dlg.open) {
      dlg.showModal();
    }
  }

  function renderCookieConsent() {
    const banner = document.getElementById('cookie-consent-banner');
    const prefsDlg = document.getElementById('cookie-preferences-modal');
    if (!banner || !prefsDlg) return;

    const gpcActive = Boolean(navigator.globalPrivacyControl);
    banner.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.85rem;">
        <div style="max-width:620px;">
          <strong>Privacy &amp; Cookie Consent</strong>
          <p style="font-size:0.84rem;color:var(--text-secondary);">
            Essential storage keeps Gravity-Gone portals and quests working offline.
            ${gpcActive ? 'Global Privacy Control (GPC) signal detected.' : 'Manage analytics and ad/personalization cookies below.'}
          </p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" class="rd-btn" id="rd-cookie-reject-btn">Essential Only</button>
          <button type="button" class="rd-btn" id="rd-cookie-manage-btn">Preferences</button>
          <button type="button" class="rd-btn rd-btn--primary" id="rd-cookie-accept-btn">Accept All</button>
        </div>
      </div>
    `;

    prefsDlg.className = 'rd-dialog';
    prefsDlg.innerHTML = `
      <div class="rd-section-header">
        <h2 id="cookie-prefs-title" class="rd-section-title">Cookie &amp; Consent Preferences</h2>
        <button type="button" class="rd-btn" id="rd-cookie-close-btn">Close</button>
      </div>
      <p id="cookie-prefs-desc" style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:1rem;">
        Updates Google Consent Mode v2 signals immediately.
      </p>
      <div style="display:grid;gap:0.75rem;margin-bottom:1.15rem;">
        <label class="rd-card" style="flex-direction:row;align-items:center;">
          <input type="checkbox" checked disabled />
          <span><strong>Strictly Necessary</strong> — Offline state, 21+ check, and portal orbits.</span>
        </label>
        <label class="rd-card" style="flex-direction:row;align-items:center;">
          <input type="checkbox" id="rd-pref-analytics" ${state.consent.analytics ? 'checked' : ''} />
          <span><strong>Analytics</strong> — Anonymous performance and feature usage metrics.</span>
        </label>
        <label class="rd-card" style="flex-direction:row;align-items:center;">
          <input type="checkbox" id="rd-pref-marketing" ${state.consent.marketing ? 'checked' : ''} />
          <span><strong>Ads &amp; Attribution</strong> — AdSense/affiliate measurement (respected if GPC is active).</span>
        </label>
        <label class="rd-card" style="flex-direction:row;align-items:center;">
          <input type="checkbox" id="rd-pref-personalization" ${state.consent.personalization ? 'checked' : ''} />
          <span><strong>Personalization</strong> — Tailored recommendations and language preferences.</span>
        </label>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.6rem;">
        <button type="button" class="rd-btn rd-btn--primary" id="rd-cookie-save-btn">Save Preferences</button>
      </div>
    `;

    const saveAndHide = (nextConsent) => {
      state.consent = { ...nextConsent, timestamp: Date.now() };
      safeWriteJSON(STORAGE_KEYS.consent, state.consent);
      updateConsentMode(state.consent);
      banner.classList.remove('is-visible');
      if (prefsDlg.open) prefsDlg.close();
    };

    document.getElementById('rd-cookie-accept-btn')?.addEventListener('click', () => {
      saveAndHide({
        necessary: true,
        analytics: true,
        marketing: !gpcActive,
        personalization: true
      });
    });

    document.getElementById('rd-cookie-reject-btn')?.addEventListener('click', () => {
      saveAndHide({
        necessary: true,
        analytics: false,
        marketing: false,
        personalization: false
      });
    });

    document.getElementById('rd-cookie-manage-btn')?.addEventListener('click', () => {
      if (!prefsDlg.open) prefsDlg.showModal();
    });

    document.getElementById('rd-cookie-close-btn')?.addEventListener('click', () => {
      if (prefsDlg.open) prefsDlg.close();
    });

    document.getElementById('rd-cookie-save-btn')?.addEventListener('click', () => {
      saveAndHide({
        necessary: true,
        analytics: Boolean(document.getElementById('rd-pref-analytics')?.checked),
        marketing: gpcActive ? false : Boolean(document.getElementById('rd-pref-marketing')?.checked),
        personalization: Boolean(document.getElementById('rd-pref-personalization')?.checked)
      });
    });

    if (!state.consent.timestamp) {
      banner.classList.add('is-visible');
    } else {
      updateConsentMode(state.consent);
    }
  }

  function renderFooter() {
    const footer = document.getElementById('ecosystem-footer');
    const nav = document.getElementById('footer-compliance-nav');
    if (!footer || !nav) return;

    const heading = footer.querySelector('h2') || document.createElement('h2');
    heading.className = 'rd-section-title';
    heading.style.fontSize = '1.05rem';
    heading.textContent = 'ReeferDude.com & PotGrowHub.store — Ecosystem & Compliance';
    if (!heading.parentNode) footer.prepend(heading);

    nav.innerHTML = `
      <a href="/sitemap.xml">Sitemap XML</a>
      <a href="/robots.txt">Robots.txt</a>
      <a href="/SEO.txt">SEO.txt</a>
      <a href="/AEO.txt">AEO.txt</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="/humans.txt">humans.txt</a>
      <a href="/.well-known/security.txt">security.txt</a>
      <a href="/manifest.json">manifest.json</a>
      <a href="/ads.txt">ads.txt</a>
      <button type="button" class="rd-btn rd-btn--ghost" id="rd-footer-cookie-btn">Cookie Settings</button>
      <button type="button" class="rd-btn rd-btn--ghost" id="rd-footer-age-btn">21+ Age Gate</button>
    `;

    document.getElementById('rd-footer-cookie-btn')?.addEventListener('click', () => {
      const prefsDlg = document.getElementById('cookie-preferences-modal');
      if (prefsDlg && !prefsDlg.open) prefsDlg.showModal();
    });

    document.getElementById('rd-footer-age-btn')?.addEventListener('click', () => {
      const ageDlg = document.getElementById('age-gate-modal');
      if (ageDlg && !ageDlg.open) ageDlg.showModal();
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Service worker registration skipped if served over non-secure file protocol
        });
      });
    }
  }

  function init() {
    const savedAge = safeReadJSON(STORAGE_KEYS.ageVerified, null);
    state.ageVerified = Boolean(savedAge && savedAge.verified);
    document.body.dataset.ageVerified = String(state.ageVerified);

    state.consent = { ...DEFAULT_CONSENT, ...safeReadJSON(STORAGE_KEYS.consent, {}) };
    state.gamification = { ...DEFAULT_GAMIFICATION, ...safeReadJSON(STORAGE_KEYS.gamification, {}) };
    const savedPortals = safeReadJSON(STORAGE_KEYS.portals, null);
    if (Array.isArray(savedPortals) && savedPortals.length === PORTAL_DEFS.length) {
      state.portals = savedPortals.map((p) => ({ ...p, isDragging: false }));
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.reducedMotion = Boolean(safeReadJSON(STORAGE_KEYS.reducedMotion, prefersReduced));
    state.theme = safeReadJSON(STORAGE_KEYS.theme, 'gravity-gone-dark');
    state.lang = safeReadJSON(STORAGE_KEYS.lang, 'en');
    document.documentElement.lang = state.lang;

    applyMotionAndTheme();
    renderTopHUD();
    renderGamificationHUD();
    renderMonetizationSlots();
    renderSpatialStage();
    renderSections();
    renderGuruDock();
    renderFooter();
    renderCookieConsent();
    renderAgeGate();
    startPhysicsLoop();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

