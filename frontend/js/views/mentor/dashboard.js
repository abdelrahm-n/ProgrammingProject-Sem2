export function render() {
  return `
    <div class="view-header">
      <h1 class="view-titel">Dashboard — Stagementor</h1>
      <p class="view-subtitel">Volg je stagiairs op en geef tijdig feedback.</p>
    </div>

    <div class="stat-rij">
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            <polyline points="16 11 18 13 22 9"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal">3</span>
          <span class="stat-kaart__label">Actieve stagiairs</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal">5</span>
          <span class="stat-kaart__label">Te lezen logboeken</span>
        </div>
      </div>
    </div>

    <div class="sectie">
      <h2 class="sectie-titel">Snelle links</h2>
      <div class="actie-grid">
        <a href="#mentor/logboeken" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>Logboeken lezen</span>
        </a>
        <a href="#mentor/evaluatie" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          <span>Evaluaties invullen</span>
        </a>
      </div>
    </div>
  `;
}
