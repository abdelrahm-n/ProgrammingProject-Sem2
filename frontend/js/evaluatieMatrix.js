/* Gedeelde evaluatie-matrix voor student, mentor en docent.
   Toont de competentielijst met de scores van alle drie de rollen.
   Klik op een competentie -> venster met score (1-5) + motivering. */

const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('token') || ''
const rolRaw = localStorage.getItem('rol') || ''
const mijnRol = rolRaw === 'mentor' ? 'stagementor' : rolRaw === 'commissie' ? 'stagecommissie' : rolRaw

const SCORE_LBL = { 1: 'Onvoldoende', 2: 'Matig', 3: 'Voldoende', 4: 'Goed', 5: 'Uitstekend' }

/* fase = 'tussentijds' | 'eind' (begininstelling uit de sidebar-link ?fase=) */
let fase = new URLSearchParams(window.location.search).get('fase') === 'eind' ? 'eind' : 'tussentijds'
let momentId = null
let momenten = []
let beoordelingen = []
let stageEinddatum = null

/* Voor mentor/docent: eerst een student kiezen */
let studenten = []
let gekozenStageId = null
let gekozenStudentNaam = ''

const root = document.getElementById('evalRoot')

function esc(t) { if (t == null) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML }

/* Welke score/comment-kolom is van de ingelogde rol */
function veldNamen() {
  if (mijnRol === 'student') return { score: 'student_score', comment: 'student_reflectie' }
  if (mijnRol === 'stagementor') return { score: 'mentor_score', comment: 'mentor_feedback' }
  if (mijnRol === 'docent') return { score: 'docent_score', comment: 'docent_feedback' }
  return { score: null, comment: null }
}

/* Zijn alle competenties voor een bepaalde rol-kolom al ingevuld? */
function alleIngevuld(veld) {
  return beoordelingen.length > 0 && beoordelingen.every(b => b[veld] != null)
}

/* Reden waarom de ingelogde rol (nog) niet mag invullen, of null als het mag.
   Volgorde: eerst de student, dan de mentor, dan de docent. */
function bewerkBlokkade() {
  if (!momentId) return 'Er is nog geen evaluatie aangemaakt.'
  if (fase === 'eind' && !eindOntgrendeld()) {
    return 'De eindevaluatie is vergrendeld tot het einde van je stage' +
      (stageEinddatum ? ' (' + new Date(stageEinddatum).toLocaleDateString('nl-BE') + ')' : '') + '.'
  }
  if (mijnRol === 'student') return null
  if (mijnRol === 'stagementor') {
    return alleIngevuld('student_score') ? null : 'Wacht tot de student de evaluatie heeft ingevuld.'
  }
  if (mijnRol === 'docent') {
    return alleIngevuld('mentor_score') ? null : 'Wacht tot de mentor de evaluatie heeft ingevuld.'
  }
  return 'Geen toegang.'
}

/* Mag de ingelogde rol nog invullen in deze fase? */
function magBewerken() {
  return bewerkBlokkade() === null
}

function eindOntgrendeld() {
  /* Mentor en docent kunnen invullen zodra de eindevaluatie bestaat */
  if (mijnRol !== 'student') return true
  /* Zodra de docent het eindcijfer heeft ingediend is de eindevaluatie zichtbaar */
  const eindMoment = momenten.find(m => m.type_naam === 'eindevaluatie')
  if (eindMoment && eindMoment.eindresultaat_score != null) return true
  if (!stageEinddatum) return false
  /* Anders pas vanaf de dag vóór de einddatum tot en met de einddatum. */
  const eind = new Date(stageEinddatum)
  const drempel = new Date(eind)
  drempel.setDate(eind.getDate() - 1)
  return new Date() >= drempel
}

function typeNaamVoorFase(f) {
  return f === 'eind' ? 'eindevaluatie' : 'tussentijdse_evaluatie'
}

/* ---- data laden ---- */

