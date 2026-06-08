export function render() {
  return `
    <div class="view-header">
      <h1 class="view-titel">Dashboard — Stagecommissie</h1>
      <p class="view-subtitel">Beheer stage-aanvragen en competentieprofielen.</p>
    </div>

    <div class="stat-rij">
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal">7</span>
          <span class="stat-kaart__label">Openstaande aanvragen</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal">23</span>
          <span class="stat-kaart__label">Goedgekeurde stages</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal">12</span>
          <span class="stat-kaart__label">Actieve competentieprofielen</span>
        </div>
      </div>
    </div>

    <div class="sectie">
      <h2 class="sectie-titel">Snelle links</h2>
      <div class="actie-grid">
        <a href="#stagecommissie/aanvragen" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>Aanvragen beoordelen</span>
        </a>
        <a href="#stagecommissie/competenties" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          <span>Competenties beheren</span>
        </a>
      </div>
    </div>
  `;
}
