/* =====================================================================
   AC-Solver Web — Main JavaScript
   ===================================================================== */

// =====================================================================
// 1. Hero Particles Animation
// =====================================================================

function initParticles() {
    const container = document.getElementById('hero-particles');
    if (!container) return;

    const COUNT = 40;
    for (let i = 0; i < COUNT; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 3 + 1;
        particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${Math.random() > 0.5 ? 'rgba(79,140,255,0.4)' : 'rgba(168,85,247,0.3)'};
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${8 + Math.random() * 12}s ease-in-out infinite;
      animation-delay: ${Math.random() * -10}s;
      pointer-events: none;
    `;
        container.appendChild(particle);
    }

    // Add float keyframes
    const style = document.createElement('style');
    style.textContent = `
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
      25% { transform: translate(${Math.random() * 40 - 20}px, -30px) scale(1.2); opacity: 0.6; }
      50% { transform: translate(${Math.random() * 60 - 30}px, -10px) scale(0.8); opacity: 0.4; }
      75% { transform: translate(${Math.random() * 40 - 20}px, 20px) scale(1.1); opacity: 0.5; }
    }
  `;
    document.head.appendChild(style);
}


// =====================================================================
// 2. AC Environment Interactive Demo
// =====================================================================

const SYMBOL_MAP = { 1: 'x', '-1': 'x⁻¹', 2: 'y', '-2': 'y⁻¹', 0: '0' };
const TOKEN_CLASS = { 1: 'tok-x', '-1': 'tok-xinv', 2: 'tok-y', '-2': 'tok-yinv', 0: 'tok-pad' };

// Example initial presentation: MS(1, y) = ⟨ x, y | x⁻¹yx y⁻², x⁻¹ y ⟩
const INITIAL_PRESENTATION = {
    r0: [-1, 2, 1, -2, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    r1: [-1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

let state = {
    r0: [...INITIAL_PRESENTATION.r0],
    r1: [...INITIAL_PRESENTATION.r1],
    history: [],
    maxLen: 18, // max relator length
};

function getRelatorLength(r) {
    return r.filter(v => v !== 0).length;
}

function simplifyRelator(r) {
    // Free reduction: remove adjacent inverse pairs
    let changed = true;
    let arr = r.filter(v => v !== 0);
    while (changed) {
        changed = false;
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] + arr[i + 1] === 0) {
                arr.splice(i, 2);
                changed = true;
                break;
            }
        }
    }
    // Pad back
    while (arr.length < state.maxLen) arr.push(0);
    return arr.slice(0, state.maxLen);
}

function concatenateRelators(target, other, invertOther) {
    const tLen = getRelatorLength(target);
    const oArr = other.filter(v => v !== 0);
    const oProcessed = invertOther ? oArr.reverse().map(v => -v) : [...oArr];

    const result = [...target.filter(v => v !== 0), ...oProcessed];
    // Pad/truncate
    while (result.length < state.maxLen) result.push(0);
    if (result.length > state.maxLen) return null; // overflow
    return simplifyRelator(result);
}

function conjugateRelator(r, gen) {
    const arr = r.filter(v => v !== 0);
    const result = [gen, ...arr, -gen];
    while (result.length < state.maxLen) result.push(0);
    if (result.filter(v => v !== 0).length > state.maxLen) return null;
    return simplifyRelator(result);
}

const MOVE_DESCRIPTIONS = [
    'r₁ → r₁·r₀', 'r₀ → r₀·r₁⁻¹', 'r₁ → r₁·r₀⁻¹', 'r₀ → r₀·r₁',
    'r₁ → x⁻¹r₁x', 'r₀ → y⁻¹r₀y', 'r₁ → y⁻¹r₁y', 'r₀ → xr₀x⁻¹',
    'r₁ → xr₁x⁻¹', 'r₀ → yr₀y⁻¹', 'r₁ → yr₁y⁻¹', 'r₀ → x⁻¹r₀x',
];

function applyMove(moveId) {
    // Save state for undo
    state.history.push({ r0: [...state.r0], r1: [...state.r1] });

    let result;
    switch (moveId) {
        case 0: result = concatenateRelators(state.r1, state.r0, false); if (result) state.r1 = result; break;
        case 1: result = concatenateRelators(state.r0, state.r1, true); if (result) state.r0 = result; break;
        case 2: result = concatenateRelators(state.r1, state.r0, true); if (result) state.r1 = result; break;
        case 3: result = concatenateRelators(state.r0, state.r1, false); if (result) state.r0 = result; break;
        case 4: result = conjugateRelator(state.r1, -1); if (result) state.r1 = result; break;
        case 5: result = conjugateRelator(state.r0, -2); if (result) state.r0 = result; break;
        case 6: result = conjugateRelator(state.r1, -2); if (result) state.r1 = result; break;
        case 7: result = conjugateRelator(state.r0, 1); if (result) state.r0 = result; break;
        case 8: result = conjugateRelator(state.r1, 1); if (result) state.r1 = result; break;
        case 9: result = conjugateRelator(state.r0, 2); if (result) state.r0 = result; break;
        case 10: result = conjugateRelator(state.r1, 2); if (result) state.r1 = result; break;
        case 11: result = conjugateRelator(state.r0, -1); if (result) state.r0 = result; break;
    }

    updateDisplay();
    addHistoryEntry(moveId);
}

function updateDisplay() {
    const r0Container = document.getElementById('r0-tokens');
    const r1Container = document.getElementById('r1-tokens');
    if (!r0Container || !r1Container) return;

    r0Container.innerHTML = '';
    r1Container.innerHTML = '';

    const renderTokens = (arr, container) => {
        const nonZero = arr.filter(v => v !== 0);
        if (nonZero.length === 0) {
            const span = document.createElement('span');
            span.className = 'token tok-pad';
            span.textContent = 'ε';
            container.appendChild(span);
            return;
        }
        nonZero.forEach((v, i) => {
            const span = document.createElement('span');
            span.className = `token ${TOKEN_CLASS[v]}`;
            span.textContent = SYMBOL_MAP[v];
            span.style.animationDelay = `${i * 30}ms`;
            container.appendChild(span);
        });
    };

    renderTokens(state.r0, r0Container);
    renderTokens(state.r1, r1Container);

    const totalLen = getRelatorLength(state.r0) + getRelatorLength(state.r1);
    const lengthEl = document.getElementById('state-length');
    if (lengthEl) lengthEl.innerHTML = `Total length: <strong>${totalLen}</strong>`;

    const trivialEl = document.getElementById('state-trivial');
    if (trivialEl) {
        if (totalLen === 2 && getRelatorLength(state.r0) === 1 && getRelatorLength(state.r1) === 1) {
            trivialEl.classList.remove('hidden');
        } else {
            trivialEl.classList.add('hidden');
        }
    }
}

function addHistoryEntry(moveId) {
    const list = document.getElementById('history-list');
    if (!list) return;

    const entry = document.createElement('div');
    entry.className = 'history-item';
    const step = state.history.length;
    const totalLen = getRelatorLength(state.r0) + getRelatorLength(state.r1);
    entry.textContent = `Step ${step}: ${MOVE_DESCRIPTIONS[moveId]} → len=${totalLen}`;
    list.insertBefore(entry, list.firstChild);
}

function initEnvironment() {
    // Bind move buttons
    document.querySelectorAll('.move-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const moveId = parseInt(btn.dataset.move);
            applyMove(moveId);
        });
    });

    // Reset button
    document.getElementById('reset-btn')?.addEventListener('click', () => {
        state.r0 = [...INITIAL_PRESENTATION.r0];
        state.r1 = [...INITIAL_PRESENTATION.r1];
        state.history = [];
        document.getElementById('history-list').innerHTML = '';
        updateDisplay();
    });

    // Random move button
    document.getElementById('random-btn')?.addEventListener('click', () => {
        const moveId = Math.floor(Math.random() * 12);
        applyMove(moveId);
    });

    // Undo button
    document.getElementById('undo-btn')?.addEventListener('click', () => {
        if (state.history.length === 0) return;
        const prev = state.history.pop();
        state.r0 = prev.r0;
        state.r1 = prev.r1;
        updateDisplay();
        const list = document.getElementById('history-list');
        if (list && list.firstChild) list.removeChild(list.firstChild);
    });

    updateDisplay();
}


// =====================================================================
// 3. Dataset Charts (SVG-based)
// =====================================================================

const DATASET_N_COUNTS = {
    1: { total: 8, solved: 8, unsolved: 0 },
    2: { total: 28, solved: 22, unsolved: 6 },
    3: { total: 68, solved: 56, unsolved: 12 },
    4: { total: 132, solved: 87, unsolved: 45 },
    5: { total: 212, solved: 110, unsolved: 102 },
    6: { total: 324, solved: 130, unsolved: 194 },
    7: { total: 418, solved: 120, unsolved: 298 },
};

function createBarChart(containerId, data, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ns = Object.keys(data).map(Number);
    const maxVal = Math.max(...ns.map(n => data[n].total));

    const chartHTML = `
    <div style="height: 100%; display: flex; flex-direction: column; justify-content: flex-end;">
      <div style="flex: 1; display: flex; align-items: flex-end; gap: 12px; padding: 0 8px;">
        ${ns.map(n => {
        const d = data[n];
        const totalH = (d.total / maxVal) * 100;

        if (type === 'distribution') {
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <span style="font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary);">${d.total}</span>
                <div style="width: 100%; max-width: 50px; height: ${totalH}%; border-radius: 4px 4px 0 0; background: #1a1a1a; opacity: 0.15; transition: height 0.5s ease;"></div>
              </div>
            `;
        } else {
            const solvedH = (d.solved / maxVal) * 100;
            const unsolvedH = (d.unsolved / maxVal) * 100;
            return `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <span style="font-size: 10px; font-family: var(--font-mono); color: #16a34a;">${d.solved}</span>
                <span style="font-size: 10px; font-family: var(--font-mono); color: #dc2626;">${d.unsolved}</span>
                <div style="width: 100%; max-width: 50px; display: flex; flex-direction: column; gap: 2px;">
                  <div style="height: ${unsolvedH * 0.9}px; min-height: 2px; border-radius: 3px 3px 0 0; background: #dc2626; opacity: 0.6;"></div>
                  <div style="height: ${solvedH * 0.9}px; min-height: 2px; border-radius: 0 0 3px 3px; background: #16a34a; opacity: 0.6;"></div>
                </div>
              </div>
            `;
        }
    }).join('')}
      </div>
      <div style="display: flex; gap: 12px; padding: 8px; border-top: 1px solid var(--border); margin-top: 8px;">
        ${ns.map(n => `
          <div style="flex: 1; text-align: center; font-size: 12px; font-weight: 600; color: var(--text-muted); font-family: var(--font-mono);">n=${n}</div>
        `).join('')}
      </div>
    </div>
  `;

    container.innerHTML = chartHTML;
}

function initCharts() {
    createBarChart('chart-n-distribution', DATASET_N_COUNTS, 'distribution');
    createBarChart('chart-solvability', DATASET_N_COUNTS, 'solvability');
}


// =====================================================================
// 4. t-SNE Image Tab Switcher
// =====================================================================

function initTSNE() {
    const btns = document.querySelectorAll('.tsne-tab-btn');
    const panels = document.querySelectorAll('.tsne-tab-panel');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            btns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tsne-tab-${target}`)?.classList.add('active');
        });
    });
}


// =====================================================================
// 5. Smooth Navigation
// =====================================================================

function initNavigation() {
    // Active link tracking
    const sections = document.querySelectorAll('.section, #hero');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${id}`;
                    link.style.color = isActive ? 'var(--text)' : '';
                    link.style.background = isActive ? 'var(--bg-muted)' : '';
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));

    // Scroll-triggered animations
    const animatedElements = document.querySelectorAll('.overview-card, .data-card, .approach-card, .paper-img-card');
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        animObserver.observe(el);
    });
}


