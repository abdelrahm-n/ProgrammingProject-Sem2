const DEMO = [
  { student: 'Yasmine El Amrani', datum: '2025-02-10', uren: 8, tekst: 'API-integratie afgewerkt en getest.',      status: 'ingediend' },
  { student: 'Lars Vandenberghe', datum: '2025-02-10', uren: 8, tekst: 'Database-migratie voorbereid.',            status: 'ingediend' },
  { student: 'Yasmine El Amrani', datum: '2025-02-07', uren: 7, tekst: 'Eerste sprint-planning bijgewoond.',       status: 'goedgekeurd' },
  { student: 'Lars Vandenberghe', datum: '2025-02-07', uren: 8, tekst: 'Unit-tests geschreven voor module X.',     status: 'goedgekeurd' },
];

export function render() {
  const rijen = DEMO.map(e => `
    <tr>
      <td>${e.student}</td>
      <td>${e.datum}</td>
      <td>${e.uren}u</td>
      <td class="tabel-tekst">${e.tekst}</td>
      <td><span class="badge badge--${e.status}">${e.status}</span></td>
      <td>
        ${e.status === 'ingediend'
          ? `<button class="btn btn--xs btn--primair" onclick="keurGoed(this)">Goedkeuren</button>
             <button class="btn btn--xs btn--gevaar"  onclick="keurAf(this)">Afkeuren</button>`
          : '<span class="tekst-muted">—</span>'}
      </td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Logboeken</h1>
      <p class="view-subtitel">Controleer en beoordeel de logboek-vermeldingen van je studenten.</p>
    </div>
    <div class="kaart">
      <div class="tabel-wrapper">
        <table>
          <thead>
            <tr><th>Student</th><th>Datum</th><th>Uren</th><th>Samenvatting</th><th>Status</th><th>Actie</th></tr>
          </thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  window.keurGoed = function (btn) {
    const td = btn.closest('td');
    const statusTd = td.previousElementSibling;
    statusTd.innerHTML = '<span class="badge badge--goedgekeurd">goedgekeurd</span>';
    td.innerHTML = '<span class="tekst-muted">—</span>';
  };
  window.keurAf = function (btn) {
    const td = btn.closest('td');
    const statusTd = td.previousElementSibling;
    statusTd.innerHTML = '<span class="badge badge--afgekeurd">afgekeurd</span>';
    td.innerHTML = '<span class="tekst-muted">—</span>';
  };
}
