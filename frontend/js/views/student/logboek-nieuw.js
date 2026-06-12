/**
 * student/logboek-nieuw.js — Logboek invullen (detailpagina)
 *
 * De student vult per stagedag:
 *   - logboekgegevens (datum + week)
 *   - één of meer uitgevoerde taken (dynamisch toe te voegen)
 *   - reflectie en problemen / leerpunten
 *
 * "Logboek indienen"  → POST /api/logboeken (opslaan in de database)
 * "Opslaan als concept" → lokaal opslaan (localStorage) zodat je later verder kunt.
 */

import { apiFetch } from '../../api.js';

const CONCEPT_KEY = 'logboek-concept';

let STAGE = null;       // actieve stage van de student (voor stage_id + weekberekening)
let DEMO_MODUS = false;  // true wanneer de backend niet bereikbaar is

const DEMO_STAGE = { id: 0, start_datum: '2026-05-18', eind_datum: '2026-08-10' };

/* Eén taak-kaartje. `n` is enkel het zichtbare volgnummer. */
function taakKaart(n, titel = '', omschrijving = '') {
  return `
    <div class="taak-kaart" data-taak>
      <div class="taak-kaart__kop">
        <span class="taak-kaart__nr">Taak ${n}</span>
        <button type="button" class="taak-verwijder" title="Taak verwijderen" aria-label="Taak verwijderen">&times;</button>
      </div>
      <div class="form-group">
        <input type="text" class="taak-titel" value="${titel.replace(/"/g, '&quot;')}"
               placeholder="Korte titel van de taak (bv. Software geïnstalleerd op nieuwe toestellen)" />
      </div>
      <div class="form-group">
        <textarea class="taak-omschrijving" rows="2"
                  placeholder="Korte beschrijving van de taak en wat je precies hebt gedaan…">${omschrijving}</textarea>
      </div>
    </div>
  `;
}

export function render() {
  return `
    <a href="#student/logboek" class="terug-link">&larr; Terug naar logboeken</a>

    <div class="view-header">
      <h1 class="view-titel">Logboek</h1>
    </div>

    <form id="logboekForm" class="formulier" novalidate>
      <div class="kaart">
        <h2 class="kaart-titel">Logboekgegevens</h2>
        <div class="form-rij form-rij--2">
          <div class="form-group">
            <label for="logDatum">Datum</label>
            <input type="date" id="logDatum" />
          </div>
          <div class="form-group">
            <label for="logWeek">Week</label>
            <input type="text" id="logWeek" placeholder="Week —" readonly />
          </div>
        </div>
      </div>

      <div class="kaart">
        <h2 class="kaart-titel">Uitgevoerde taken</h2>
        <p class="kaart-subtitel">Voeg per taak een apart kaartje toe. Zo blijft duidelijk wat je deze stagedag hebt gedaan.</p>
        <div id="takenLijst">
          ${taakKaart(1)}
        </div>
        <button type="button" class="btn btn--secundair btn--sm" id="taakToevoegen">+ Taak toevoegen</button>
      </div>

      <div class="form-rij form-rij--2">
        <div class="kaart">
          <h2 class="kaart-titel">Reflectie</h2>
          <div class="form-group">
            <textarea id="logReflectie" rows="4" placeholder="Wat heb je vandaag geleerd? Wat ging goed?"></textarea>
          </div>
        </div>
        <div class="kaart">
          <h2 class="kaart-titel">Problemen / leerpunten</h2>
          <div class="form-group">
            <textarea id="logProblemen" rows="4" placeholder="Welke moeilijkheden kwam je tegen? Waar wil je nog in groeien?"></textarea>
          </div>
        </div>
      </div>

      <div class="form-acties form-acties--eind">
        <button type="button" class="btn btn--secundair" id="conceptBtn">Opslaan als concept</button>
        <button type="submit" class="btn btn--primair">Logboek indienen</button>
      </div>
      <p id="logMelding" class="melding"></p>
    </form>
  `;
}

