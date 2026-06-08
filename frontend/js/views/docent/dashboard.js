export function render() {
  return `
    <div class="view-header">
      <h1 class="view-titel">Dashboard</h1>
      <p class="view-subtitel">Overzicht van de studenten die jij begeleidt.</p>
    </div>

    <div class="stat-rij">
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="aantalStudenten">—</span>
          <span class="stat-kaart__label">Toegewezen studenten</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="openLogboeken">—</span>
          <span class="stat-kaart__label">Openstaande logboeken</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="openEvaluaties">—</span>
          <span class="stat-kaart__label">Evaluaties in te vullen</span>
        </div>
      </div>
    </div>

    <div class="sectie">
      <h2 class="sectie-titel">Snelle links</h2>
      <div class="actie-grid">
        <a href="#docent/studenten" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <span>Mijn studenten</span>
        </a>
        <a href="#docent/logboeken" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>Logboeken controleren</span>
        </a>
        <a href="#docent/evaluatie" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          <span>Evaluaties invullen</span>
        </a>
      </div>
    </div>
  `;
}