async function laadMomenten() {
  if (mijnRol === 'student') {
    /* Student haalt zijn eigen momenten op */
    const res = await fetch(API_URL + '/api/evaluaties/mijn', { headers: { 'Authorization': 'Bearer ' + token } })
    momenten = res.ok ? await res.json() : []

    /* Einddatum van de stage voor de vergrendeling van de eindevaluatie */
    try {
      const r2 = await fetch(API_URL + '/api/stages/mijn/actief', { headers: { 'Authorization': 'Bearer ' + token } })
      if (r2.ok) { const d = await r2.json(); stageEinddatum = d.stage ? d.stage.einddatum : null }
    } catch (e) { /* geen actieve stage */ }
  } else {
    /* Mentor/docent: momenten van de gekozen stage */
    momenten = []
    if (gekozenStageId) {
      const res = await fetch(API_URL + '/api/evaluaties/stage/' + gekozenStageId, { headers: { 'Authorization': 'Bearer ' + token } })
      momenten = res.ok ? await res.json() : []
    }
  }
}

/* Mentor/docent: lijst van toegewezen studenten */
async function laadStudenten() {
  const res = await fetch(API_URL + '/api/logboeken/studenten', { headers: { 'Authorization': 'Bearer ' + token } })
  studenten = res.ok ? await res.json() : []
}

function renderPicker() {
  if (!studenten.length) { root.innerHTML = '<div class="dashboard-card"><p>Je hebt nog geen toegewezen studenten.</p></div>'; return }
  let html = '<div class="dashboard-card" style="padding:0;overflow:hidden"><table style="width:100%;border-collapse:collapse">'
  html += '<thead><tr style="border-bottom:1px solid #e2e8f0;text-align:left"><th style="padding:12px 14px;color:#64748b">Student</th><th style="padding:12px 14px;color:#64748b">Bedrijf</th><th style="width:24px"></th></tr></thead><tbody>'
  studenten.forEach((s, i) => {
    html += `<tr style="border-bottom:1px solid #f1f5f9;cursor:pointer" onclick="kiesStudent(${i})">
      <td style="padding:12px 14px"><strong>${esc((s.voornaam + ' ' + s.achternaam).trim())}</strong></td>
      <td style="padding:12px 14px;color:#64748b">${esc(s.bedrijf || '-')}</td>
      <td style="padding:12px 6px;color:#cbd5e1">›</td></tr>`
  })
  html += '</tbody></table></div>'
  root.innerHTML = html
}

window.kiesStudent = async function (i) {
  const s = studenten[i]
  gekozenStageId = s.stage_id
  gekozenStudentNaam = (s.voornaam + ' ' + s.achternaam).trim()
  await laadMomenten()
  await laadBeoordelingen()
  render()
}

/* Docent maakt het evaluatiemoment aan voor de gekozen student */
window.maakMoment = async function () {
  const datum = new Date().toISOString().split('T')[0]
  const res = await fetch(API_URL + '/api/evaluaties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ stage_id: gekozenStageId, type_id: fase === 'eind' ? 2 : 1, datum })
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) { alert(d.fout || 'Aanmaken mislukt'); return }
  await laadMomenten()
  await laadBeoordelingen()
  render()
}

window.terugNaarStudenten = function () {
  gekozenStageId = null
  gekozenStudentNaam = ''
  momenten = []
  beoordelingen = []
  renderPicker()
}

async function laadBeoordelingen() {
  const moment = momenten.find(m => m.type_naam === typeNaamVoorFase(fase))
  momentId = moment ? moment.id : null
  beoordelingen = []
  if (momentId) {
    const res = await fetch(API_URL + '/api/evaluaties/' + momentId + '/beoordelingen', { headers: { 'Authorization': 'Bearer ' + token } })
    if (res.ok) beoordelingen = await res.json()
  }
}

/* ---- render ---- */