export function init() {
  const lijst   = document.getElementById('takenLijst');
  const datumIn = document.getElementById('logDatum');
  const weekIn  = document.getElementById('logWeek');

  // Datum standaard op vandaag
  if (datumIn && !datumIn.value) datumIn.value = new Date().toISOString().slice(0, 10);

  // Concept herstellen (indien aanwezig)
  herstelConcept();

  // Stage ophalen → stage_id voor opslaan + weeknummer tonen.
  // Backend niet bereikbaar? Val terug op een demo-stage zodat de pagina blijft werken.
  apiFetch('/stages/mijn')
    .then(stages => {
      STAGE = (Array.isArray(stages) ? stages[0] : null) || null;
      if (!STAGE || !STAGE.start_datum) throw new Error('geen stage');
      werkWeekBij();
    })
    .catch(() => {
      DEMO_MODUS = true;
      STAGE = DEMO_STAGE;
      werkWeekBij();
    });

  // Weekveld meeschuiven met gekozen datum
  datumIn?.addEventListener('change', werkWeekBij);

  function werkWeekBij() {
    if (!STAGE || !STAGE.start_datum || !weekIn || !datumIn?.value) return;
    const dagen = Math.floor((new Date(datumIn.value) - new Date(STAGE.start_datum)) / 86400000);
    weekIn.value = `Week ${Math.max(1, Math.floor(dagen / 7) + 1)}`;
  }

  /* ── Taken toevoegen / verwijderen ── */
  function hernummer() {
    lijst.querySelectorAll('[data-taak] .taak-kaart__nr').forEach((el, i) => {
      el.textContent = `Taak ${i + 1}`;
    });
  }

  document.getElementById('taakToevoegen')?.addEventListener('click', () => {
    const aantal = lijst.querySelectorAll('[data-taak]').length;
    lijst.insertAdjacentHTML('beforeend', taakKaart(aantal + 1));
  });

  lijst?.addEventListener('click', (e) => {
    if (!e.target.classList.contains('taak-verwijder')) return;
    if (lijst.querySelectorAll('[data-taak]').length <= 1) return;
    e.target.closest('[data-taak]').remove();
    hernummer();
  });

  /* ── Opslaan ── */
  document.getElementById('conceptBtn')?.addEventListener('click', bewaarConcept);
  document.getElementById('logboekForm')?.addEventListener('submit', verstuur);
}

/* Verzamel de ingevulde gegevens uit het formulier. */
function verzamel() {
  const taken = Array.from(document.querySelectorAll('#takenLijst [data-taak]'))
    .map(k => ({
      titel:        k.querySelector('.taak-titel')?.value.trim() || '',
      omschrijving: k.querySelector('.taak-omschrijving')?.value.trim() || '',
    }))
    .filter(t => t.titel || t.omschrijving);

  return {
    datum:     document.getElementById('logDatum')?.value || '',
    taken,
    reflectie: document.getElementById('logReflectie')?.value.trim() || '',
    problemen: document.getElementById('logProblemen')?.value.trim() || '',
  };
}

function toonMelding(tekst, fout = false) {
  const meld = document.getElementById('logMelding');
  if (!meld) return;
  meld.className = `melding melding--${fout ? 'fout' : 'succes'}`;
  meld.textContent = tekst;
}

/* ── Concept (lokaal) ── */
function bewaarConcept() {
  localStorage.setItem(CONCEPT_KEY, JSON.stringify(verzamel()));
  toonMelding('✓ Opgeslagen als concept (alleen op dit toestel).');
}

function herstelConcept() {
  let data;
  try { data = JSON.parse(localStorage.getItem(CONCEPT_KEY)); } catch { return; }
  if (!data) return;

  if (data.datum)     document.getElementById('logDatum').value = data.datum;
  if (data.reflectie) document.getElementById('logReflectie').value = data.reflectie;
  if (data.problemen) document.getElementById('logProblemen').value = data.problemen;

  if (Array.isArray(data.taken) && data.taken.length) {
    document.getElementById('takenLijst').innerHTML =
      data.taken.map((t, i) => taakKaart(i + 1, t.titel, t.omschrijving)).join('');
  }
}

/* ── Indienen (database) ── */
async function verstuur(e) {
  e.preventDefault();

  if (!STAGE || !STAGE.id) {
    toonMelding('Geen actieve stage gevonden — kan logboek niet indienen.', true);
    return;
  }

  const data = verzamel();
  if (!data.datum) { toonMelding('Vul een datum in.', true); return; }
  if (!data.taken.length) { toonMelding('Voeg minstens één taak toe.', true); return; }

  if (DEMO_MODUS) {
    toonMelding('Demo-modus: backend niet bereikbaar, dus niets opgeslagen. Start de backend om echt in te dienen.', true);
    return;
  }

  try {
    await apiFetch('/logboeken', {
      method: 'POST',
      body: JSON.stringify({
        stageId:   STAGE.id,
        datum:     data.datum,
        taken:     JSON.stringify(data.taken),
        reflectie: data.reflectie,
        problemen: data.problemen,
      }),
    });
    localStorage.removeItem(CONCEPT_KEY);
    toonMelding('✓ Logboek ingediend!');
    setTimeout(() => { location.hash = '#student/logboek'; }, 700);
  } catch (err) {
    toonMelding(`Fout bij indienen: ${err?.fout || err?.message || 'onbekende fout'}`, true);
  }
}
