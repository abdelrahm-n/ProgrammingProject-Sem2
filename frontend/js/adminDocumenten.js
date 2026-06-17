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

async function laadDocumenten() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/documenten", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const documenten = await antwoord.json();

    const lijst = document.getElementById("documenten-lijst");
    if (documenten.length === 0) {
      lijst.innerHTML = "<p>Geen documenten gevonden.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Bestand</th>' +
        '<th style="padding:10px;">Type</th>' +
        '<th style="padding:10px;">Geüpload door</th>' +
        '<th style="padding:10px;">Datum</th>' +
      '</tr></thead><tbody>';

    documenten.forEach(d => {
      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(d.bestandsnaam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(d.type || "-") + '</td>' +
          '<td style="padding:10px;">' + escape(d.voornaam + " " + d.achternaam) + '</td>' +
          '<td style="padding:10px;">' + toonDatum(d.geupload_op) + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;
  } catch (fout) {
    console.error(fout);
  }
}

laadDocumenten();
