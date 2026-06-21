const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

async function laadStudenten() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/studenten", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const studenten = await antwoord.json();

    const lijst = document.getElementById("studenten-lijst");
    if (studenten.length === 0) {
      lijst.innerHTML = "<p>Geen studenten gevonden.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Student</th>' +
        '<th style="padding:10px;">Opleiding</th>' +
        '<th style="padding:10px;">Stagebedrijf</th>' +
        '<th style="padding:10px;">Docent</th>' +
        '<th style="padding:10px;">Mentor</th>' +
        '<th style="padding:10px;">Status</th>' +
        '<th style="padding:10px;">Actie</th>' +
      '</tr></thead><tbody>';

    studenten.forEach(s => {
      const docent = s.docent_voornaam ? s.docent_voornaam + " " + s.docent_achternaam : "-";
      const mentor = s.mentor_voornaam ? s.mentor_voornaam + " " + s.mentor_achternaam : "-";
      const bedrijf = s.bedrijf_naam || "-";
      const status = s.status_stage || "Geen stage";
      const kleur = s.status_stage === "goedgekeurd" ? "#2E9E49" : s.status_stage ? "#2563EB" : "#990018";

      const kanKoppelen = s.status_stage === "goedgekeurd" && s.voorstel_id;

      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(s.voornaam + " " + s.achternaam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(s.opleiding || "-") + '</td>' +
          '<td style="padding:10px;">' + escape(bedrijf) + '</td>' +
          '<td style="padding:10px;">' + escape(docent) + '</td>' +
          '<td style="padding:10px;">' + escape(mentor) + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + escape(status) + '</span></td>' +
          '<td style="padding:10px;">' +
            (kanKoppelen
              ? '<button class="btn btn--secundair" style="padding:4px 12px;font-size:0.85em;" onclick="openKoppel(' + s.voorstel_id + ', \'' + escape(s.voornaam + " " + s.achternaam) + '\')">Koppelen</button>'
              : '-') +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;

    const actieveStages = studenten.filter(s => s.status_stage === "goedgekeurd").length;
    const kaarten = [
      { label: "Studenten", waarde: studenten.length, kleur: "#8B0015" },
      { label: "Actieve stage", waarde: actieveStages, kleur: "#2E9E49" },
      { label: "Geen stage", waarde: studenten.length - actieveStages, kleur: "#990018" }
    ];

    const container = document.getElementById("stat-kaarten");
    container.innerHTML = "";
    kaarten.forEach(kaart => {
      const el = document.createElement("div");
      el.className = "stat-kaart";
      el.style.borderLeft = "4px solid " + kaart.kleur;
      el.innerHTML =
        '<div class="stat-kaart__icon" style="color:' + kaart.kleur + ';">' + kaart.waarde + "</div>" +
        '<div class="stat-kaart__label">' + kaart.label + "</div>";
      container.appendChild(el);
    });

  } catch (fout) {
    console.error(fout);
  }
}

/* KOPPEL MENTOR & DOCENT */

let alleMentoren = [];
let alleDocenten = [];

async function laadLijsten() {
  try {
    const [mentoren, docenten] = await Promise.all([
      fetch(API_URL + "/api/stages/mentoren/list", { headers: { "Authorization": "Bearer " + token } }).then(r => r.ok ? r.json() : []),
      fetch(API_URL + "/api/stages/docenten/list", { headers: { "Authorization": "Bearer " + token } }).then(r => r.ok ? r.json() : [])
    ]);
    alleMentoren = mentoren;
    alleDocenten = docenten;
  } catch (fout) {
    console.error(fout);
  }
}

function openKoppel(voorstelId, studentNaam) {
  document.getElementById("koppelVoorstelId").value = voorstelId;
  document.getElementById("koppelStudentNaam").textContent = "Student: " + studentNaam;

  const mentorSelect = document.getElementById("koppelMentor");
  mentorSelect.innerHTML = '<option value="">Kies een mentor...</option>';
  alleMentoren.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.voornaam + " " + m.achternaam + (m.bedrijf_naam ? " (" + m.bedrijf_naam + ")" : "");
    mentorSelect.appendChild(opt);
  });

  const docentSelect = document.getElementById("koppelDocent");
  docentSelect.innerHTML = '<option value="">Kies een docent...</option>';
  alleDocenten.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.voornaam + " " + d.achternaam + (d.vakgroep ? " (" + d.vakgroep + ")" : "");
    docentSelect.appendChild(opt);
  });

  document.getElementById("koppelMelding").className = "melding";
  document.getElementById("koppelMelding").textContent = "";
  document.getElementById("koppelModal").style.display = "flex";
}

function sluitKoppelModal() {
  document.getElementById("koppelModal").style.display = "none";
}

document.getElementById("koppelForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const voorstelId = document.getElementById("koppelVoorstelId").value;
  const mentor_id = document.getElementById("koppelMentor").value || null;
  const docent_id = document.getElementById("koppelDocent").value || null;
  const melding = document.getElementById("koppelMelding");

  if (!mentor_id && !docent_id) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kies ten minste een mentor of docent.";
    return;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/admin/stagevoorstellen/" + voorstelId + "/koppel", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ mentor_id, docent_id })
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      melding.className = "melding melding--fout";
      melding.textContent = data.fout || "Koppelen mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = "Succesvol gekoppeld! Notificaties verstuurd.";
    setTimeout(() => {
      sluitKoppelModal();
      laadStudenten();
    }, 1500);

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});

laadLijsten().then(() => laadStudenten());