// =====================================================================
// 6. Counter Animation
// =====================================================================

function animateCounters() {
    const counters = {
        'stat-presentations': { target: 1190, suffix: '', prefix: '' },
        'stat-dataset': { target: 1.83, suffix: 'M', prefix: '' },
        'stat-params': { target: 25.7, suffix: 'M', prefix: '' },
        'stat-f1': { target: 0.962, suffix: '', prefix: '' },
    };

    Object.entries(counters).forEach(([id, config]) => {
        const el = document.getElementById(id);
        if (!el) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    let current = 0;
                    const duration = 1500;
                    const start = performance.now();

                    const animate = (now) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        current = config.target * eased;

                        if (config.target >= 100) {
                            el.textContent = Math.round(current).toLocaleString() + config.suffix;
                        } else if (config.target >= 10) {
                            el.textContent = current.toFixed(1) + config.suffix;
                        } else {
                            el.textContent = current.toFixed(3) + config.suffix;
                        }

                        if (progress < 1) requestAnimationFrame(animate);
                    };

                    requestAnimationFrame(animate);
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(el);
    });
}


// =====================================================================
// 7. Theme Toggle
// =====================================================================


function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const root = document.documentElement;

    // Restore saved preference, or detect system preference
    const saved = localStorage.getItem('ac-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        root.setAttribute('data-theme', 'dark');
    }

    btn?.addEventListener('click', () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('ac-theme', next);
    });
}



document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initParticles();
    initNavigation();
    initEnvironment();
    initCharts();
    initTSNE();
    animateCounters();

    console.log('AC-Solver Web initialized ✓');
});
