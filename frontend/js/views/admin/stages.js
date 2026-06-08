const DEMO = [
  { student: 'Yasmine El Amrani', bedrijf: 'Proximus',    mentor: 'Jan Claes',   docent: 'De Smedt', status: 'actief',     start: '2025-02-01', eind: '2025-05-31' },
  { student: 'Lars Vandenberghe', bedrijf: 'Belfius',     mentor: 'Ann Puts',    docent: 'De Smedt', status: 'actief',     start: '2025-02-01', eind: '2025-05-31' },
  { student: 'Fatima Nzinga',     bedrijf: 'BNP Paribas', mentor: 'Tom Willems', docent: 'Janssen',  status: 'afgerond',  start: '2024-09-01', eind: '2024-12-20' },
  { student: 'Remi Claessens',    bedrijf: 'Accenture',   mentor: '—',           docent: 'De Smedt', status: 'ingediend', start: '—',          eind: '—'          },
];

export function render() {
  const rijen = DEMO.map(s => `
    <tr>
      <td>${s.student}</td>
      <td>${s.bedrijf}</td>
      <td>${s.mentor}</td>
      <td>${s.docent}</td>
      <td><span class="badge badge--${s.status}">${s.status}</span></td>
      <td>${s.start}</td>
      <td>${s.eind}</td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Alle stages</h1>
      <p class="view-subtitel">Volledig overzicht van alle stages op het platform.</p>
    </div>
    <div class="kaart">
      <div class="kaart-toolbar">
        <input class="zoek-input" type="search" placeholder="Zoeken…" id="zoekStages" />
        <div class="filter-tabs" id="stagesFilter">
          <button class="filter-tab actief" data-filter="alle">Alle</button>
          <button class="filter-tab" data-filter="actief">Actief</button>
          <button class="filter-tab" data-filter="ingediend">Ingediend</button>
          <button class="filter-tab" data-filter="afgerond">Afgerond</button>
        </div>
      </div>
      <div class="tabel-wrapper">
        <table id="stagesTabel">
          <thead>
            <tr><th>Student</th><th>Bedrijf</th><th>Mentor</th><th>Docent</th><th>Status</th><th>Start</th><th>Einde</th></tr>
          </thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  document.getElementById('zoekStages')?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#stagesTabel tbody tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  document.getElementById('stagesFilter')?.addEventListener('click', function (e) {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    document.querySelectorAll('#stagesFilter .filter-tab').forEach(b => b.classList.remove('actief'));
    btn.classList.add('actief');
    const f = btn.dataset.filter;
    document.querySelectorAll('#stagesTabel tbody tr').forEach(tr => {
      tr.style.display = (f === 'alle' || tr.textContent.includes(f)) ? '' : 'none';
    });
  });
}
