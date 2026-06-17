const API_URL = 'http://localhost:3000';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../index.html';
}

const laatsteStatus = document.getElementById('laatste-status');
const startCard = document.getElementById('start-stage-card');
const statusCard = document.getElementById('status-card');
const statusTitel = document.getElementById('status-titel');
const statusTekst = document.getElementById('status-tekst');
const stepAanmaak = document.getElementById('step-aanmaak');
const stepIngediend = document.getElementById('step-ingediend');
const stepBehandeling = document.getElementById('step-behandeling');
const stepGoedgekeurd = document.getElementById('step-goedgekeurd');
const startCardTitle = document.getElementById('start-card-title');
const startCardText = document.getElementById('start-card-text');
const startCardButton = document.getElementById('start-card-button');
const overeenkomstKnop = document.getElementById('overeenkomst-knop');

const actiefDashboard = document.getElementById('actief-dashboard');
const procesDashboard = document.getElementById('proces-dashboard');

function toonProcesDashboard() {
  procesDashboard.style.display = 'block';
  actiefDashboard.style.display = 'none';
}

function toonActiefDashboardWeergave() {
  procesDashboard.style.display = 'none';
  actiefDashboard.style.display = 'block';
}

function activeerStappen(stappen) {
  stappen.forEach(function (s) { s.classList.add('active'); });
}

function toonVoorstelStatus(status, feedback) {
  toonProcesDashboard();
  stepAanmaak.classList.add('active');

  if (status === 'ingediend') {
    activeerStappen([stepIngediend]);
    startCard.style.display = 'none';
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Stageaanvraag ingediend';
    statusTekst.textContent = 'Je stageaanvraag is ingediend en wordt momenteel verwerkt.';
    overeenkomstKnop.style.display = 'none';
  } else if (status === 'goedgekeurd') {
    activeerStappen([stepIngediend, stepBehandeling, stepGoedgekeurd]);
    laatsteStatus.textContent = 'Goedgekeurd';
    startCard.style.display = 'none';
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Stageaanvraag goedgekeurd';
    statusTekst.textContent = 'Je stageaanvraag is goedgekeurd. Je kan nu de stageovereenkomst ondertekenen.';
    overeenkomstKnop.style.display = 'inline-block';
    overeenkomstKnop.textContent = 'Stageovereenkomst indienen';
  } else if (status === 'afgekeurd') {
    activeerStappen([stepIngediend, stepBehandeling]);
    stepGoedgekeurd.classList.add('rejected');
    laatsteStatus.textContent = 'Afgekeurd';
    startCard.style.display = 'block';
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Stageaanvraag afgekeurd';
    var tekst = 'Je stageaanvraag werd afgekeurd.';
    if (feedback) tekst += ' Feedback: ' + feedback;
    statusTekst.textContent = tekst;
    startCardTitle.textContent = 'Stagevoorstel aanpassen';
    startCardText.textContent = 'Pas je stagevoorstel aan op basis van de feedback en dien het opnieuw in.';
    startCardButton.textContent = 'Stagevoorstel aanpassen';
    overeenkomstKnop.style.display = 'none';
  } else if (status === 'aanpassing_vereist') {
    activeerStappen([stepIngediend, stepBehandeling]);
    stepGoedgekeurd.classList.add('warning');
    laatsteStatus.textContent = 'Aanpassing vereist';
    startCard.style.display = 'block';
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Aanpassing vereist';
    var tekst2 = 'Je stagevoorstel moet aangepast worden.';
    if (feedback) tekst2 += ' Feedback: ' + feedback;
    statusTekst.textContent = tekst2;
    startCardTitle.textContent = 'Stagevoorstel aanpassen';
    startCardText.textContent = 'Pas je stagevoorstel aan op basis van de feedback van de stagecommissie.';
    startCardButton.textContent = 'Stagevoorstel aanpassen';
    overeenkomstKnop.style.display = 'none';
  }
}

function toonOvereenkomstStatus(data) {
  stepAanmaak.classList.add('active');
  activeerStappen([stepIngediend, stepBehandeling, stepGoedgekeurd]);
  laatsteStatus.textContent = 'Goedgekeurd';
  startCard.style.display = 'none';
  overeenkomstKnop.style.display = 'none';

  if (data.status === 'actief') {
    laadActiefDashboard();
  } else if (data.status === 'wacht_startdatum') {
    toonProcesDashboard();
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Alle handtekeningen ontvangen';
    statusTekst.textContent = data.bericht;
  } else if (data.status === 'wacht_handtekeningen') {
    toonProcesDashboard();
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Stageovereenkomst in behandeling';
    statusTekst.textContent = data.bericht;
    overeenkomstKnop.style.display = 'inline-block';
    overeenkomstKnop.textContent = 'Stageovereenkomst indienen';
  } else {
    toonProcesDashboard();
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Status onbekend';
    statusTekst.textContent = data.bericht || 'Controleer je dashboard voor de huidige status.';
  }
}

