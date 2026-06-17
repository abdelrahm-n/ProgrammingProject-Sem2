const API_URL = 'http://localhost:3000';

/* Update het email-preview veld op basis van de ingevoerde naam */
function updateEmailPreview() {
  const voornaam = document.getElementById('voornaam').value.trim().toLowerCase();
  const achternaam = document.getElementById('achternaam').value.trim().toLowerCase();

  /* Verwijder spaties en niet-alfabetische tekens */
  const schoneVoornaam = voornaam.replace(/[^a-z]/g, '');
  const schoneAchternaam = achternaam.replace(/[^a-z]/g, '');

  if (schoneVoornaam && schoneAchternaam) {
    document.getElementById('emailPreview').value = schoneVoornaam + '.' + schoneAchternaam;
  } else {
    document.getElementById('emailPreview').value = '';
  }
}

document.getElementById('voornaam').addEventListener('input', updateEmailPreview);
document.getElementById('achternaam').addEventListener('input', updateEmailPreview);

/* Verwerk het registratieformulier */
document.getElementById('registreerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const voornaam = document.getElementById('voornaam').value.trim();
  const achternaam = document.getElementById('achternaam').value.trim();
  const wachtwoord = document.getElementById('wachtwoord').value;
  const wachtwoordBevestig = document.getElementById('wachtwoordBevestig').value;
  const foutmelding = document.getElementById('foutmelding');
  const succesbericht = document.getElementById('succesbericht');

  foutmelding.hidden = true;
  succesbericht.hidden = true;

  if (!voornaam || !achternaam || !wachtwoord || !wachtwoordBevestig) {
    foutmelding.textContent = 'Vul alle velden in.';
    foutmelding.hidden = false;
    return;
  }

  if (wachtwoord.length < 6) {
    foutmelding.textContent = 'Wachtwoord moet minstens 6 tekens lang zijn.';
    foutmelding.hidden = false;
    return;
  }

  if (wachtwoord !== wachtwoordBevestig) {
    foutmelding.textContent = 'Wachtwoorden komen niet overeen.';
    foutmelding.hidden = false;
    return;
  }

  try {
    const antwoord = await fetch(API_URL + '/api/auth/registreren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voornaam, achternaam, wachtwoord })
    });

    const data = await antwoord.json();

    if (!antwoord.ok) {
      foutmelding.textContent = data.fout || 'Registratie mislukt.';
      foutmelding.hidden = false;
      return;
    }

    succesbericht.textContent = 'Account aangemaakt! Je wordt doorgestuurd naar de loginpagina.';
    succesbericht.hidden = false;

    /* Stuur door naar de loginpagina na 2 seconden */
    setTimeout(function () {
      window.location.href = 'login.html?rol=mentor';
    }, 2000);

  } catch (fout) {
    foutmelding.textContent = 'Kan geen verbinding maken met de server.';
    foutmelding.hidden = false;
  }
});
