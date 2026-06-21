const API_URL = 'http://localhost:3000'

const token = localStorage.getItem('token')
const rol   = localStorage.getItem('rol')

if (!token || rol !== 'docent') {
  window.location.href = '../index.html'
}

const inhoud         = document.getElementById('evaluatieInhoud')
const studentenLijst = document.getElementById('studentenLijst')

/* Laad de toegewezen studenten als lijst */
async function laadStages() {
  try {
    const antwoord = await fetch(API_URL + '/api/docent/mijn-studenten', {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    if (!antwoord.ok) {
      studentenLijst.innerHTML = '<tr><td colspan="4">Kan studenten niet laden.</td></tr>'
      return
    }

    const studenten = await antwoord.json()

    if (studenten.length === 0) {
      studentenLijst.innerHTML = '<tr><td colspan="4">Je hebt nog geen toegewezen studenten.</td></tr>'
      return
    }

    studentenLijst.innerHTML = ''
    for (const s of studenten) {
      const naam = (s.voornaam + ' ' + s.achternaam).trim() || 'Student'
      const rij = document.createElement('tr')
      rij.innerHTML =
        '<td>' + naam + '</td>' +
        '<td>' + (s.opleiding || '-') + '</td>' +
        '<td>' + (s.bedrijf || '-') + '</td>' +
        '<td><a class="details-link" href="#" data-stage="' + s.stage_id + '">Openen</a></td>'
      studentenLijst.appendChild(rij)
    }

    studentenLijst.querySelectorAll('.details-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault()
        laadEvaluaties(link.dataset.stage)
      })
    })

  } catch (fout) {
    studentenLijst.innerHTML = '<tr><td colspan="4">Serverfout.</td></tr>'
  }
}

let stageIdHuidig = null

/* Laad evaluaties voor de geselecteerde stage */
async function laadEvaluaties(stageId) {
  stageIdHuidig = stageId
  inhoud.innerHTML = '<p class="tekst-muted">Laden...</p>'

  try {
    const antwoord = await fetch(API_URL + '/api/evaluaties/stage/' + stageId, {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    const evaluaties = await antwoord.json()

    const planKnoppen = `
      <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--primair btn--sm" onclick="maakEvaluatie(${stageId}, 1)">Plan tussentijdse evaluatie</button>
        <button class="btn btn--secundair btn--sm" onclick="maakEvaluatie(${stageId}, 2)">Plan eindevaluatie</button>
      </div>`

    if (evaluaties.length === 0) {
      inhoud.innerHTML = `
        <p class="tekst-muted" style="margin-bottom:16px">Nog geen evaluatiemomenten voor deze student. Plan er een zodat de student zijn zelfreflectie kan invullen.</p>
        ${planKnoppen}
      `
      return
    }

    inhoud.innerHTML = planKnoppen

    for (const ev of evaluaties) {
      const kaart = document.createElement('div')
      kaart.className = 'kaart'
      kaart.style.marginBottom = '24px'
      kaart.innerHTML = `
        <div class="kaart-titel">
          ${ev.type_naam === 'eindevaluatie' ? 'Finale evaluatie' : 'Tussentijdse evaluatie'} &mdash; ${formateerDatum(ev.datum)}
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

        <div style="background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px;margin-bottom:10px;font-size:13px;line-height:1.5">
          <strong>Rubriek</strong><br>
          <span>5 (sterk): ${b.rubric_volledig || '-'}</span><br>
          <span>3 (goed): ${b.rubric_goed || '-'}</span><br>
          <span>1 (onvoldoende): ${b.rubric_onvoldoende || '-'}</span>
        </div>

        ${b.student_score != null ? `<p style="margin-bottom:4px"><em>Zelfscore student:</em> ${b.student_score}/5</p>` : ''}
        ${b.student_reflectie ? `<p style="margin-bottom:8px"><em>Reflectie student:</em> ${b.student_reflectie}</p>` : '<p class="tekst-muted" style="margin-bottom:8px">Student heeft nog geen reflectie ingevuld.</p>'}
        ${b.mentor_score !== null ? `<p style="margin-bottom:8px"><strong>Score mentor:</strong> ${b.mentor_score}/5 &mdash; ${b.mentor_feedback || 'geen feedback'}</p>` : ''}

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
          <button class="btn btn--secundair btn--sm" onclick="toonRubriek(${b.competentie_id})">Rubriek aanpassen</button>
        </div>

        <div id="rubriek-${b.competentie_id}" style="display:none;margin-top:12px">
          <div class="form-group" style="max-width:520px">
            <label>Rubriek - sterk (5)</label>
            <textarea id="rub-vol-${b.competentie_id}" rows="2">${b.rubric_volledig || ''}</textarea>
          </div>
          <div class="form-group" style="max-width:520px">
            <label>Rubriek - goed (3)</label>
            <textarea id="rub-goed-${b.competentie_id}" rows="2">${b.rubric_goed || ''}</textarea>
          </div>
          <div class="form-group" style="max-width:520px">
            <label>Rubriek - onvoldoende (1)</label>
            <textarea id="rub-onv-${b.competentie_id}" rows="2">${b.rubric_onvoldoende || ''}</textarea>
          </div>
          <div class="form-acties">
            <button class="btn btn--primair btn--sm" onclick="slaRubriekOp(${stageIdHuidig}, ${b.competentie_id})">Rubriek opslaan</button>
          </div>
        </div>
      `

      container.appendChild(rij)
    }

  } catch (fout) {
    container.innerHTML = '<p class="melding melding--fout">Kon beoordelingen niet laden.</p>'
  }
}

/* Maak een nieuw evaluatiemoment aan (type_id 1 = tussentijds, 2 = finaal) */
async function maakEvaluatie(stageId, type_id) {
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

/* Toon of verberg de rubriek-editor van een competentie */
function toonRubriek(competentieId) {
  const vak = document.getElementById('rubriek-' + competentieId)
  vak.style.display = vak.style.display === 'none' ? 'block' : 'none'
}

/* Sla de aangepaste rubriekteksten van een competentie op */
async function slaRubriekOp(stageId, competentieId) {
  const body = {
    rubric_volledig: document.getElementById('rub-vol-' + competentieId).value,
    rubric_goed: document.getElementById('rub-goed-' + competentieId).value,
    rubric_onvoldoende: document.getElementById('rub-onv-' + competentieId).value
  }

  try {
    const antwoord = await fetch(API_URL + '/api/competenties/' + competentieId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(body)
    })

    if (antwoord.ok) {
      alert('Rubriek opgeslagen.')
      laadEvaluaties(stageId)
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
window.toonRubriek          = toonRubriek
window.slaRubriekOp         = slaRubriekOp

laadStages()