function toonActiefDashboard(data) {
  toonActiefDashboardWeergave();

  document.getElementById('welkom-tekst').textContent = 'Welkom';

  document.getElementById('info-bedrijf').textContent = data.bedrijf.naam;
  document.getElementById('info-data').textContent = data.bedrijf.adres || '';
  document.getElementById('info-mentor').textContent = data.mentor
    ? data.mentor.voornaam + ' ' + data.mentor.achternaam + (data.mentor.functie ? ' (' + data.mentor.functie + ')' : '')
    : 'Nog niet toegewezen';
  document.getElementById('info-docent').textContent = data.docent
    ? data.docent.voornaam + ' ' + data.docent.achternaam
    : 'Nog niet toegewezen';

  var vw = data.voortgang;
  document.getElementById('info-week').textContent = 'Week ' + vw.huidig_week + ' / ' + vw.totaal_weken;
  var pct = vw.totaal_weken > 0 ? Math.round((vw.huidig_week / vw.totaal_weken) * 100) : 0;
  document.getElementById('info-progress-balk').style.width = pct + '%';

  var lb = data.logboeken;
  var maxDagenPerWeek = 5;
  var wekenInStage = vw.totaal_weken || 1;
  var maxTotaalDagen = wekenInStage * maxDagenPerWeek;
  document.getElementById('log-vandaag').textContent = '0';
  document.getElementById('log-week').textContent = '0 / ' + maxDagenPerWeek;
  document.getElementById('log-totaal').textContent = lb.totaal_dagen + ' / ' + maxTotaalDagen;

  var evalBody = document.getElementById('eval-tabel-body');
  evalBody.innerHTML = '';
  if (data.evaluaties && data.evaluaties.length > 0) {
    data.evaluaties.forEach(function (e) {
      var tr = document.createElement('tr');
      var tdType = document.createElement('td');
      tdType.textContent = e.type;
      var tdDatum = document.createElement('td');
      tdDatum.textContent = e.datum ? new Date(e.datum).toLocaleDateString('nl-BE') : 'Nog niet gepland';
      tr.appendChild(tdType);
      tr.appendChild(tdDatum);
      evalBody.appendChild(tr);
    });
  } else {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'Nog geen evaluaties gepland';
    tr.appendChild(td);
    evalBody.appendChild(tr);
  }
}

async function laadActiefDashboard() {
  try {
    var resp = await fetch(API_URL + '/api/stages/mijn/actief', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (resp.ok) {
      var data = await resp.json();
      toonActiefDashboard(data);
    } else {
      toonProcesDashboard();
      statusCard.style.display = 'block';
      statusTitel.textContent = 'Stage is geactiveerd';
      statusTekst.textContent = 'Je stage is geactiveerd maar de details konden niet geladen worden.';
      overeenkomstKnop.style.display = 'none';
    }
  } catch (e) {
    toonProcesDashboard();
    statusCard.style.display = 'block';
    statusTitel.textContent = 'Stage is geactiveerd';
    statusTekst.textContent = 'Je stage is geactiveerd maar de details konden niet geladen worden.';
    overeenkomstKnop.style.display = 'none';
  }
}

async function init() {
  try {
    var resp = await fetch(API_URL + '/api/stages/mijn', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (resp.status === 401) { window.location.href = '../index.html'; return; }

    var data = await resp.json();

    if (!data || data.length === 0) {
      toonProcesDashboard();
      startCard.style.display = 'block';
      statusCard.style.display = 'none';
      return;
    }

    var laatste = data[0];

    if (laatste.status === 'goedgekeurd') {
      var respAct = await fetch(API_URL + '/api/stageovereenkomst/mijn/activateer', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (respAct.ok) {
        var actData = await respAct.json();
        toonOvereenkomstStatus(actData);
        return;
      }
    }

    toonVoorstelStatus(laatste.status, laatste.feedback);
  } catch (e) {
    toonProcesDashboard();
    startCard.style.display = 'block';
    statusCard.style.display = 'none';
  }
}

init();
