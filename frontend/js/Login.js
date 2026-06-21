const API_URL = 'http://localhost:3000';

const urlParams = new URLSearchParams(window.location.search);
const rol = urlParams.get('rol') || 'student';

const domeinen = {
  student: '@student.ehb.be',
  docent: '@docent.ehb.be',
  mentor: '@mentor.ehb.be',
  commissie: '@commissie.ehb.be',
  admin: '@admin.ehb.be'
};

const rolNamen = {
  student: 'Student',
  docent: 'Docent',
  mentor: 'Stagementor',
  commissie: 'Stagecommissie',
  admin: 'Administratie'
};

const dashboards = {
  student: 'student/dashboard.html',
  docent: 'docent/dashboard.html',
  mentor: 'mentor/dashboard.html',
  commissie: 'stagecommissie/dashboard.html',
  admin: 'admin/dashboard.html'
};

const domein = domeinen[rol] || domeinen.student;
const foutmelding = document.getElementById('foutmelding');

document.getElementById('loginTitel').textContent = 'Inloggen als ' + rolNamen[rol];
document.getElementById('emailDomein').textContent = domein;
document.getElementById('domeinHint').textContent = domein;

document.getElementById('toonWachtwoord').addEventListener('click', function () {
  const veld = document.getElementById('wachtwoord');
  veld.type = veld.type === 'password' ? 'text' : 'password';
});

/* Bewaar de sessiegegevens uit het server-antwoord in localStorage.
   Het id en studentnummer zijn nodig om enkel de eigen gegevens op te halen. */
function bewaarSessie(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('rol', data.rol);
  localStorage.setItem('naam', data.naam);
  localStorage.setItem('id', data.id != null ? data.id : '');
  localStorage.setItem('email', data.email || '');
  localStorage.setItem('studentnummer', data.studentnummer || '');
  localStorage.setItem('opleiding', data.opleiding || '');
}

/* Verwerk het loginformulier */
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const gebruikersnaam = document.getElementById('gebruikersnaam').value.trim();
  const wachtwoord = document.getElementById('wachtwoord').value;

  foutmelding.hidden = true;

  if (!gebruikersnaam || !wachtwoord) {
    foutmelding.textContent = 'Vul alle velden in.';
    foutmelding.hidden = false;
    return;
  }

  const email = gebruikersnaam + domein;

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

    /* Sla de sessiegegevens op in localStorage */
    bewaarSessie(data);

    /* Map database rol terug naar frontend rol voor redirect */
    const rolOmgekeerd = {
      stagementor: 'mentor',
      stagecommissie: 'commissie'
    };
    const frontendRol = rolOmgekeerd[data.rol] || data.rol;
    window.location.href = dashboards[frontendRol] || 'index.html';

  } catch (fout) {
    foutmelding.textContent = 'Kan geen verbinding maken met de server.';
    foutmelding.hidden = false;
  }
});

/* Dev-login: snel inloggen als de eerste demo-gebruiker van de gekozen rol.
   Loopt via de server zodat je een echt token krijgt en met de database werkt. */
document.getElementById('devLoginBtn').addEventListener('click', async function () {
  const foutmelding = document.getElementById('foutmelding');
  foutmelding.hidden = true;

  try {
    const antwoord = await fetch(API_URL + '/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol })
    });

    const data = await antwoord.json();

    if (!antwoord.ok) {
      foutmelding.textContent = data.fout || 'Dev-login mislukt. Draai eerst node seed.js.';
      foutmelding.hidden = false;
      return;
    }

    bewaarSessie(data);
    window.location.href = dashboards[data.rol] || 'index.html';

  } catch (fout) {
    foutmelding.textContent = 'Kan geen verbinding maken met de server.';
    foutmelding.hidden = false;
  }
});

/* Wachtwoord vergeten: stuur een reset-link naar het e-mailadres */
document.getElementById('vergetenBtn').addEventListener('click', async function () {
  const resetMelding = document.getElementById('resetMelding');
  const gebruikersnaam = document.getElementById('gebruikersnaam').value.trim();
  resetMelding.hidden = true;

  if (!gebruikersnaam) {
    resetMelding.className = 'melding melding--fout';
    resetMelding.textContent = 'Vul eerst je gebruikersnaam in.';
    resetMelding.hidden = false;
    return;
  }

  try {
    const antwoord = await fetch(API_URL + '/api/auth/wachtwoord-vergeten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: gebruikersnaam + domein })
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
