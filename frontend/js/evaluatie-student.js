const API_URL = 'http://localhost:3000'

const token = localStorage.getItem('token')
const rol   = localStorage.getItem('rol')

if (!token || rol !== 'student') {
  window.location.href = '../index.html'
}

const inhoud = document.getElementById('evaluatieInhoud')

/* Laad de evaluatiemomenten van de student */
async function laadEvaluaties() {
  inhoud.innerHTML = '<p class="tekst-muted">Laden...</p>'

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/mijn', {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    if (!antwoord.ok) {
      inhoud.innerHTML = '<p class="melding melding--fout">Kon evaluaties niet laden.</p>'
      return
    }

    const evaluaties = await antwoord.json()

    if (evaluaties.length === 0) {
      inhoud.innerHTML = '<p class="tekst-muted">Er zijn nog geen evaluaties voor jou beschikbaar.</p>'
      return
    }

    /* Toon elke evaluatie als een kaart */
    inhoud.innerHTML = ''
    for (const ev of evaluaties) {
      const kaart = maakEvaluatieKaart(ev)
      inhoud.appendChild(kaart)
    }

  } catch (fout) {
    inhoud.innerHTML = '<p class="melding melding--fout">Kan geen verbinding maken met de server.</p>'
  }
}

function maakEvaluatieKaart(ev) {
  const div = document.createElement('div')
  div.className = 'kaart'
  div.style.marginBottom = '24px'

  div.innerHTML = `
    <div class="kaart-titel">
      ${ev.type_naam === 'finaal' ? 'Finale evaluatie' : 'Tussentijdse evaluatie'} &mdash; ${formateerDatum(ev.datum)}
      ${ev.eindresultaat_score !== null ? '<span class="badge badge--goedgekeurd" style="float:right">Score: ' + ev.eindresultaat_score + '</span>' : ''}
    </div>
    <div class="formulier-kaart" id="beoordelingen-${ev.id}">
      <p class="tekst-muted">Beoordelingen laden...</p>
    </div>
  `

  /* Laad de beoordelingen voor dit evaluatiemoment */
  laadBeoordelingen(ev.id)

  return div
}

async function laadBeoordelingen(evaluatieId) {
  const container = document.getElementById('beoordelingen-' + evaluatieId)

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/' + evaluatieId + '/beoordelingen', {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    const beoordelingen = await antwoord.json()

    if (beoordelingen.length === 0) {
      container.innerHTML = '<p class="tekst-muted">Nog geen competenties ingevuld.</p>'
      return
    }

    container.innerHTML = ''

    for (const b of beoordelingen) {
      const rij = document.createElement('div')
      rij.style.borderBottom = '1px solid var(--color-border-light)'
      rij.style.padding = '16px 0'

      rij.innerHTML = `
        <p style="font-weight:bold;margin-bottom:8px">${b.competentie_naam}</p>

        <div class="form-group">
          <label>Jouw reflectie</label>
          <textarea
            id="reflectie-${evaluatieId}-${b.competentie_id}"
            class="feedback-input"
            rows="3"
            placeholder="Beschrijf hoe jij deze competentie hebt aangetoond..."
          >${b.student_reflectie || ''}</textarea>
        </div>

        <div class="form-acties">
          <button
            class="btn btn--primair btn--sm"
            onclick="slaReflectieOp(${evaluatieId}, ${b.competentie_id})"
          >Opslaan</button>
        </div>

        ${b.mentor_score !== null ? `<p style="margin-top:12px"><strong>Score mentor:</strong> ${b.mentor_score}/10</p>` : ''}
        ${b.mentor_feedback ? `<p><strong>Feedback mentor:</strong> ${b.mentor_feedback}</p>` : ''}
        ${b.docent_feedback ? `<p><strong>Feedback docent:</strong> ${b.docent_feedback}</p>` : ''}
      `

      container.appendChild(rij)
    }

  } catch (fout) {
    container.innerHTML = '<p class="melding melding--fout">Kon beoordelingen niet laden.</p>'
  }
}

/* Sla de reflectie op van de student */
async function slaReflectieOp(evaluatieId, competentieId) {
  const tekst = document.getElementById('reflectie-' + evaluatieId + '-' + competentieId).value

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/' + evaluatieId + '/reflectie', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ competentie_id: competentieId, student_reflectie: tekst })
    })

    if (antwoord.ok) {
      alert('Reflectie opgeslagen.')
    } else {
      alert('Opslaan mislukt.')
    }
  } catch (fout) {
    alert('Kan geen verbinding maken met de server.')
  }
}

function formateerDatum(datum) {
  if (!datum) return ''
  return new Date(datum).toLocaleDateString('nl-BE')
}

/* Maak de functie globaal zodat de onclick in HTML werkt */
window.slaReflectieOp = slaReflectieOp

laadEvaluaties()
