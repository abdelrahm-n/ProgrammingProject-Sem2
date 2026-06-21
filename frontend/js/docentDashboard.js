const API_URL = 'http://localhost:3000';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../index.html';
}

function escape(t) {
  if (t == null) return '';
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function badgeClass(status) {
  if (!status) return 'badge--afgerond';
  const s = status.toLowerCase();
  if (s.includes('goedgekeurd')) return 'badge--goedgekeurd';
  if (s.includes('ingediend')) return 'badge--ingediend';
  if (s.includes('afgekeurd')) return 'badge--afgekeurd';
  if (s.includes('open')) return 'badge--actief';
  return 'badge--afgerond';
}

async function fetchJson(url) {
  const res = await fetch(API_URL + url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (res.status === 401 || res.status === 403) {
    window.location.href = '../index.html';
    return null;
  }
  if (!res.ok) return null;
  return res.json();
}

async function laadDashboard() {
  try {
    const naam = localStorage.getItem('naam');
    if (naam) document.getElementById('docentNaam').textContent = 'Dashboard, ' + naam;

    const studenten = await fetchJson('/api/docent/mijn-studenten');
    if (!studenten) return;

    document.getElementById('totaalStudenten').textContent = studenten.length;

    const alleLogboeken = [];
    const alleEvaluaties = [];

    await Promise.all(studenten.map(async (s) => {
      const [logboeken, evaluaties] = await Promise.all([
        fetchJson('/api/docent/logboeken/' + s.stage_id),
        fetchJson('/api/docent/evaluaties/' + s.stage_id)
      ]);

      const studentNaam = s.voornaam + ' ' + s.achternaam;

      if (logboeken) {
        logboeken.forEach(lw => {
          alleLogboeken.push({
            studentNaam,
            studentId: s.student_id,
            weekNummer: lw.week_nummer,
            feedback: lw.feedback_mentor,
            status: lw.status_naam
          });
        });
      }

      if (evaluaties) {
        evaluaties.forEach(ev => {
          alleEvaluaties.push({
            studentNaam,
            studentId: s.student_id,
            type: ev.type_naam,
            datum: ev.datum,
            score: ev.eindresultaat_score
          });
        });
      }
    }));

    const beoordeeld = alleLogboeken.filter(l => l.status === 'goedgekeurd').length;
    document.getElementById('logboekFeedbackCount').textContent = beoordeeld;
    document.getElementById('evaluatiesCount').textContent = alleEvaluaties.length;

    const laatsteLogboeken = alleLogboeken.slice(-5).reverse();
    const laatsteEvaluaties = alleEvaluaties.slice(-5).reverse();

    toonLogboeken(laatsteLogboeken, alleLogboeken.length);
    toonEvaluaties(laatsteEvaluaties, alleEvaluaties.length);
    toonStudenten(studenten);

  } catch (err) {
    console.error('Dashboard fout:', err);
  }
}

function toonLogboeken(lijst, totaal) {
  const doel = document.getElementById('logboekLijst');

  if (!lijst || lijst.length === 0) {
    doel.innerHTML = '<div class="actie-lege-lijst">Nog geen logboeken.</div>';
    return;
  }

  const items = lijst.map(l => `
    <a href="logboeken-detail.html?student=${l.studentId}" class="actie-rij">
      <span class="actie-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </span>
      <div class="actie-tekst">
        <strong>${escape(l.studentNaam)} — Week ${l.weekNummer}</strong>
        <span>${l.feedback ? '"' + escape(l.feedback) + '"' : 'Geen feedback'}</span>
      </div>
      <span class="badge badge--${badgeClass(l.status)}">${escape(l.status)}</span>
    </a>
  `).join('');

  doel.innerHTML = items + `
    <a href="logboeken.html" class="actie-rij actie-rij--meer">
      <span class="actie-tekst" style="align-items:center"><strong>Bekijk meer →</strong></span>
    </a>`;
}

function toonEvaluaties(lijst, totaal) {
  const doel = document.getElementById('evaluatiesLijst');

  if (!lijst || lijst.length === 0) {
    doel.innerHTML = '<div class="actie-lege-lijst">Nog geen evaluaties.</div>';
    return;
  }

  const items = lijst.map(e => {
    const datum = e.datum ? new Date(e.datum).toLocaleDateString('nl-BE') : 'Onbekend';
    const typeLabel = e.type.replace(/_/g, ' ');
    const badge = e.score != null
      ? `<span class="badge badge--goedgekeurd">${e.score}/20</span>`
      : '<span class="badge badge--ingediend">Gepland</span>';

    return `
    <a href="evaluatie.html" class="actie-rij">
      <span class="actie-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      </span>
      <div class="actie-tekst">
        <strong>${escape(e.studentNaam)}</strong>
        <span>${escape(typeLabel)} — ${datum}</span>
      </div>
      ${badge}
    </a>`;
  }).join('');

  doel.innerHTML = items + `
    <a href="evaluatie.html" class="actie-rij actie-rij--meer">
      <span class="actie-tekst" style="align-items:center"><strong>Bekijk meer →</strong></span>
    </a>`;
}

function toonStudenten(studenten) {
  const doel = document.getElementById('studentenLijst');

  if (!studenten || studenten.length === 0) {
    doel.innerHTML = '<div class="actie-lege-lijst">Je hebt nog geen studenten.</div>';
    return;
  }

  const lijst = studenten.slice(0, 5);

  const items = lijst.map(s => {
    const naam = escape(s.voornaam + ' ' + s.achternaam);
    const bedrijf = escape(s.bedrijf);
    const opleiding = escape(s.opleiding);
    const mentor = s.mentor_voornaam
      ? escape(s.mentor_voornaam + ' ' + s.mentor_achternaam)
      : '-';

    return `
    <a href="studentenfiche.html?stage=${s.stage_id}" class="actie-rij">
      <span class="actie-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </span>
      <div class="actie-tekst">
        <strong>${naam}</strong>
        <span>${bedrijf} — ${opleiding} — Mentor: ${mentor}</span>
      </div>
      <span class="btn btn--primair btn--sm">Bekijk</span>
    </a>`;
  }).join('');

  doel.innerHTML = items + `
    <a href="studenten.html" class="actie-rij actie-rij--meer">
      <span class="actie-tekst" style="align-items:center"><strong>Bekijk meer →</strong></span>
    </a>`;
}

laadDashboard();
