const API_URL = 'http://localhost:3000'

const token = localStorage.getItem('token')
const rol   = localStorage.getItem('rol')

if (!token || rol !== 'docent') {
  window.location.href = '../index.html'
}

const inhoud        = document.getElementById('evaluatieInhoud')
const stageSelectie = document.getElementById('stageSelectie')

/* Laad stages die de docent begeleidt */
async function laadStages() {
  try {
    const antwoord = await fetch(API_URL + '/api/stages/mijn', {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    if (!antwoord.ok) {
      stageSelectie.innerHTML = '<option value="">Kan stages niet laden</option>'
      return
    }

    const stages = await antwoord.json()

    stageSelectie.innerHTML = '<option value="">Kies een student...</option>'
    for (const s of stages) {
      const optie = document.createElement('option')
      optie.value = s.id
      optie.textContent = s.student_naam || 'Student ' + s.student_id
      stageSelectie.appendChild(optie)
    }

  } catch (fout) {
    stageSelectie.innerHTML = '<option value="">Serverfout</option>'
  }
}

/* Laad evaluaties voor de geselecteerde stage */
async function laadEvaluaties(stageId) {
  inhoud.innerHTML = '<p class="tekst-muted">Laden...</p>'

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/stage/' + stageId, {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    const evaluaties = await antwoord.json()

    if (evaluaties.length === 0) {
      inhoud.innerHTML = `
        <p class="tekst-muted" style="margin-bottom:16px">Nog geen evaluatiemomenten voor deze student.</p>
        <button class="btn btn--primair btn--sm" onclick="maakEvaluatie(${stageId})">Nieuw evaluatiemoment aanmaken</button>
      `
      return
    }

    inhoud.innerHTML = `
      <div style="margin-bottom:16px">
        <button class="btn btn--primair btn--sm" onclick="maakEvaluatie(${stageId})">Nieuw evaluatiemoment aanmaken</button>
      </div>
    `

    for (const ev of evaluaties) {
      const kaart = document.createElement('div')
      kaart.className = 'kaart'
      kaart.style.marginBottom = '24px'
      kaart.innerHTML = `
        <div class="kaart-titel">
          ${ev.type_naam === 'finaal' ? 'Finale evaluatie' : 'Tussentijdse evaluatie'} &mdash; ${formateerDatum(ev.datum)}
          ${ev.eindresultaat_score !== null ? '<span class="badge badge--goedgekeurd" style="float:right">Eindscore: ' + ev.eindresultaat_score + '</span>' : ''}
        </div>
        <div class="formulier-kaart" id="beoordelingen-${ev.id}">
          <p class="tekst-muted">Laden...</p>
        </div>
        <div class="formulier-kaart" style="border-top:1px solid var(--color-border-light)">
          <div class="form-rij form-rij--2">
            <div class="form-group">
              <label>Eindscore</label>
              <input type="number" min="0" max="20" step="0.5"
                id="eindscore-${ev.id}"
                value="${ev.eindresultaat_score !== null ? ev.eindresultaat_score : ''}"
                placeholder="0 t/m 20"
              />
            </div>
            <div class="form-group">
              <label>Algemene feedback</label>
              <input type="text"
                id="algfeedback-${ev.id}"
                value="${ev.algemene_feedback || ''}"
                placeholder="Optionele algemene feedback..."
              />
            </div>
          </div>
          <div class="form-acties">
            <button class="btn btn--primair btn--sm" onclick="sluitEvaluatieAf(${ev.id})">Eindscore opslaan</button>
          </div>
        </div>
      `
      inhoud.appendChild(kaart)
      laadBeoordelingen(ev.id)
    }

  } catch (fout) {
    inhoud.innerHTML = '<p class="melding melding--fout">Kan geen verbinding maken met de server.</p>'
  }
}

async function laadBeoordelingen(evaluatieId) {
  const container = document.getElementById('beoordelingen-' + evaluatieId)

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/' + evaluatieId + '/beoordelingen', {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    const beoordelingen = await antwoord.json()

    if (beoordelingen.length === 0) {
      container.innerHTML = '<p class="tekst-muted">Geen competenties gevonden.</p>'
      return
    }

    container.innerHTML = ''

    for (const b of beoordelingen) {
      const rij = document.createElement('div')
      rij.style.borderBottom = '1px solid var(--color-border-light)'
      rij.style.padding = '16px 0'

      rij.innerHTML = `
        <p style="font-weight:bold;margin-bottom:8px">${b.competentie_naam}</p>

        ${b.student_reflectie ? `<p style="margin-bottom:8px"><em>Reflectie student:</em> ${b.student_reflectie}</p>` : '<p class="tekst-muted" style="margin-bottom:8px">Student heeft nog geen reflectie ingevuld.</p>'}
        ${b.mentor_score !== null ? `<p style="margin-bottom:8px"><strong>Score mentor:</strong> ${b.mentor_score}/10 &mdash; ${b.mentor_feedback || 'geen feedback'}</p>` : ''}

        <div class="form-group" style="max-width:400px">
          <label>Jouw feedback (docent)</label>
          <textarea
            id="docentfeedback-${evaluatieId}-${b.competentie_id}"
            class="feedback-input"
            rows="2"
            placeholder="Geef feedback op deze competentie..."
          >${b.docent_feedback || ''}</textarea>
        </div>

        <div class="form-acties">
          <button
            class="btn btn--primair btn--sm"
            onclick="slaDocentFeedbackOp(${evaluatieId}, ${b.competentie_id})"
          >Feedback opslaan</button>
        </div>
      `

      container.appendChild(rij)
    }

  } catch (fout) {
    container.innerHTML = '<p class="melding melding--fout">Kon beoordelingen niet laden.</p>'
  }
}

