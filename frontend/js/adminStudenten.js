const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

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
        '<th style="padding:10px;">Status stage</th>' +
      '</tr></thead><tbody>';

    studenten.forEach(s => {
      const docent = s.docent_voornaam ? s.docent_voornaam + " " + s.docent_achternaam : "-";
      const bedrijf = s.bedrijf_naam || "-";
      const status = s.status_stage || "Geen stage";
      const kleur = s.status_stage === "goedgekeurd" ? "#2E9E49" : s.status_stage ? "#2563EB" : "#990018";

      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(s.voornaam + " " + s.achternaam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(s.opleiding || "-") + '</td>' +
          '<td style="padding:10px;">' + escape(bedrijf) + '</td>' +
          '<td style="padding:10px;">' + escape(docent) + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + escape(status) + '</span></td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;

    /* Stat-kaarten */
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

laadStudenten();
