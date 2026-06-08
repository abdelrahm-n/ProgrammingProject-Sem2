const DEMO = [
  { naam: 'Yasmine El Amrani',  bedrijf: 'Proximus',    status: 'actief',    score: '4.2' },
  { naam: 'Lars Vandenberghe',  bedrijf: 'Belfius',     status: 'actief',    score: '3.8' },
  { naam: 'Fatima Nzinga',      bedrijf: 'BNP Paribas', status: 'afgerond',  score: '4.6' },
  { naam: 'Remi Claessens',     bedrijf: '—',           status: 'ingediend', score: '—'   },
];

export function render() {
  const rijen = DEMO.map(s => `
    <tr>
      <td>${s.naam}</td>
      <td>${s.bedrijf}</td>
      <td><span class="badge badge--${s.status}">${s.status}</span></td>
      <td>${s.score}</td>
      <td>
        <a href="#docent/logboeken" class="tabel-link">Logboek</a>
        <a href="#docent/evaluatie" class="tabel-link">Evaluatie</a>
      </td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Mijn Studenten</h1>
      <p class="view-subtitel">Alle studenten die aan jou zijn toegewezen.</p>
    </div>
    <div class="kaart">
      <div class="kaart-toolbar">
        <input class="zoek-input" type="search" placeholder="Zoeken op naam of bedrijf…" id="zoekInput" />
      </div>
      <div class="tabel-wrapper">
        <table id="studentenTabel">
          <thead>
            <tr><th>Naam</th><th>Bedrijf</th><th>Status</th><th>Score</th><th>Acties</th></tr>
          </thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  const input = document.getElementById('zoekInput');
  input?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#studentenTabel tbody tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