function rolBadge(r, actief) {
  const kleur = { student: '#1e6fb8', mentor: '#c0392b', docent: '#0a0a0a' }[r] || '#64748b'
  const bg = { student: '#e3effb', mentor: '#fdecea', docent: '#0a0a0a' }[r] || '#eee'
  const fg = r === 'docent' ? '#fff' : kleur
  return `<span style="font-size:10px;padding:2px 8px;border-radius:9px;font-weight:700;background:${bg};color:${fg}">${r}</span>`
}

function pil(score, eigen) {
  if (score == null) return '<span style="color:#cbd5e1">—</span>'
  const stijl = eigen ? 'background:#fdecea;color:#c0392b;padding:2px 8px;border-radius:9px;font-weight:700' : 'font-weight:600'
  return `<span style="${stijl}">${score}/5</span>`
}

function render() {
  try {
  let html = ''

  /* Mentor/docent: naam van de gekozen student + terug naar de lijst */
  if (mijnRol !== 'student') {
    html += `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <button class="btn btn--secundair btn--sm" onclick="terugNaarStudenten()">← Andere student</button>
      <strong>${esc(gekozenStudentNaam)}</strong>
    </div>`
  }

  /* Tabs tussentijds / eind */
  html += `<div style="display:flex;gap:8px;margin-bottom:16px">
    <button class="btn ${fase === 'tussentijds' ? 'btn--primair' : 'btn--secundair'} btn--sm" onclick="zetFase('tussentijds')">Tussentijdse evaluatie</button>
    <button class="btn ${fase === 'eind' ? 'btn--primair' : 'btn--secundair'} btn--sm" onclick="zetFase('eind')">Eindevaluatie</button>
  </div>`

  if (fase === 'eind' && !eindOntgrendeld()) {
    html += `<div class="dashboard-card"><p>De eindevaluatie is vergrendeld tot het einde van je stage${stageEinddatum ? ' (' + new Date(stageEinddatum).toLocaleDateString('nl-BE') + ')' : ''}.</p></div>`
    root.innerHTML = html
    return
  }

  if (!momentId) {
    const label = fase === 'eind' ? 'eindevaluatie' : 'tussentijdse evaluatie'
    if (mijnRol === 'docent' && gekozenStageId) {
      html += `<div class="dashboard-card"><p>Er is nog geen ${label} voor deze student.</p>
        <button class="btn btn--primair btn--sm" onclick="maakMoment()">Maak ${label} aan</button></div>`
    } else {
      html += `<div class="dashboard-card"><p>Er is nog geen ${label} aangemaakt door je begeleider.</p></div>`
    }
    root.innerHTML = html
    return
  }

  const v = veldNamen()
  const ingevuld = beoordelingen.filter(b => b[v.score] != null).length

  /* Kop: voortgang + indienen, of uitleg waarom je (nog) niet mag invullen */
  if (magBewerken()) {
    html += `<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
      <strong>${ingevuld}/${beoordelingen.length}</strong> <span style="color:#64748b">competenties ingevuld</span>
      <button class="btn btn--primair btn--sm" ${ingevuld < beoordelingen.length ? 'disabled' : ''} onclick="dienIn()">Indienen</button>
    </div>`
  } else {
    const reden = bewerkBlokkade()
    if (reden) {
      html += `<div style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:10px;padding:10px 14px;margin-bottom:12px">${esc(reden)} Je kunt de scores hieronder wel al bekijken.</div>`
    }
  }

  /* Legende */
  html += `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;gap:16px;flex-wrap:wrap;font-size:13px">
    ${[1, 2, 3, 4, 5].map(n => `<span><b>${n}</b> ${SCORE_LBL[n]}</span>`).join('')}
  </div>`

  /* Matrix */
  html += `<div class="dashboard-card" style="padding:0;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="border-bottom:1px solid #e2e8f0;text-align:left">
        <th style="padding:12px 14px;color:#64748b;font-weight:600">Competentie</th>
        <th style="padding:12px 6px;text-align:center">${rolBadge('student')}</th>
        <th style="padding:12px 6px;text-align:center">${rolBadge('mentor')}</th>
        <th style="padding:12px 6px;text-align:center">${rolBadge('docent')}</th>
        <th style="width:24px"></th>
      </tr></thead><tbody>`

  beoordelingen.forEach((b, i) => {
    html += `<tr style="border-bottom:1px solid #f1f5f9;cursor:pointer" onclick="openComp(${i})">
      <td style="padding:12px 14px"><strong>${esc(b.competentie_naam)}</strong></td>
      <td style="padding:12px 6px;text-align:center">${pil(b.student_score, mijnRol === 'student')}</td>
      <td style="padding:12px 6px;text-align:center">${pil(b.mentor_score, mijnRol === 'stagementor')}</td>
      <td style="padding:12px 6px;text-align:center">${pil(b.docent_score, mijnRol === 'docent')}</td>
      <td style="padding:12px 6px;color:#cbd5e1">›</td>
    </tr>`
  })

  html += `</tbody></table></div>`
  root.innerHTML = html
  } catch (e) {
    root.innerHTML = '<div class="dashboard-card"><p>Fout bij weergeven van de evaluatie: ' + esc(e.message) + '</p></div>'
  }
}

