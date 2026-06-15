const API_URL = 'http://localhost:3000';

/* Haal de geselecteerde rol op uit de URL */
const urlParams = new URLSearchParams(window.location.search);
const rol = urlParams.get('rol') || 'student';

/* Domein per rol */
const domeinen = {
  student: '@student.ehb.be',
  docent: '@docent.ehb.be',
  mentor: '@mentor.ehb.be',
  commissie: '@commissie.ehb.be',
  admin: '@admin.ehb.be'
};

/* Nette naam per rol voor de paginatitel */
const rolNamen = {
  student: 'Student',
  docent: 'Docent',
  mentor: 'Stagementor',
  commissie: 'Stagecommissie',
  admin: 'Administratie'
};

/* Dashboard per rol waar naartoe wordt gestuurd na inloggen */
const dashboards = {
  student: 'student/dashboard.html',
  docent: 'docent/dashboard.html',
  mentor: 'mentor/dashboard.html',
  commissie: 'stagecommissie/dashboard.html',
  admin: 'admin/dashboard.html'
};

const domein = domeinen[rol] || domeinen.student;

/* Pas de pagina aan op basis van de gekozen rol */
document.getElementById('loginTitel').textContent = 'Inloggen als ' + rolNamen[rol];
document.getElementById('emailDomein').textContent = domein;
document.getElementById('domeinHint').textContent = domein;

/* Toon of verberg het wachtwoord bij klikken op het oogicoon */
document.getElementById('toonWachtwoord').addEventListener('click', function () {
  const veld = document.getElementById('wachtwoord');
  veld.type = veld.type === 'password' ? 'text' : 'password';
});

/* Verwerk het loginformulier */
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const gebruikersnaam = document.getElementById('gebruikersnaam').value.trim();
  const wachtwoord = document.getElementById('wachtwoord').value;
  const foutmelding = document.getElementById('foutmelding');

  foutmelding.hidden = true;

  if (!gebruikersnaam || !wachtwoord) {
    foutmelding.textContent = 'Vul alle velden in.';
    foutmelding.hidden = false;
    return;
  }

  /* Bouw het volledige e-mailadres op */
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
    localStorage.setItem('token', data.token);
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('naam', data.naam);

    /* Stuur door naar het juiste dashboard */
    window.location.href = dashboards[data.rol] || 'index.html';

  } catch (fout) {
    foutmelding.textContent = 'Kan geen verbinding maken met de server.';
    foutmelding.hidden = false;
  }
});

/* Dev-login: direct inloggen zonder wachtwoord */
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
      foutmelding.textContent = data.fout || 'Dev-login mislukt.';
      foutmelding.hidden = false;
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('naam', data.naam);

    window.location.href = dashboards[data.rol] || 'index.html';

  } catch (fout) {
    foutmelding.textContent = 'Kan geen verbinding maken met de server.';
    foutmelding.hidden = false;
  }
});
