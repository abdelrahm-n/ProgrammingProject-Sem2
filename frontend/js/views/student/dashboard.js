export function render() {
  return `
    <div class="view-header">
      <h1 class="view-titel">Mijn Dashboard</h1>
      <p class="view-subtitel">Welkom terug! Hier vind je een overzicht van je stage.</p>
    </div>

    <div class="stat-rij">
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="stageStatus">—</span>
          <span class="stat-kaart__label">Stage status</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="logboekAantal">0</span>
          <span class="stat-kaart__label">Logboek-vermeldingen</span>
        </div>
      </div>
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal" id="evalScore">—</span>
          <span class="stat-kaart__label">Gemiddelde score</span>
        </div>
      </div>
    </div>

    <div class="sectie">
      <h2 class="sectie-titel">Snelle links</h2>
      <div class="actie-grid">
        <a href="#student/stage-indienen" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <span>Stage indienen</span>
        </a>
        <a href="#student/logboek" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>Logboek bijhouden</span>
        </a>
        <a href="#student/evaluatie" class="actie-kaart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          <span>Mijn evaluatie</span>
        </a>
      </div>
    </div>
  `;
}

export function init() {
  // TODO: haal stagedata op
  // apiFetch('/stages/mijn').then(data => {
  //   document.getElementById('stageStatus').textContent = data.status;
  // }).catch(() => {});
}
