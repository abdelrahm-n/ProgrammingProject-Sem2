const API_URL = 'http://localhost:3000'

const token = localStorage.getItem('token')
const rol   = localStorage.getItem('rol')

if (!token || rol !== 'mentor') {
  window.location.href = '../index.html'
}

const inhoud        = document.getElementById('evaluatieInhoud')
const stageSelectie = document.getElementById('stageSelectie')

/* Laad de stages die de mentor begeleidt */
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

/* Laad evaluaties voor de gekozen stage */
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
        </div>
        <div class="formulier-kaart" id="beoordelingen-${ev.id}">
          <p class="tekst-muted">Laden...</p>
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

        ${b.student_score != null ? `<p style="margin-bottom:4px"><em>Zelfscore student:</em> ${b.student_score}/5</p>` : ''}
        ${b.student_reflectie ? `<p style="margin-bottom:12px"><em>Reflectie student:</em> ${b.student_reflectie}</p>` : '<p class="tekst-muted" style="margin-bottom:12px">Student heeft nog geen reflectie ingevuld.</p>'}

        <div class="form-rij form-rij--2">
          <div class="form-group">
            <label>Score (1-10)</label>
            <input
              type="number" min="1" max="10"
              id="score-${evaluatieId}-${b.competentie_id}"
              value="${b.mentor_score !== null ? b.mentor_score : ''}"
              placeholder="1 t/m 10"
            />
          </div>
          <div class="form-group">
            <label>Feedback</label>
            <input
              type="text"
              id="feedback-${evaluatieId}-${b.competentie_id}"
              value="${b.mentor_feedback || ''}"
              placeholder="Optionele feedback..."
            />
          </div>
        </div>

        <div class="form-acties">
          <button
            class="btn btn--primair btn--sm"
            onclick="slaScoreOp(${evaluatieId}, ${b.competentie_id})"
          >Score opslaan</button>
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

/* Sla de score op van de mentor */
async function slaScoreOp(evaluatieId, competentieId) {
  const score    = document.getElementById('score-' + evaluatieId + '-' + competentieId).value
  const feedback = document.getElementById('feedback-' + evaluatieId + '-' + competentieId).value

  if (!score || score < 1 || score > 10) {
    alert('Voer een score in tussen 1 en 10.')
    return
  }

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/' + evaluatieId + '/score', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ competentie_id: competentieId, mentor_score: parseInt(score), mentor_feedback: feedback })
    })

    if (antwoord.ok) {
      alert('Score opgeslagen.')
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
window.maakEvaluatie  = maakEvaluatie
window.slaScoreOp     = slaScoreOp

stageSelectie.addEventListener('change', function () {
  if (this.value) {
    laadEvaluaties(this.value)
  } else {
    localStorage.setItem("zelfEvaluatieEinde", JSON.stringify(evaluatie));
  }

  alert("Mentorevaluatie opgeslagen.");
  terugNaarStudenten();
}