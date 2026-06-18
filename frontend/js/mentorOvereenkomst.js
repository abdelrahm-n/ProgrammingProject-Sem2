const API_URL = 'http://localhost:3000';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../index.html';
}

const params = new URLSearchParams(window.location.search);
const overeenkomstId = params.get('id');

let overeenkomstData = null;

function zet(id, waarde) {
  const veld = document.getElementById(id);
  if (veld) veld.textContent = waarde || '-';
}

function zetBadge(id, tekst, status) {
  var veld = document.getElementById(id);
  if (veld) {
    veld.textContent = tekst;
    veld.className = 'signature-badge ' + status;
  }
}

function vulContractIn(data) {
  zet('studentNaam', data.student_voornaam + ' ' + data.student_achternaam);
  zet('opleiding', data.opleiding);
  zet('bedrijfNaam', data.bedrijf_naam);
  zet('contactpersoon', data.mentor_voornaam + ' ' + data.mentor_achternaam);
  zet('stageperiode', new Date(data.startdatum).toLocaleDateString('nl-BE') + ' - ' + new Date(data.einddatum).toLocaleDateString('nl-BE'));
  zet('functie', data.mentor_functie || '-');
  zet('stageopdracht', data.omschrijving_opdracht);

  zetBadge('studentCheck', data.getekend_door_student ? 'Ondertekend' : 'Nog niet ondertekend', data.getekend_door_student ? 'done' : 'waiting');
  zetBadge('bedrijfCheck', data.getekend_door_bedrijf ? 'Ondertekend' : 'Nog niet ondertekend', data.getekend_door_bedrijf ? 'done' : 'waiting');
  zetBadge('schoolCheck', data.getekend_door_school ? 'Ondertekend' : 'In afwachting', data.getekend_door_school ? 'done' : 'pending');
}

async function haalOvereenkomstOp() {
  if (!overeenkomstId) {
    alert('Geen overeenkomst ID gevonden.');
    return;
  }

  try {
    const resp = await fetch(API_URL + '/api/mentor/overeenkomst/' + overeenkomstId, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (resp.status === 401) {
      window.location.href = '../index.html';
      return;
    }

    if (!resp.ok) {
      alert('Overeenkomst niet gevonden.');
      return;
    }

    overeenkomstData = await resp.json();
    vulContractIn(overeenkomstData);

    if (overeenkomstData.getekend_door_bedrijf) {
      document.getElementById('signingSection').style.display = 'none';
      document.getElementById('alreadySigned').style.display = 'block';
    }

    /* Toon waarschuwing als student nog niet heeft getekend */
    if (!overeenkomstData.getekend_door_student) {
      document.getElementById('signingSection').style.display = 'none';
      document.getElementById('waitingForStudent').style.display = 'block';
    }
  } catch (err) {
    console.error('Fout bij ophalen overeenkomst:', err);
  }
}

async function ondertekenAlsBedrijf() {
  const handtekening = document.getElementById('bedrijfHandtekening').value.trim();
  const akkoord = document.getElementById('bedrijfAkkoordCheck').checked;

  if (handtekening.length < 2 || !akkoord) {
    alert('Vul je naam in en vink het akkoordveld aan.');
    return;
  }

  try {
    const resp = await fetch(API_URL + '/api/mentor/overeenkomst/' + overeenkomstId + '/onderteken', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.fout || 'Er is iets misgegaan bij het ondertekenen.');
      return;
    }

    window.location.href = 'stageovereenkomst-getekend.html?id=' + overeenkomstId;
  } catch (err) {
    console.error('Fout bij ondertekenen:', err);
    alert('Kan geen verbinding maken met de server.');
  }
}

function controleerOndertekening() {
  const naamOk = document.getElementById('bedrijfHandtekening').value.trim().length >= 2;
  const akkoord = document.getElementById('bedrijfAkkoordCheck').checked;
  document.getElementById('bedrijfOndertekenBtn').disabled = !(naamOk && akkoord);
}

document.getElementById('bedrijfHandtekening').addEventListener('input', controleerOndertekening);
document.getElementById('bedrijfAkkoordCheck').addEventListener('change', controleerOndertekening);
document.getElementById('bedrijfOndertekenBtn').addEventListener('click', ondertekenAlsBedrijf);

haalOvereenkomstOp();
