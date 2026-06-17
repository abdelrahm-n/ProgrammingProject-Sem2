const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

const rolLabels = {
  student: "Student",
  docent: "Docent",
  stagementor: "Mentor",
  stagecommissie: "Commissie",
  admin: "Admin"
};

const statusKleuren = {
  ingediend: "#2563EB",
  goedgekeurd: "#2E9E49",
  afgekeurd: "#990018",
  aanpassing_vereist: "#E58A12",
  in_behandeling: "#2563EB",
  wacht_op_handtekeningen: "#E58A12",
  volledig_getekend: "#2E9E49",
  gevalideerd: "#2E9E49"
};

function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

function toonDatum(waarde) {
  if (!waarde) return "-";
  return new Date(waarde).toLocaleDateString("nl-BE");
}

/* Laad statistieken */
async function laadStatistieken() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/statistieken", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const data = await antwoord.json();

    const kaarten = [
      { label: "Totaal studenten", waarde: data.studenten, kleur: "#8B0015" },
      { label: "Actieve stages", waarde: data.actieve_stages, kleur: "#2E9E49" },
      { label: "Wachtende voorstellen", waarde: data.wachtende_voorstellen, kleur: "#2563EB" },
      { label: "Te valideren overeenkomsten", waarde: data.wachtende_overeenkomsten, kleur: "#E58A12" }
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

/* Laad recente updates (stagevoorstellen met statuswijzigingen) */
async function laadRecenteUpdates() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/stagevoorstellen", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const voorstellen = await antwoord.json();

    const lijst = document.getElementById("recente-updates");
    if (voorstellen.length === 0) {
      lijst.innerHTML = "<p>Geen recente updates.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Student</th>' +
        '<th style="padding:10px;">Bedrijf</th>' +
        '<th style="padding:10px;">Functie</th>' +
        '<th style="padding:10px;">Status</th>' +
        '<th style="padding:10px;">Datum</th>' +
      '</tr></thead><tbody>';

    voorstellen.slice(0, 5).forEach(v => {
      const status = v.status;
      const kleur = statusKleuren[status] || "#64748b";
      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;">' + escape(v.voornaam + " " + v.achternaam) + '</td>' +
          '<td style="padding:10px;">' + escape(v.bedrijf_naam) + '</td>' +
          '<td style="padding:10px;">' + escape(v.functie || "-") + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + escape(status) + '</span></td>' +
          '<td style="padding:10px;">' + toonDatum(v.aangemaakt_op) + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;
  } catch (fout) {
    console.error(fout);
  }
}

/* Laad overzicht stages */
async function laadOverzichtStages() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/stages/overzicht", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const stages = await antwoord.json();

    const lijst = document.getElementById("overzicht-stages");
    if (stages.length === 0) {
      lijst.innerHTML = "<p>Geen actieve stages.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Student</th>' +
        '<th style="padding:10px;">Bedrijf</th>' +
        '<th style="padding:10px;">Docent</th>' +
        '<th style="padding:10px;">Mentor</th>' +
        '<th style="padding:10px;">Status</th>' +
      '</tr></thead><tbody>';

    stages.forEach(s => {
      const mentor = s.mentor_voornaam ? s.mentor_voornaam + " " + s.mentor_achternaam : "-";
      const docent = s.docent_voornaam ? s.docent_voornaam + " " + s.docent_achternaam : "-";
      const status = s.actief ? "Actief" : "Inactief";
      const kleur = s.actief ? "#2E9E49" : "#990018";

      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;">' + escape(s.voornaam + " " + s.achternaam) + '</td>' +
          '<td style="padding:10px;">' + escape(s.bedrijf_naam) + '</td>' +
          '<td style="padding:10px;">' + escape(docent) + '</td>' +
          '<td style="padding:10px;">' + escape(mentor) + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + status + '</span></td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;
  } catch (fout) {
    console.error(fout);
  }
}

laadStatistieken();
laadRecenteUpdates();
laadOverzichtStages();