window.zetFase = async function (f) {
  fase = f
  await laadBeoordelingen()
  render()
}

/* ---- modal per competentie ---- */

function modalSluit() {
  const m = document.getElementById('evalModal')
  if (m) m.remove()
}
window.modalSluit = modalSluit

window.openComp = function (i) {
  const b = beoordelingen[i]
  const v = veldNamen()
  const bewerk = magBewerken()
  const eigenScore = v.score ? b[v.score] : null
  const eigenComment = v.comment ? (b[v.comment] || '') : ''

  /* Score-knoppen of leesweergave */
  let mijnBlok = ''
  if (bewerk) {
    mijnBlok = `
      <div style="font-weight:600;margin:14px 0 6px">Jouw score</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px" id="scoreKnoppen">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" onclick="kiesScore(${i},${n})"
          style="width:42px;height:42px;border-radius:8px;border:1px solid #d8d8d8;cursor:pointer;font-weight:700;${Number(eigenScore) === n ? 'background:#c0392b;color:#fff;border-color:#c0392b' : 'background:#fff'}">${n}</button>`).join('')}
        <span id="scoreLbl" style="align-self:center;color:#64748b;margin-left:6px">${eigenScore ? SCORE_LBL[eigenScore] : ''}</span>
      </div>
      <textarea id="eigenComment" rows="3" style="width:100%;padding:8px;border:1px solid #d8d8d8;border-radius:6px" placeholder="Motiveer je score met concrete voorbeelden...">${esc(eigenComment)}</textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn btn--primair btn--sm" onclick="slaCompOp(${i})">Opslaan</button></div>`
  }

  /* Antwoorden van de andere rollen (en die van jezelf in leesweergave als je niet mag bewerken) */
  function blok(naam, rol, score, comment) {
    if (score == null && !comment) return ''
    return `<div style="border:1px solid #eee;border-radius:8px;padding:10px 12px;margin-top:10px">
      <div style="display:flex;align-items:center;gap:8px;font-weight:600">${rolBadge(rol)} ${score != null ? score + '/5 - ' + SCORE_LBL[score] : ''}</div>
      <div style="color:#475569;margin-top:4px">${comment ? esc(comment) : '<span style="color:#9ca3af">Geen motivering</span>'}</div>
    </div>`
  }

  let anderen = ''
  if (mijnRol !== 'student') anderen += blok('Student', 'student', b.student_score, b.student_reflectie)
  if (mijnRol !== 'stagementor') anderen += blok('Mentor', 'mentor', b.mentor_score, b.mentor_feedback)
  if (mijnRol !== 'docent') anderen += blok('Docent', 'docent', b.docent_score, b.docent_feedback)

  const rubriek = `<div style="background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px 12px;margin-top:12px;font-size:12.5px;line-height:1.6">
    <strong>Rubriek</strong><br>
    5 (sterk): ${esc(b.rubric_volledig || '-')}<br>
    3 (goed): ${esc(b.rubric_goed || '-')}<br>
    1 (onvoldoende): ${esc(b.rubric_onvoldoende || '-')}</div>`

  const modal = document.createElement('div')
  modal.id = 'evalModal'
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;justify-content:center;align-items:center'
  modal.innerHTML = `<div style="background:#fff;border-radius:10px;padding:22px;max-width:560px;width:92%;max-height:90vh;overflow:auto">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <h3 style="margin:0">${esc(b.competentie_naam)}</h3>
      <button onclick="modalSluit()" style="background:none;border:none;font-size:22px;cursor:pointer;line-height:1">×</button>
    </div>
    <p style="color:#64748b;margin:4px 0 0">${esc(b.beschrijving || '')}</p>
    ${mijnBlok}
    ${anderen}
    ${rubriek}
  </div>`
  modal.addEventListener('click', e => { if (e.target === modal) modalSluit() })
  document.body.appendChild(modal)
}

