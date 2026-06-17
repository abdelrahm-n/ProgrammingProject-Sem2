const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

async function laadBedrijven() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/bedrijven", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const bedrijven = await antwoord.json();

    const lijst = document.getElementById("bedrijven-lijst");
    if (bedrijven.length === 0) {
      lijst.innerHTML = "<p>Geen bedrijven gevonden.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Naam</th>' +
        '<th style="padding:10px;">Adres</th>' +
        '<th style="padding:10px;">Contact</th>' +
        '<th style="padding:10px;">Mentoren</th>' +
        '<th style="padding:10px;">Status</th>' +
      '</tr></thead><tbody>';

    bedrijven.forEach(b => {
      const status = b.actief ? "Actief" : "Inactief";
      const kleur = b.actief ? "#2E9E49" : "#990018";

      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(b.naam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(b.adres || "-") + '</td>' +
          '<td style="padding:10px;">' + escape(b.contactpersoon || "-") + '</td>' +
          '<td style="padding:10px;">' + b.aantal_mentoren + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + status + '</span></td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;

    const container = document.getElementById("stat-kaarten");
    container.innerHTML =
      '<div class="stat-kaart" style="border-left:4px solid #8B0015;">' +
        '<div class="stat-kaart__icon" style="color:#8B0015;">' + bedrijven.length + '</div>' +
        '<div class="stat-kaart__label">Bedrijven</div>' +
      '</div>';

  } catch (fout) {
    console.error(fout);
  }
}

laadBedrijven();
