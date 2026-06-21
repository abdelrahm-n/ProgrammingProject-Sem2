const API_URL = 'http://localhost:3000'

/* Controleer of de gebruiker is ingelogd als admin */
const token = localStorage.getItem('token')
const rol   = localStorage.getItem('rol')

if (!token || rol !== 'admin') {
  window.location.href = '../index.html'
}

/* Verwerk het formulier voor het aanmaken van een stagementor */
document.getElementById('mentorForm').addEventListener('submit', async function (e) {
  e.preventDefault()

  const voornaam   = document.getElementById('voornaam').value.trim()
  const achternaam = document.getElementById('achternaam').value.trim()
  const wachtwoord = document.getElementById('wachtwoord').value
  const functie    = document.getElementById('functie').value.trim()
  const melding    = document.getElementById('melding')

  melding.className = 'melding'
  melding.textContent = ''

  if (!voornaam || !achternaam || !wachtwoord) {
    melding.className = 'melding melding--fout'
    melding.textContent = 'Voornaam, achternaam en wachtwoord zijn verplicht.'
    return
  }

  if (wachtwoord.length < 6) {
    melding.className = 'melding melding--fout'
    melding.textContent = 'Wachtwoord moet minstens 6 tekens hebben.'
    return
  }

  try {
    const antwoord = await fetch(API_URL + '/api/admin/gebruiker-aanmaken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        voornaam: voornaam,
        achternaam: achternaam,
        wachtwoord: wachtwoord,
        rol: 'stagementor',
        extra: { functie: functie }
      })
    })

    const data = await antwoord.json()

    if (!antwoord.ok) {
      melding.className = 'melding melding--fout'
      melding.textContent = data.fout || 'Aanmaken mislukt.'
      return
    }

    /* Toon het aangemaakte e-mailadres */
    melding.className = 'melding melding--succes'
    melding.textContent = 'Stagementor aangemaakt. E-mailadres: ' + data.email

    /* Leeg het formulier */
    document.getElementById('mentorForm').reset()

  } catch (fout) {
    melding.className = 'melding melding--fout'
    melding.textContent = 'Kan geen verbinding maken met de server.'
  }
})
