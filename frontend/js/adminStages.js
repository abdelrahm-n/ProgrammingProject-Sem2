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

function wisselTab(tab) {
  document.getElementById("sectie-voorstellen").style.display = tab === "voorstellen" ? "block" : "none";
  document.getElementById("sectie-overeenkomsten").style.display = tab === "overeenkomsten" ? "block" : "none";
  document.getElementById("tab-voorstellen").className = "tab-btn" + (tab === "voorstellen" ? " actief" : "");
  document.getElementById("tab-overeenkomsten").className = "tab-btn" + (tab === "overeenkomsten" ? " actief" : "");
}

async function laadVoorstellen() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/stagevoorstellen", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const voorstellen = await antwoord.json();

    const lijst = document.getElementById("voorstellen-lijst");
    if (voorstellen.length === 0) {
      lijst.innerHTML = "<p>Geen stagevoorstellen gevonden.</p>";
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

    voorstellen.forEach(v => {
      const kleur = statusKleuren[v.status] || "#64748b";
      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(v.voornaam + " " + v.achternaam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(v.bedrijf_naam) + '</td>' +
          '<td style="padding:10px;">' + escape(v.functie || "-") + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + escape(v.status) + '</span></td>' +
          '<td style="padding:10px;">' + toonDatum(v.aangemaakt_op) + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;
  } catch (fout) {
    console.error(fout);
  }
}

async function laadOvereenkomsten() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/stageovereenkomsten", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const overeenkomsten = await antwoord.json();

    const lijst = document.getElementById("overeenkomsten-lijst");
    if (overeenkomsten.length === 0) {
      lijst.innerHTML = "<p>Geen stageovereenkomsten gevonden.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Student</th>' +
        '<th style="padding:10px;">Bedrijf</th>' +
        '<th style="padding:10px;">Ondertekend student</th>' +
        '<th style="padding:10px;">Ondertekend bedrijf</th>' +
        '<th style="padding:10px;">Ondertekend school</th>' +
        '<th style="padding:10px;">Gevalideerd</th>' +
        '<th style="padding:10px;">Actie</th>' +
      '</tr></thead><tbody>';

    overeenkomsten.forEach(o => {
      const ja = '<span style="color:#2E9E49;font-weight:600;">Ja</span>';
      const nee = '<span style="color:#990018;font-weight:600;">Nee</span>';
      const student = o.getekend_door_student ? ja : nee;
      const bedrijf = o.getekend_door_bedrijf ? ja : nee;
      const school = o.getekend_door_school ? ja : nee;
      const gevalideerd = o.status === "gevalideerd" ? ja : nee;
      const alleOndertekend = o.getekend_door_student && o.getekend_door_bedrijf && o.getekend_door_school;
      const kanValideren = alleOndertekend && o.status !== "gevalideerd";

      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(o.voornaam + " " + o.achternaam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(o.bedrijf_naam) + '</td>' +
          '<td style="padding:10px;">' + student + '</td>' +
          '<td style="padding:10px;">' + bedrijf + '</td>' +
          '<td style="padding:10px;">' + school + '</td>' +
          '<td style="padding:10px;">' + gevalideerd + '</td>' +
          '<td style="padding:10px;">' +
            (kanValideren
              ? '<button class="btn btn--succes" onclick="valideerOvereenkomst(' + o.id + ')">Valideren</button>'
              : '-') +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;
  } catch (fout) {
    console.error(fout);
  }
}

async function valideerOvereenkomst(id) {
  if (!confirm("Weet je zeker dat je deze overeenkomst wilt valideren?")) return;

  try {
    const antwoord = await fetch(API_URL + "/api/admin/stageovereenkomsten/" + id + "/valideer", {
      method: "PUT",
      headers: { "Authorization": "Bearer " + token }
    });

    if (!antwoord.ok) {
      const fout = await antwoord.json().catch(() => ({}));
      alert(fout.fout || "Valideren mislukt");
      return;
    }

    laadOvereenkomsten();
  } catch (fout) {
    alert("Kan geen verbinding maken met de server");
  }
}

laadVoorstellen();
laadOvereenkomsten();
