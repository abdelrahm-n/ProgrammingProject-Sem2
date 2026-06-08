export function render() {
  return `
    <div class="view-header">
      <h1 class="view-titel">Stage indienen</h1>
      <p class="view-subtitel">Dien hier je stageplaats in ter goedkeuring.</p>
    </div>

    <div class="kaart formulier-kaart">
      <h2 class="kaart-titel">Stagegegevens</h2>
      <form id="stageForm" class="formulier" novalidate>

        <div class="form-rij form-rij--2">
          <div class="form-group">
            <label for="bedrijfsnaam">Bedrijfsnaam *</label>
            <input type="text" id="bedrijfsnaam" placeholder="Naam van het bedrijf" required />
          </div>
          <div class="form-group">
            <label for="sector">Sector</label>
            <input type="text" id="sector" placeholder="bijv. IT, Zorg, Onderwijs" />
          </div>
        </div>

        <div class="form-rij form-rij--2">
          <div class="form-group">
            <label for="contactpersoon">Contactpersoon *</label>
            <input type="text" id="contactpersoon" placeholder="Naam van de mentor" required />
          </div>
          <div class="form-group">
            <label for="contactEmail">E-mail contactpersoon *</label>
            <input type="email" id="contactEmail" placeholder="mentor@bedrijf.be" required />
          </div>
        </div>

        <div class="form-group">
          <label for="adres">Adres stageplaats</label>
          <input type="text" id="adres" placeholder="Straat, Gemeente" />
        </div>

        <div class="form-rij form-rij--2">
          <div class="form-group">
            <label for="startdatum">Startdatum *</label>
            <input type="date" id="startdatum" required />
          </div>
          <div class="form-group">
            <label for="einddatum">Einddatum *</label>
            <input type="date" id="einddatum" required />
          </div>
        </div>

        <div class="form-group">
          <label for="omschrijving">Omschrijving van de stage *</label>
          <textarea id="omschrijving" rows="4" placeholder="Beschrijf je taken en verantwoordelijkheden…" required></textarea>
        </div>

        <div class="form-acties">
          <button type="submit" class="btn btn--primair">Stage indienen</button>
          <button type="reset" class="btn btn--secundair">Formulier wissen</button>
        </div>

        <p id="stageMelding" class="melding"></p>
      </form>
    </div>
  `;
}

export function init() {
  document.getElementById('stageForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const meld = document.getElementById('stageMelding');
    meld.className = 'melding melding--succes';
    meld.textContent = '✓ Stage-aanvraag verstuurd! (demo-modus)';
  });
}
