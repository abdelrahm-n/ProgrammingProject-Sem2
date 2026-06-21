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
  if (s.includes('open') || s.includes('wacht')) return 'badge--actief';
  if (s.includes('gevalideerd')) return 'badge--goedgekeurd';
  return 'badge--afgerond';
}

async function fetchJson(url) {
  try {
    const res = await fetch(API_URL + url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401 || res.status === 403) {
      window.location.href = '../index.html';
      return null;
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function laadDashboard() {
  try {
    const naam = localStorage.getItem('naam');
    if (naam) document.getElementById('mentorNaam').textContent = 'Dashboard, ' + naam;

    const dashboard = await fetchJson('/api/mentor/dashboard');
    if (!dashboard) return;

    const studenten = dashboard.studenten;
    document.getElementById('totaalStudenten').textContent = dashboard.statistieken.totaalStudenten;

    const alleLogboeken = [];
    const alleEvaluaties = [];

    for (const s of studenten) {
      if (!s.stage_id) continue;

      const logboeken = await fetchJson('/api/mentor/logboeken/' + s.stage_id);
      const evaluaties = await fetchJson('/api/mentor/evaluaties/' + s.stage_id);

      const studentNaam = s.voornaam + ' ' + s.achternaam;

      if (logboeken && logboeken.length > 0) {
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

      if (evaluaties && evaluaties.length > 0) {
        evaluaties.forEach(ev => {
          alleEvaluaties.push({
            studentNaam,
            studentId: s.student_id,
            stageId: s.stage_id,
            type: ev.type_naam,
            datum: ev.datum,
            score: ev.eindresultaat_score
          });
        });
      }
    }

    document.getElementById('evaluatiesCount').textContent = alleEvaluaties.length;

    const laatsteLogboeken = studenten.map(s => {
      const studentLogboeken = alleLogboeken.filter(l => l.studentId === s.student_id);
      return studentLogboeken.length > 0 ? studentLogboeken[studentLogboeken.length - 1] : null;
    }).filter(Boolean).slice(-5).reverse();

    const laatsteEvaluaties = studenten.map(s => {
      const studentEvals = alleEvaluaties.filter(e => e.studentId === s.student_id);
      return studentEvals.length > 0 ? studentEvals[0] : null;
    }).filter(Boolean).slice(-5).reverse();

    const overeenkomsten = await fetchJson('/api/mentor/overeenkomsten');
    const overeenkomstenCount = overeenkomsten ? overeenkomsten.length : 0;
    document.getElementById('overeenkomstenCount').textContent = overeenkomstenCount;
    if (overeenkomstenCount > 0) {
      document.getElementById('overeenkomstenCount').closest('.stat-card').classList.add('stat-card--alert');
    }
    toonOvereenkomsten(overeenkomsten);

    toonLogboeken(laatsteLogboeken);
    toonEvaluaties(laatsteEvaluaties);
    toonStagiairs(studenten);

  } catch (err) {
    console.error('Dashboard fout:', err);
  }
}

function toonOvereenkomsten(overeenkomsten) {
  const doel = document.getElementById('overeenkomstenLijst');

  if (!overeenkomsten || overeenkomsten.length === 0) {
    doel.innerHTML = '<div class="actie-lege-lijst">Geen overeenkomsten om te ondertekenen.</div>';
    return;
  }

  const items = overeenkomsten.map(o => {
    const naam = escape(o.student_voornaam + ' ' + o.student_achternaam);
    const bedrijf = escape(o.bedrijf_naam);

    return `
    <a href="stageovereenkomst.html?id=${o.overeenkomst_id}" class="actie-rij">
      <span class="actie-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </span>
      <div class="actie-tekst">
        <strong>${naam} — ${bedrijf}</strong>
        <span>Handtekening nodig</span>
      </div>
      <span class="btn btn--primair btn--sm">Ondertekenen</span>
    </a>`;
  }).join('');

  doel.innerHTML = items + `
    <a href="stagiairs.html" class="actie-rij actie-rij--meer">
      <span class="actie-tekst" style="align-items:center"><strong>Bekijk meer →</strong></span>
    </a>`;
}

function toonLogboeken(lijst) {
  const doel = document.getElementById('logboekLijst');

  if (!lijst || lijst.length === 0) {
    doel.innerHTML = '<div class="actie-lege-lijst">Nog geen logboeken.</div>';
    return;
  }

  const items = lijst.map(l => `
    <a href="logboek-detail.html?student=${l.studentId}" class="actie-rij">
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

function toonEvaluaties(lijst) {
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

function toonStagiairs(studenten) {
  const doel = document.getElementById('stagiairsLijst');

  if (!studenten || studenten.length === 0) {
    doel.innerHTML = '<div class="actie-lege-lijst">Je hebt nog geen stagiairs.</div>';
    return;
  }

  const items = studenten.map(s => {
    const naam = escape(s.voornaam + ' ' + s.achternaam);
    const bedrijf = escape(s.bedrijf);

    return `
    <a href="stagiairs.html" class="actie-rij">
      <span class="actie-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </span>
      <div class="actie-tekst">
        <strong>${naam}</strong>
        <span>${bedrijf}</span>
      </div>
      <span class="btn btn--primair btn--sm">Bekijk</span>
    </a>`;
  }).join('');

  doel.innerHTML = items + `
    <a href="stagiairs.html" class="actie-rij actie-rij--meer">
      <span class="actie-tekst" style="align-items:center"><strong>Bekijk meer →</strong></span>
    </a>`;
}

laadDashboard();
