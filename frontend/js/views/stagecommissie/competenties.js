const DEMO = [
  { naam: 'Technische vaardigheden',  omschrijving: 'Beheersing van relevante tools en technieken.' },
  { naam: 'Communicatie',             omschrijving: 'Mondeling en schriftelijk communiceren met collega\'s en klanten.' },
  { naam: 'Probleemoplossend denken', omschrijving: 'Analytisch en creatief omgaan met uitdagingen.' },
  { naam: 'Samenwerking',             omschrijving: 'Effectief functioneren in een team.' },
  { naam: 'Zelfstandigheid',          omschrijving: 'Taken zelfstandig plannen en uitvoeren.' },
];

export function render() {
  const rijen = DEMO.map((c, i) => `
    <tr>
      <td><strong>${c.naam}</strong></td>
      <td>${c.omschrijving}</td>
      <td>
        <button class="btn btn--xs btn--secundair" onclick="bewerk(${i})">Bewerken</button>
        <button class="btn btn--xs btn--gevaar"    onclick="verwijder(${i}, this)">Verwijderen</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Competenties</h1>
      <p class="view-subtitel">Beheer de competentieprofielen die worden gebruikt bij evaluaties.</p>
    </div>

    <div class="kaart formulier-kaart">
      <h2 class="kaart-titel">Nieuwe competentie toevoegen</h2>
      <form id="compForm" class="formulier" novalidate>
        <div class="form-rij form-rij--2">
          <div class="form-group">
            <label for="compNaam">Naam *</label>
            <input type="text" id="compNaam" placeholder="Naam van de competentie" required />
          </div>
          <div class="form-group">
            <label for="compOmschrijving">Omschrijving</label>
            <input type="text" id="compOmschrijving" placeholder="Korte omschrijving" />
          </div>
        </div>
        <div class="form-acties">
          <button type="submit" class="btn btn--primair">Toevoegen</button>
        </div>
        <p id="compMelding" class="melding"></p>
      </form>
    </div>

    <div class="kaart">
      <h2 class="kaart-titel">Bestaande competenties</h2>
      <div class="tabel-wrapper">
        <table id="compTabel">
          <thead><tr><th>Naam</th><th>Omschrijving</th><th>Acties</th></tr></thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  window.bewerk   = (i) => alert(`Bewerken (demo) — rij ${i + 1}`);
  window.verwijder = (i, btn) => {
    btn.closest('tr').remove();
  };

  document.getElementById('compForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const naam = document.getElementById('compNaam').value.trim();
    if (!naam) return;
    const meld = document.getElementById('compMelding');
    meld.className = 'melding melding--succes';
    meld.textContent = `✓ Competentie "${naam}" toegevoegd! (demo-modus)`;
    e.target.reset();
  });
}
