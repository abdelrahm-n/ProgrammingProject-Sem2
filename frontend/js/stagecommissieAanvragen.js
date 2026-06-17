const API_URL = 'http://localhost:3000';
const token = localStorage.getItem('token');
if (!token) window.location.href = '../index.html';

const params = new URLSearchParams(window.location.search);
const svId = params.get('sv_id');

function zet(id, waarde) {
  document.getElementById(id).textContent = waarde || '-';
}

async function laadVoorstel() {
  if (!svId) {
    document.querySelector('.stage-aanvraag').innerHTML = '<p>Geen stagevoorstel geselecteerd. Ga terug naar het <a href="dashboard.html">dashboard</a>.</p>';
    return;
  }

  try {
    const resp = await fetch(API_URL + '/api/stages/' + svId, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resp.status === 401) { window.location.href = '../index.html'; return; }
    if (!resp.ok) { document.querySelector('.stage-aanvraag').innerHTML = '<p>Voorstel niet gevonden.</p>'; return; }

    const v = await resp.json();

    zet('aanvraagStudent', v.voornaam + ' ' + v.achternaam);
    zet('aanvraagStudentNummer', v.studentnummer);
    zet('aanvraagOpleiding', v.opleiding);
    zet('aanvraagEmailStudent', v.student_email);
    zet('aanvraagBedrijf', v.bedrijf);
    zet('aanvraagAdres', v.adres);
    zet('aanvraagContactPersoon', v.mentor_voornaam ? v.mentor_voornaam + ' ' + v.mentor_achternaam : '-');
    zet('aanvraagEmailBedrijf', v.bedrijf_email);
    zet('aanvraagTelefoonBedrijf', v.telefoon);
    zet('aanvraagStartDatum', v.startdatum ? new Date(v.startdatum).toLocaleDateString('nl-BE') : '-');
    zet('aanvraagEindDatum', v.einddatum ? new Date(v.einddatum).toLocaleDateString('nl-BE') : '-');
    zet('aanvraagFunctie', v.mentor_functie);
    zet('aanvraagOpdracht', v.omschrijving_opdracht);

    const badge = document.getElementById('aanvraagStatus');
    if (v.status === 'ingediend') {
      badge.textContent = 'Nieuwe aanvraag ingediend';
      badge.className = 'status-badge status-ingediend';
    } else if (v.status === 'goedgekeurd') {
      badge.textContent = 'Goedgekeurd';
      badge.className = 'status-badge status-goedgekeurd';
      document.querySelector('.actie-knoppen').innerHTML = '<p>Deze aanvraag is al goedgekeurd.</p>';
    } else if (v.status === 'afgekeurd') {
      badge.textContent = 'Afgekeurd';
      badge.className = 'status-badge status-afgekeurd';
      document.querySelector('.actie-knoppen').innerHTML = '<p>Deze aanvraag is afgekeurd.</p>';
    } else if (v.status === 'aanpassing_vereist') {
      badge.textContent = 'Aanpassing vereist';
      badge.className = 'status-badge status-aanpassing';
      document.querySelector('.actie-knoppen').innerHTML = '<p>Aanpassing gevraagd.</p>';
    }
  } catch (err) {
    console.error(err);
    document.querySelector('.stage-aanvraag').innerHTML = '<p>Fout bij laden.</p>';
  }
}

async function dienBeoordelingIn(beslissing, feedback) {
  if (!svId) return;

  try {
    const resp = await fetch(API_URL + '/api/stages/' + svId + '/beoordeling', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ beslissing, feedback })
    });

    const data = await resp.json();

    if (resp.ok) {
      var melding = 'Stageaanvraag goedgekeurd. Overeenkomst is aangemaakt.';
      if (beslissing === 'afgekeurd') melding = 'Stageaanvraag afgekeurd.';
      if (beslissing === 'aanpassing_vereist') melding = 'Aanpassing vereist ingesteld.';
      alert(melding);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.fout || 'Fout bij beoordelen');
    }
  } catch (err) {
    alert('Fout bij verbinding met server');
  }
}

function toonFeedbackFormulier(beslissing) {
  var feedback = prompt('Feedback (verplicht bij afkeur/aanpassing):');
  if (beslissing === 'goedgekeurd') {
    if (confirm('Weet je zeker dat je dit voorstel wil goedkeuren?')) {
      dienBeoordelingIn('goedgekeurd', null);
    }
  } else {
    if (!feedback || feedback.trim() === '') {
      feedback = prompt('Feedback is verplicht. Geef je feedback op:');
    }
    if (feedback && feedback.trim() !== '') {
      dienBeoordelingIn(beslissing, feedback);
    }
  }
}

window.aanvraagGoedkeuren = function() { toonFeedbackFormulier('goedgekeurd'); };
window.aanvraagAfkeuren = function() { toonFeedbackFormulier('afgekeurd'); };
window.aanvraagAanpassing = function() { toonFeedbackFormulier('aanpassing_vereist'); };

laadVoorstel();
