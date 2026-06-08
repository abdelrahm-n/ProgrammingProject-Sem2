export function render() {
  return `
    <div class="view-header">
      <h1 class="view-titel">Dashboard — Admin</h1>
      <p class="view-subtitel">Volledig overzicht en beheer van het stageplatform.</p>
    </div>

    <div class="stat-rij">
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="totaalGebruikers">—</span>
          <span class="stat-kaart__label">Totaal gebruikers</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="totaalStages">—</span>
          <span class="stat-kaart__label">Totaal stages</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="actieveStages">—</span>
          <span class="stat-kaart__label">Actieve stages</span>
        </div>
      </div>
    </div>

    <div class="sectie">
      <h2 class="sectie-titel">Beheer</h2>
      <div class="actie-grid">
        <a href="#admin/gebruikers" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Gebruikersbeheer</span>
        </a>
        <a href="#admin/stages" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span>Alle stages bekijken</span>
        </a>
      </div>
    </div>
  `;
}