/* Maak een nieuw evaluatiemoment aan */
async function maakEvaluatie(stageId) {
  const type = prompt('Welk type evaluatie?\n1 = Tussentijds\n2 = Finaal\n\nVoer 1 of 2 in:')
  const type_id = type === '2' ? 2 : 1
  const datum = new Date().toISOString().split('T')[0]

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ stage_id: stageId, type_id, datum })
    })

    if (antwoord.ok) {
      laadEvaluaties(stageId)
    } else {
      const data = await antwoord.json()
      alert(data.fout || 'Aanmaken mislukt.')
    }
  } catch (fout) {
    alert('Kan geen verbinding maken met de server.')
  }
}

/* Sla docent feedback op per competentie */
async function slaDocentFeedbackOp(evaluatieId, competentieId) {
  const feedback = document.getElementById('docentfeedback-' + evaluatieId + '-' + competentieId).value

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/' + evaluatieId + '/docent-feedback', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ competentie_id: competentieId, docent_feedback: feedback })
    })

    if (antwoord.ok) {
      alert('Feedback opgeslagen.')
    } else {
      alert('Opslaan mislukt.')
    }
  } catch (fout) {
    alert('Kan geen verbinding maken met de server.')
  }
}

/* Sla de eindscore op en sluit de evaluatie af */
async function sluitEvaluatieAf(evaluatieId) {
  const score    = document.getElementById('eindscore-' + evaluatieId).value
  const feedback = document.getElementById('algfeedback-' + evaluatieId).value

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/' + evaluatieId + '/afsluiten', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        eindresultaat_score: score ? parseFloat(score) : null,
        algemene_feedback: feedback || null
      })
    })

    if (antwoord.ok) {
      alert('Eindscore opgeslagen.')
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

/* Globale functies voor onclick in HTML */
window.maakEvaluatie        = maakEvaluatie
window.slaDocentFeedbackOp  = slaDocentFeedbackOp
window.sluitEvaluatieAf     = sluitEvaluatieAf

stageSelectie.addEventListener('change', function () {
  if (this.value) {
    laadEvaluaties(this.value)
  } else {
    inhoud.innerHTML = ''
  }
})

laadStages()
