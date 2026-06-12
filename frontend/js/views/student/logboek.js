/**
 * student/logboek.js — Overzicht logboeken voor de student
 *
 * Haalt de stage en de logboeken van de ingelogde student op uit de backend
 * en groepeert de dagvermeldingen per stageweek. Toont per week het aantal
 * ingevulde dagen, het aantal taken, de status en de mentorfeedback.
 */

import { apiFetch } from '../../api.js';

const DAGEN_PWEEK = 5;            // werkdagen per week
const STANDAARD_WEKEN = 12;       // fallback als er geen einddatum is

/* ── Hulpfuncties ── */

// Weeknummer van een datum t.o.v. de startdatum van de stage (week 1 = startweek).
function weeknummer(datum, start) {
  const dagen = Math.floor((new Date(datum) - new Date(start)) / 86400000);
  return Math.max(1, Math.floor(dagen / 7) + 1);
}

// Huidige stageweek; begint bij 1 en loopt vanzelf per kalenderweek op.
function huidigeWeek(start, totaal) {
  const dagen = Math.floor((new Date() - new Date(start)) / 86400000);
  const week  = Math.floor(dagen / 7) + 1;
  return Math.min(Math.max(week, 1), totaal);
}

// `taken` kan als JSON-string of array uit de DB komen.
function parseTaken(taken) {
  if (Array.isArray(taken)) return taken;
  if (!taken) return [];
  try { const v = JSON.parse(taken); return Array.isArray(v) ? v : [v]; }
  catch { return [taken]; }
}

const STATUS = {
  open:        { klasse: 'afgekeurd',   label: 'Nog niet ingediend' },
  feedback:    { klasse: 'actief',      label: 'Feedback ontvangen' },
  goedgekeurd: { klasse: 'goedgekeurd', label: 'Goedgekeurd'        },
};

/* ── Demo-data (fallback wanneer de backend/database niet bereikbaar is) ── */
const DEMO_STAGE = { id: 0, start_datum: '2026-05-18', eind_datum: '2026-08-10' };

function demoLogs() {
  const mk = (datum, n, getekend, opm) => ({
    datum,
    taken: Array.from({ length: n }, (_, i) => ({ titel: `Taak ${i + 1}`, omschrijving: '' })),
    mentor_getekend: getekend ? 1 : 0,
    mentor_opmerking: opm || null,
  });
  return [
    // Week 1 — goedgekeurd
    mk('2026-05-18', 2, 1), mk('2026-05-19', 1, 1), mk('2026-05-20', 2, 1), mk('2026-05-21', 1, 1), mk('2026-05-22', 1, 1, 'Goede start'),
    // Week 2 — goedgekeurd
    mk('2026-05-25', 1, 1), mk('2026-05-26', 2, 1), mk('2026-05-27', 1, 1), mk('2026-05-28', 1, 1), mk('2026-05-29', 1, 1, 'Taken correct uitgevoerd'),
    // Week 3 — feedback ontvangen
    mk('2026-06-01', 2, 0), mk('2026-06-02', 2, 0), mk('2026-06-03', 1, 0, 'Meer initiatief nemen'), mk('2026-06-04', 2, 0), mk('2026-06-05', 1, 0),
    // Week 4 — nog niet ingediend
    mk('2026-06-08', 2, 0), mk('2026-06-09', 1, 0), mk('2026-06-10', 2, 0), mk('2026-06-11', 1, 0),
  ];
}

export function render() {
  return `
    <div class="view-header">
      <h1 class="view-titel">Overzicht logboeken</h1>
      <p class="view-subtitel">Houd per week je stage-activiteiten en feedback bij.</p>
      <p class="melding" id="logNotice" style="display:none"></p>
    </div>

    <div class="stat-rij">
      <div class="stat-kaart"><div class="stat-kaart__info">
        <span class="stat-kaart__getal" id="statHuidige">—</span>
        <span class="stat-kaart__label">Huidige week</span>
      </div></div>
      <div class="stat-kaart"><div class="stat-kaart__info">
        <span class="stat-kaart__getal" id="statDeze">—</span>
        <span class="stat-kaart__label">Deze week ingevuld</span>
      </div></div>
      <div class="stat-kaart"><div class="stat-kaart__info">
        <span class="stat-kaart__getal" id="statTotaal">—</span>
        <span class="stat-kaart__label">Totaal logboeken</span>
      </div></div>
      <div class="stat-kaart"><div class="stat-kaart__info">
        <span class="stat-kaart__getal" id="statFeedback">—</span>
        <span class="stat-kaart__label">Laatste feedback</span>
      </div></div>
    </div>

    <div class="kaart">
      <div class="tabel-wrapper">
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Logboeken</th>
              <th>Items</th>
              <th>Status</th>
              <th>Mentorfeedback</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody id="logTabelBody">
            <tr><td colspan="6" class="tekst-muted">Laden…</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="view-acties">
      <a href="#student/logboek-nieuw" class="btn btn--primair">Nieuw logboek invullen</a>
    </div>
  `;
}

