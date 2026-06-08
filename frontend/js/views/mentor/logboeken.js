const DEMO = [
  { student: 'Yasmine El Amrani', datum: '2025-02-10', uren: 8, tekst: 'API-integratie afgerond en getest met Postman.', gelezen: false },
  { student: 'Lars Vandenberghe', datum: '2025-02-10', uren: 8, tekst: 'Database-migratiescript voorbereid.',           gelezen: false },
  { student: 'Nora Pieters',      datum: '2025-02-09', uren: 7, tekst: 'Presentatie voor het team gegeven.',            gelezen: true  },
];

export function render() {
  const rijen = DEMO.map((e, i) => `
    <tr class="${e.gelezen ? '' : 'rij-ongelezen'}" id="logRij-${i}">
      <td>${e.student}</td>
      <td>${e.datum}</td>
      <td>${e.uren}u</td>
      <td class="tabel-tekst">${e.tekst}</td>
      <td>
        <span class="badge badge--${e.gelezen ? 'goedgekeurd' : 'ingediend'}" id="gelezen-${i}">
          ${e.gelezen ? 'Gelezen' : 'Nieuw'}
        </span>
      </td>
      <td>
        ${!e.gelezen
          ? `<button class="btn btn--xs btn--primair" onclick="markeerGelezen(${i})">Markeer gelezen</button>`
          : '<span class="tekst-muted">—</span>'}
      </td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Logboeken stagiairs</h1>
      <p class="view-subtitel">Lees de dagelijkse vermeldingen van je stagiairs.</p>
    </div>
    <div class="kaart">
      <div class="tabel-wrapper">
        <table>
          <thead><tr><th>Stagiair</th><th>Datum</th><th>Uren</th><th>Samenvatting</th><th>Status</th><th>Actie</th></tr></thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  window.markeerGelezen = function (i) {
    const badge = document.getElementById(`gelezen-${i}`);
    badge.className  = 'badge badge--goedgekeurd';
    badge.textContent = 'Gelezen';
    document.getElementById(`logRij-${i}`).classList.remove('rij-ongelezen');
    badge.closest('tr').querySelector('td:last-child').innerHTML = '<span class="tekst-muted">—</span>';
  };
}
