const STUDENTEN = ['Yasmine El Amrani', 'Lars Vandenberghe'];
const COMPETENTIES = ['Technische vaardigheden', 'Communicatie', 'Probleemoplossend denken', 'Samenwerking', 'Zelfstandigheid'];

export function render() {
  const opties = STUDENTEN.map(s => `<option value="${s}">${s}</option>`).join('');
  const rijen  = COMPETENTIES.map(c => `
    <tr>
      <td>${c}</td>
      <td>
        <select class="score-select" data-comp="${c}">
          <option value="">— kies —</option>
          ${[1,2,3,4,5].map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </td>
      <td><textarea class="feedback-input" rows="1" placeholder="Opmerking…"></textarea></td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Evaluaties</h1>
      <p class="view-subtitel">Geef scores en feedback per competentie.</p>
    </div>
    <div class="kaart formulier-kaart">
      <div class="form-group">
        <label for="evalStudent">Student</label>
        <select id="evalStudent"><option value="">— kies student —</option>${opties}</select>
      </div>
      <div class="tabel-wrapper" style="margin-top:16px">
        <table>
          <thead><tr><th>Competentie</th><th>Score (1–5)</th><th>Feedback</th></tr></thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
      <div class="form-acties" style="margin-top:16px">
        <button class="btn btn--primair" id="evalOpslaan">Evaluatie opslaan</button>
      </div>
      <p id="evalMelding" class="melding"></p>
    </div>
  `;
}

export function init() {
  document.getElementById('evalOpslaan')?.addEventListener('click', function () {
    const student = document.getElementById('evalStudent').value;
    if (!student) {
      document.getElementById('evalMelding').className = 'melding melding--fout';
      document.getElementById('evalMelding').textContent = 'Kies eerst een student.';
      return;
    }
    document.getElementById('evalMelding').className = 'melding melding--succes';
    document.getElementById('evalMelding').textContent = `✓ Evaluatie voor ${student} opgeslagen! (demo-modus)`;
  });
}