export async function init() {
  const tbody = document.getElementById('logTabelBody');
  const setStat = (id, waarde) => {
    const el = document.getElementById(id);
    if (el) el.textContent = waarde;
  };
  const toonMelding = (tekst) => {
    tbody.innerHTML = `<tr><td colspan="6" class="tekst-muted">${tekst}</td></tr>`;
  };

  // Probeer de echte database; val terug op demo-data als de backend niet draait.
  let stage, logs, demoModus = false;
  try {
    const stages = await apiFetch('/stages/mijn');
    stage = Array.isArray(stages) ? stages[0] : null;
    if (!stage || !stage.start_datum) throw new Error('geen stage');
    logs = (await apiFetch('/logboeken/mijn')) || [];
  } catch {
    demoModus = true;
    stage = DEMO_STAGE;
    logs  = demoLogs();
  }

  if (demoModus) {
    const notice = document.getElementById('logNotice');
    if (notice) {
      notice.style.display = '';
      notice.textContent = 'Demo-gegevens — backend/database niet bereikbaar. Start de backend voor echte data.';
    }
  }

  try {
    const start  = stage.start_datum;
    const totaal = stage.eind_datum
      ? Math.max(1, Math.ceil((new Date(stage.eind_datum) - new Date(start)) / (86400000 * 7)))
      : STANDAARD_WEKEN;
    const nu = huidigeWeek(start, totaal);

    // Groepeer per week
    const perWeek = new Map();
    for (const log of (logs || [])) {
      const w = weeknummer(log.datum, start);
      if (!perWeek.has(w)) perWeek.set(w, []);
      perWeek.get(w).push(log);
    }

    // ── Stat-kaarten ──
    setStat('statHuidige', `Week ${nu} / ${totaal}`);
    setStat('statDeze', `${(perWeek.get(nu) || []).length} / ${DAGEN_PWEEK} dagen`);
    setStat('statTotaal', `${(logs || []).length} / ${totaal * DAGEN_PWEEK}`);

    let laatsteFeedbackWeek = null;
    for (const [w, entries] of perWeek) {
      if (entries.some(e => e.mentor_opmerking)) {
        laatsteFeedbackWeek = laatsteFeedbackWeek === null ? w : Math.max(laatsteFeedbackWeek, w);
      }
    }
    setStat('statFeedback', laatsteFeedbackWeek ? `Week ${laatsteFeedbackWeek}` : '—');

    // ── Tabel (week nu → 1, nieuwste boven) ──
    const maxWeek = Math.max(nu, ...perWeek.keys());
    const rijen = [];
    for (let w = maxWeek; w >= 1; w--) {
      const entries = perWeek.get(w) || [];
      const items   = entries.reduce((s, e) => s + parseTaken(e.taken).length, 0);

      let status;
      if (entries.length === 0)                          status = 'open';
      else if (entries.every(e => e.mentor_getekend))    status = 'goedgekeurd';
      else if (entries.some(e => e.mentor_opmerking))    status = 'feedback';
      else                                               status = 'open';

      const st = STATUS[status];
      const feedback = entries.map(e => e.mentor_opmerking).filter(Boolean).slice(-1)[0] || '—';
      const details = status === 'goedgekeurd'
        ? '<span class="tekst-muted">Ingediend</span>'
        : `<a href="#student/logboek-nieuw" class="tabel-link">${entries.length ? 'Verder aanvullen' : 'Invullen'}</a>`;

      rijen.push(`
        <tr>
          <td>Week ${w}</td>
          <td>${Math.min(entries.length, DAGEN_PWEEK)} / ${DAGEN_PWEEK}</td>
          <td>${items}</td>
          <td><span class="badge badge--${st.klasse}">${st.label}</span></td>
          <td>${feedback}</td>
          <td>${details}</td>
        </tr>
      `);
    }

    tbody.innerHTML = rijen.join('') ||
      '<tr><td colspan="6" class="tekst-muted">Nog geen logboeken ingevuld.</td></tr>';

  } catch (err) {
    toonMelding(`Kon logboeken niet laden: ${err?.fout || err?.message || 'onbekende fout'}`);
  }
}
