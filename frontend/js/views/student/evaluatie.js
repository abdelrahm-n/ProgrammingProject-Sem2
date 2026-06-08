const COMPETENTIES = [
  { naam: 'Technische vaardigheden',  score: 4, max: 5 },
  { naam: 'Communicatie',             score: 3, max: 5 },
  { naam: 'Probleemoplossend denken', score: 4, max: 5 },
  { naam: 'Samenwerking',             score: 5, max: 5 },
  { naam: 'Zelfstandigheid',          score: 3, max: 5 },
];

function sterren(score, max) {
  return Array.from({ length: max }, (_, i) =>
    `<span class="ster${i < score ? ' ster--vol' : ''}">★</span>`
  ).join('');
}

export function render() {
  const rijen = COMPETENTIES.map(c => `
    <tr>
      <td>${c.naam}</td>
      <td><div class="sterren">${sterren(c.score, c.max)}</div></td>
      <td>${c.score} / ${c.max}</td>
    </tr>
  `).join('');

  const gem = (COMPETENTIES.reduce((s, c) => s + c.score, 0) / COMPETENTIES.length).toFixed(1);

  return `
    <div class="view-header">
      <h1 class="view-titel">Mijn Evaluatie</h1>
      <p class="view-subtitel">Overzicht van je beoordeelde competenties.</p>
    </div>

    <div class="stat-rij stat-rij--1">
      <div class="stat-kaart">
        <div class="stat-kaart__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <div class="stat-kaart__info">
          <span class="stat-kaart__getal">${gem} / 5</span>
          <span class="stat-kaart__label">Gemiddelde score</span>
        </div>
      </div>
    </div>

    <div class="kaart">
      <h2 class="kaart-titel">Competenties</h2>
      <div class="tabel-wrapper">
        <table>
          <thead>
            <tr><th>Competentie</th><th>Beoordeling</th><th>Score</th></tr>
          </thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}
