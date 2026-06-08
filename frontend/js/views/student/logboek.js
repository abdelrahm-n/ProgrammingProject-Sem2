const DEMO_ENTRIES = [
  { datum: '2025-02-03', uren: 8, samenvatting: 'Eerste dag: kennismaking met het team en opzetten van de ontwikkelomgeving.' },
  { datum: '2025-02-04', uren: 8, samenvatting: 'Introductie in de codebase en eerste taak toegewezen gekregen.' },
  { datum: '2025-02-05', uren: 7, samenvatting: 'Bugfix afgerond en pull request ingediend.' },
];

export function render() {
  const rijen = DEMO_ENTRIES.map(e => `
    <tr>
      <td>${e.datum}</td>
      <td>${e.uren}u</td>
      <td>${e.samenvatting}</td>
      <td>
        <span class="badge badge--goedgekeurd">Goedgekeurd</span>
      </td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Logboek</h1>
      <p class="view-subtitel">Houd je dagelijkse activiteiten bij.</p>
    </div>

    <div class="kaart formulier-kaart">
      <h2 class="kaart-titel">Nieuwe vermelding toevoegen</h2>
      <form id="logboekForm" class="formulier" novalidate>
        <div class="form-rij form-rij--3">
          <div class="form-group">
            <label for="logDatum">Datum *</label>
            <input type="date" id="logDatum" required />
          </div>
          <div class="form-group">
            <label for="logUren">Aantal uren *</label>
            <input type="number" id="logUren" min="1" max="12" placeholder="8" required />
          </div>
        </div>
        <div class="form-group">
          <label for="logTekst">Samenvatting *</label>
          <textarea id="logTekst" rows="3" placeholder="Wat heb je vandaag gedaan?" required></textarea>
        </div>
        <div class="form-acties">
          <button type="submit" class="btn btn--primair">Toevoegen</button>
        </div>
        <p id="logMelding" class="melding"></p>
      </form>
    </div>

    <div class="kaart">
      <h2 class="kaart-titel">Vermeldingen</h2>
      <div class="tabel-wrapper">
        <table id="logTabel">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Uren</th>
              <th>Samenvatting</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  document.getElementById('logboekForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const meld = document.getElementById('logMelding');
    meld.className = 'melding melding--succes';
    meld.textContent = '✓ Vermelding opgeslagen! (demo-modus)';
    e.target.reset();
  });
}