let gekozenScore = {}
window.kiesScore = function (i, n) {
  gekozenScore[i] = n
  document.querySelectorAll('#scoreKnoppen button').forEach(btn => {
    const sel = Number(btn.dataset.n) === n
    btn.style.background = sel ? '#c0392b' : '#fff'
    btn.style.color = sel ? '#fff' : ''
    btn.style.borderColor = sel ? '#c0392b' : '#d8d8d8'
  })
  document.getElementById('scoreLbl').textContent = SCORE_LBL[n]
}

window.slaCompOp = async function (i) {
  const b = beoordelingen[i]
  const v = veldNamen()
  const score = gekozenScore[i] != null ? gekozenScore[i] : b[v.score]
  const comment = document.getElementById('eigenComment').value.trim()
  if (!score) { alert('Kies eerst een score.'); return }

  let url, body
  if (mijnRol === 'student') {
    url = '/api/evaluaties/' + momentId + '/reflectie'
    body = { competentie_id: b.competentie_id, student_score: score, student_reflectie: comment }
  } else if (mijnRol === 'stagementor') {
    url = '/api/evaluaties/' + momentId + '/score'
    body = { competentie_id: b.competentie_id, mentor_score: score, mentor_feedback: comment }
  } else {
    url = '/api/evaluaties/' + momentId + '/docent-feedback'
    body = { competentie_id: b.competentie_id, docent_score: score, docent_feedback: comment }
  }

  const res = await fetch(API_URL + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(body)
  })
  if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.fout || 'Opslaan mislukt'); return }

  delete gekozenScore[i]
  modalSluit()
  await laadBeoordelingen()
  render()
}

window.dienIn = async function () {
  /* Docent eindevaluatie -> afsluiten met automatisch eindcijfer */
  if (mijnRol === 'docent' && fase === 'eind') {
    const res = await fetch(API_URL + '/api/evaluaties/' + momentId + '/afsluiten', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({})
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) { alert('Eindevaluatie afgesloten. Eindcijfer: ' + d.eindscore + '/20'); }
    else { alert(d.fout || 'Afsluiten mislukt'); }
    await laadBeoordelingen(); render(); return
  }
  alert(fase === 'eind' ? 'Je eindevaluatie is ingediend.' : 'Je tussentijdse evaluatie is ingediend.')
}

/* ---- start ---- */
async function start() {
  if (!root) return
  if (!token) { root.innerHTML = '<p>Niet ingelogd.</p>'; return }
  try {
    if (mijnRol === 'student') {
      await laadMomenten()
      await laadBeoordelingen()
      render()
    } else {
      await laadStudenten()
      renderPicker()
    }
  } catch (e) {
    root.innerHTML = '<div class="dashboard-card"><p>Kon de evaluatie niet laden: ' + esc(e.message) +
      '</p><p>Controleer of de backend draait (npm start) en open de app via http://localhost:3000.</p></div>'
  }
}
start()
