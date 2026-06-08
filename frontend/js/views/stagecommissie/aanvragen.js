const DEMO = [
  { student: 'Remi Claessens',    bedrijf: 'Accenture',   ingediend: '2025-01-28', status: 'ingediend' },
  { student: 'Nora Pieters',      bedrijf: 'Deloitte',    ingediend: '2025-01-30', status: 'ingediend' },
  { student: 'Yasmine El Amrani', bedrijf: 'Proximus',    ingediend: '2025-01-15', status: 'goedgekeurd' },
  { student: 'Lars Vandenberghe', bedrijf: 'Belfius',     ingediend: '2025-01-16', status: 'goedgekeurd' },
  { student: 'Fatima Nzinga',     bedrijf: 'BNP Paribas', ingediend: '2024-09-03', status: 'afgerond' },
];

export function render() {
  const rijen = DEMO.map((a, i) => `
    <tr data-i="${i}">
      <td>${a.student}</td>
      <td>${a.bedrijf}</td>
      <td>${a.ingediend}</td>
      <td><span class="badge badge--${a.status}" id="status-${i}">${a.status}</span></td>
      <td id="acties-${i}">
        ${a.status === 'ingediend'
          ? `<button class="btn btn--xs btn--primair" onclick="aanvraagGoed(${i})">Goedkeuren</button>
             <button class="btn btn--xs btn--gevaar"  onclick="aanvraagAf(${i})">Afwijzen</button>`
          : '<span class="tekst-muted">—</span>'}
      </td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Stage-aanvragen</h1>
      <p class="view-subtitel">Beoordeel ingediende stage-aanvragen van studenten.</p>
    </div>
    <div class="kaart">
      <div class="kaart-toolbar">
        <input class="zoek-input" type="search" placeholder="Zoeken…" id="zoekInput" />
        <div class="filter-tabs" id="filterTabs">
          <button class="filter-tab actief" data-filter="alle">Alle</button>
          <button class="filter-tab" data-filter="ingediend">Ingediend</button>
          <button class="filter-tab" data-filter="goedgekeurd">Goedgekeurd</button>
          <button class="filter-tab" data-filter="afgerond">Afgerond</button>
        </div>
      </div>
      <div class="tabel-wrapper">
        <table id="aanvragenTabel">
          <thead><tr><th>Student</th><th>Bedrijf</th><th>Ingediend</th><th>Status</th><th>Actie</th></tr></thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  window.aanvraagGoed = function (i) {
    document.getElementById(`status-${i}`).className  = 'badge badge--goedgekeurd';
    document.getElementById(`status-${i}`).textContent = 'goedgekeurd';
    document.getElementById(`acties-${i}`).innerHTML   = '<span class="tekst-muted">—</span>';
  };
  window.aanvraagAf = function (i) {
    document.getElementById(`status-${i}`).className  = 'badge badge--afgekeurd';
    document.getElementById(`status-${i}`).textContent = 'afgekeurd';
    document.getElementById(`acties-${i}`).innerHTML   = '<span class="tekst-muted">—</span>';
  };

  /* Zoeken */
  document.getElementById('zoekInput')?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#aanvragenTabel tbody tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  /* Filter-tabs */
  document.getElementById('filterTabs')?.addEventListener('click', function (e) {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('actief'));
    btn.classList.add('actief');
    const filter = btn.dataset.filter;
    document.querySelectorAll('#aanvragenTabel tbody tr').forEach(tr => {
      tr.style.display = (filter === 'alle' || tr.textContent.includes(filter)) ? '' : 'none';
    });
  });
}
