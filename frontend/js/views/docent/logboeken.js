const DEMO = [
  { student: 'Yasmine El Amrani', richting: 'Toegepaste Informatica', datum: '2025-02-10', uren: 8, tekst: 'API-integratie afgewerkt en getest.',      status: 'ingediend' },
  { student: 'Lars Vandenberghe', richting: 'Toegepaste Informatica', datum: '2025-02-10', uren: 8, tekst: 'Database-migratie voorbereid.',            status: 'ingediend' },
  { student: 'Yasmine El Amrani', richting: 'Toegepaste Informatica', datum: '2025-02-07', uren: 7, tekst: 'Eerste sprint-planning bijgewoond.',       status: 'goedgekeurd' },
  { student: 'Lars Vandenberghe', richting: 'Toegepaste Informatica', datum: '2025-02-07', uren: 8, tekst: 'Unit-tests geschreven voor module X.',     status: 'goedgekeurd' },
];

export function render() {
  const rijen = DEMO.map((e, i) => `
    <tr>
      <td>${e.student}</td>
      <td>${e.richting}</td>
      <td>${e.datum}</td>
      <td>${e.uren}u</td>
      <td class="tabel-tekst">${e.tekst}</td>
      <td><span class="badge badge--${e.status}">${e.status}</span></td>
      <td>
        <button class="btn btn--xs btn--primair" onclick="bekijkLogboek(${i})">Bekijken</button>
      </td>
    </tr>
  `).join('');

  return `
    <div id="logboek-overzicht">
      <div class="view-header">
        <h1 class="view-titel">Logboeken</h1>
        <p class="view-subtitel">Controleer en beoordeel de logboek-vermeldingen van je studenten.</p>
      </div>

      <div class="zoekbalk-wrapper">
        <input type="text" id="zoekbalk" placeholder="Zoek op student..." />
      </div>

      <div class="kaart">
        <div class="tabel-wrapper">
          <table>
            <thead>
              <tr><th>Student</th><th>Richting</th><th>Datum</th><th>Uren</th><th>Samenvatting</th><th>Status</th><th>Actie</th></tr>
            </thead>
            <tbody id="logboek-tbody">${rijen}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="logboek-detail" class="verborgen">
      <button onclick="sluitDetail()" class="btn--terug">← Terug</button>

      <div class="detail-grid">
        <div class="kaart detail-kaart">
          <h2 class="detail-titel">Logboek Leerling</h2>
          <div id="detail-inhoud"></div>
        </div>

        <div class="kaart detail-kaart">
          <h2 class="detail-titel">Stagementor goedkeuring</h2>
          <div id="detail-status"></div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const zoekbalk = document.getElementById('zoekbalk');
  const tbody = document.getElementById('logboek-tbody');

  zoekbalk.addEventListener('input', () => {
    const zoekterm = zoekbalk.value.toLowerCase();
    tbody.querySelectorAll('tr').forEach(rij => {
      const student = rij.cells[0].textContent.toLowerCase();
      rij.style.display = student.includes(zoekterm) ? '' : 'none';
    });
  });

  window.bekijkLogboek = function (index) {
    const e = DEMO[index];

    document.getElementById('logboek-overzicht').classList.add('verborgen');
    document.getElementById('logboek-detail').classList.remove('verborgen');

    document.getElementById('detail-inhoud').innerHTML = `
      <h3 class="detail-student-naam">${e.student} — ingediend ${e.datum}</h3>
      <p class="detail-meta">Richting: ${e.richting} &nbsp;|&nbsp; Uren: ${e.uren}u</p>
      <p class="detail-tekst">${e.tekst}</p>
    `;

    const isGoedgekeurd = e.status === 'goedgekeurd';
    const isAfgekeurd   = e.status === 'afgekeurd';

    document.getElementById('detail-status').innerHTML = `
      <div class="detail-status-lijst">
        <div class="detail-status-item">
          <span class="detail-status-label detail-status-label--goedgekeurd ${isGoedgekeurd ? '' : 'inactief'}">Goedgekeurd</span>
          <span class="detail-status-icoon">${isGoedgekeurd ? '✔' : '☐'}</span>
        </div>
        <div class="detail-status-item">
          <span class="detail-status-label detail-status-label--afgekeurd ${isAfgekeurd ? '' : 'inactief'}">Afgekeurd</span>
          <span class="detail-status-icoon">${isAfgekeurd ? '✔' : '☐'}</span>
        </div>
        ${e.status === 'ingediend' ? '<p class="detail-nog-niet">Nog niet beoordeeld door stagementor.</p>' : ''}
      </div>
    `;
  };

  window.sluitDetail = function () {
    document.getElementById('logboek-detail').classList.add('verborgen');
    document.getElementById('logboek-overzicht').classList.remove('verborgen');
  };
<<<<<<< Updated upstream
}
=======
}

>>>>>>> Stashed changes
