/**
 * router.js — Hash-based SPA-router
 *
 * Laadt dynamisch de juiste view op basis van location.hash:
 *   app.html#student/dashboard  →  js/views/student/dashboard.js
 *
 * Elk view-bestand exporteert:
 *   render()  → HTML-string (verplicht)
 *   init()    → wordt aangeroepen na innerHTML-injectie (optioneel)
 */

import { store }                   from './store.js';
import { buildHeader, buildSidebar } from './layout.js';

/* ── Route-tabel ── */
const ROUTES = {
  /* Student */
  'student/dashboard':      () => import('./views/student/dashboard.js'),
  'student/stage-indienen': () => import('./views/student/stage-indienen.js'),
  'student/logboek':        () => import('./views/student/logboek.js'),
  'student/logboek-nieuw':  () => import('./views/student/logboek-nieuw.js'),
  'student/evaluatie':      () => import('./views/student/evaluatie.js'),

  /* Docent */
  'docent/dashboard':  () => import('./views/docent/dashboard.js'),
  'docent/studenten':  () => import('./views/docent/studenten.js'),
  'docent/logboeken':  () => import('./views/docent/logboeken.js'),
  'docent/evaluatie':  () => import('./views/docent/evaluatie.js'),

  /* Stagecommissie */
  'stagecommissie/dashboard':    () => import('./views/stagecommissie/dashboard.js'),
  'stagecommissie/aanvragen':    () => import('./views/stagecommissie/aanvragen.js'),
  'stagecommissie/competenties': () => import('./views/stagecommissie/competenties.js'),

  /* Mentor */
  'mentor/dashboard': () => import('./views/mentor/dashboard.js'),
  'mentor/logboeken': () => import('./views/mentor/logboeken.js'),
  'mentor/evaluatie': () => import('./views/mentor/evaluatie.js'),

  /* Admin */
  'admin/dashboard':  () => import('./views/admin/dashboard.js'),
  'admin/gebruikers': () => import('./views/admin/gebruikers.js'),
  'admin/stages':     () => import('./views/admin/stages.js'),
};

/* ── Terugknop (globaal beschikbaar voor onclick in HTML-strings) ── */
window.__terug = function () {
  store.clear();
  window.location.href = '/index.html';
};

/* ── Hoofd-navigatiefunctie ── */
async function navigate() {
  const rol = store.rol;

  /* Geen rol → terug naar keuze-pagina */
  if (!rol) {
    window.location.href = '/index.html';
    return;
  }

  /* Bepaal actieve hash */
  const hash = location.hash.replace('#', '') || `${rol}/dashboard`;

  /* Rol-css inladen */
  const rolCss = document.getElementById('rol-css');
  if (rolCss) rolCss.href = `/css/${rol}.css`;

  /* Header & sidebar opbouwen */
  const headerSlot  = document.getElementById('header-slot');
  const sidebarSlot = document.getElementById('sidebar-slot');
  if (headerSlot)  headerSlot.innerHTML  = buildHeader(rol);
  if (sidebarSlot) sidebarSlot.innerHTML = buildSidebar(rol, hash);

  /* Actieve nav-items markeren na klikken */
  sidebarSlot?.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('actief', a.dataset.hash === hash);
  });

  /* View laden */
  const viewSlot = document.getElementById('view-slot');
  const loader   = ROUTES[hash];

  if (!loader) {
    viewSlot.innerHTML = `
      <div class="view-fout">
        <h2>404 — Pagina niet gevonden</h2>
        <p>De route <code>${hash}</code> bestaat niet.</p>
        <a href="#${rol}/dashboard" class="btn">Ga naar dashboard</a>
      </div>`;
    return;
  }

  /* Laad-indicator */
  viewSlot.innerHTML = `<div class="view-loading"><span>Laden…</span></div>`;

  try {
    const mod = await loader();
    viewSlot.innerHTML = mod.render();
    if (typeof mod.init === 'function') mod.init();
  } catch (err) {
    console.error('View-fout:', err);
    viewSlot.innerHTML = `
      <div class="view-fout">
        <h2>Er ging iets mis</h2>
        <p>${err?.message ?? 'Onbekende fout'}</p>
      </div>`;
  }
}

/* ── Event-listeners ── */
window.addEventListener('hashchange', navigate);
navigate();
