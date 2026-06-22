const API_URL = 'http://localhost:3000';

const dashboards = {
  student: 'student/dashboard.html',
  docent: 'docent/dashboard.html',
  mentor: 'mentor/dashboard.html',
  commissie: 'stagecommissie/dashboard.html',
  admin: 'admin/dashboard.html'
};

const foutmelding = document.getElementById('foutmelding');

document.getElementById('toonWachtwoord').addEventListener('click', function () {
  const veld = document.getElementById('wachtwoord');
  veld.type = veld.type === 'password' ? 'text' : 'password';
});

/* Bewaar de sessiegegevens uit het server-antwoord in localStorage. */
function bewaarSessie(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('rol', data.rol);
  localStorage.setItem('naam', data.naam);
  localStorage.setItem('id', data.id != null ? data.id : '');
  localStorage.setItem('email', data.email || '');
  localStorage.setItem('studentnummer', data.studentnummer || '');
  localStorage.setItem('opleiding', data.opleiding || '');
}

/* Inloggen met het volledige e-mailadres */
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const wachtwoord = document.getElementById('wachtwoord').value;

  foutmelding.hidden = true;

  if (!email || !wachtwoord) {
    foutmelding.textContent = 'Vul je e-mailadres en wachtwoord in.';
    foutmelding.hidden = false;
    return;
  }

  try {
    const antwoord = await fetch(API_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, wachtwoord })
    });

    const data = await antwoord.json();

    if (!antwoord.ok) {
      foutmelding.textContent = data.fout || 'Inloggen mislukt.';
      foutmelding.hidden = false;
      return;
    }

    bewaarSessie(data);

    /* Map database-rol terug naar frontend-rol voor de juiste redirect */
    const rolOmgekeerd = { stagementor: 'mentor', stagecommissie: 'commissie' };
    const frontendRol = rolOmgekeerd[data.rol] || data.rol;
    window.location.href = dashboards[frontendRol] || 'index.html';

  } catch (fout) {
    foutmelding.textContent = 'Kan geen verbinding maken met de server.';
    foutmelding.hidden = false;
  }
});

/* Wachtwoord vergeten: stuur een reset-link naar het e-mailadres */
document.getElementById('vergetenBtn').addEventListener('click', async function () {
  const resetMelding = document.getElementById('resetMelding');
  const email = document.getElementById('email').value.trim();
  resetMelding.hidden = true;

  if (!email) {
    resetMelding.className = 'melding melding--fout';
    resetMelding.textContent = 'Vul eerst je e-mailadres in.';
    resetMelding.hidden = false;
    return;
  }

  try {
    const antwoord = await fetch(API_URL + '/api/auth/wachtwoord-vergeten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await antwoord.json();
    resetMelding.className = 'melding melding--succes';
    resetMelding.textContent = data.bericht || 'E-mail verzonden.';
    resetMelding.hidden = false;
  } catch (fout) {
    resetMelding.className = 'melding melding--fout';
    resetMelding.textContent = 'Kan geen verbinding maken met de server.';
    resetMelding.hidden = false;
  }
});
