const STAGIAIRS = ['Yasmine El Amrani', 'Lars Vandenberghe', 'Nora Pieters'];
const COMPETENTIES = ['Technische vaardigheden', 'Communicatie', 'Probleemoplossend denken', 'Samenwerking', 'Zelfstandigheid'];

export function render() {
  const opties = STAGIAIRS.map(s => `<option value="${s}">${s}</option>`).join('');
  const rijen  = COMPETENTIES.map(c => `
    <tr>
      <td>${c}</td>
      <td>
        <select class="score-select">
          <option value="">— kies —</option>
          ${[1,2,3,4,5].map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </td>
      <td><textarea class="feedback-input" rows="1" placeholder="Opmerking vanuit bedrijfsperspectief…"></textarea></td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Evaluaties</h1>
      <p class="view-subtitel">Beoordeel de prestaties van je stagiairs.</p>
    </div>
    <div class="kaart formulier-kaart">
      <div class="form-group">
        <label for="mentorStudent">Stagiair</label>
        <select id="mentorStudent"><option value="">— kies stagiair —</option>${opties}</select>
      </div>
      <div class="tabel-wrapper" style="margin-top:16px">
        <table>
          <thead><tr><th>Competentie</th><th>Score (1–5)</th><th>Opmerking</th></tr></thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
      <div class="form-acties" style="margin-top:16px">
        <button class="btn btn--primair" id="mentorOpslaan">Evaluatie opslaan</button>
      </div>
      <p id="mentorMelding" class="melding"></p>
    </div>
  `;
}

export function init() {
  document.getElementById('mentorOpslaan')?.addEventListener('click', function () {
    const student = document.getElementById('mentorStudent').value;
    const meld = document.getElementById('mentorMelding');
    if (!student) {
      meld.className = 'melding melding--fout';
      meld.textContent = 'Kies eerst een stagiair.';
      return;
    }
    meld.className = 'melding melding--succes';
    meld.textContent = `✓ Evaluatie voor ${student} opgeslagen! (demo-modus)`;
  });
}
