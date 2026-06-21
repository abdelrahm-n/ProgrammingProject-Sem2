const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

function esc(tekst) {
  return "'" + String(tekst || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

async function laadDocenten() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/docenten", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const docenten = await antwoord.json();

    const lijst = document.getElementById("docenten-lijst");
    if (docenten.length === 0) {
      lijst.innerHTML = "<p>Geen docenten gevonden.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Naam</th>' +
        '<th style="padding:10px;">Email</th>' +
        '<th style="padding:10px;">Vakgroep</th>' +
        '<th style="padding:10px;">Status</th>' +
        '<th style="padding:10px;">Actie</th>' +
      '</tr></thead><tbody>';

    docenten.forEach(d => {
      const status = d.actief ? "Actief" : "Inactief";
      const kleur = d.actief ? "#2E9E49" : "#990018";

      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(d.voornaam + " " + d.achternaam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(d.email) + '</td>' +
          '<td style="padding:10px;">' + escape(d.vakgroep || "-") + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + status + '</span></td>' +
          '<td style="padding:10px;">' +
            '<button class="btn btn--secundair" style="padding:4px 12px;font-size:0.85em;" onclick="openBewerkDocent(' + d.id + ', ' + esc(d.voornaam) + ', ' + esc(d.achternaam) + ', ' + esc(d.email) + ', ' + (d.actief ? 'true' : 'false') + ', ' + esc(d.vakgroep) + ')">Bewerken</button>' +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;

    const container = document.getElementById("stat-kaarten");
    container.innerHTML =
      '<div class="stat-kaart" style="border-left:4px solid #8B0015;">' +
        '<div class="stat-kaart__icon" style="color:#8B0015;">' + docenten.length + '</div>' +
        '<div class="stat-kaart__label">Docenten</div>' +
      '</div>';

  } catch (fout) {
    console.error(fout);
  }
}

laadDocenten();

/* ============================================================
   BEWERK DOCENT
   ============================================================ */

function openBewerkDocent(id, voornaam, achternaam, email, actief, vakgroep) {
  document.getElementById("bewerkDocentId").value = id;
  document.getElementById("bewerkDocentVoornaam").value = voornaam;
  document.getElementById("bewerkDocentAchternaam").value = achternaam;
  document.getElementById("bewerkDocentEmail").value = email;
  document.getElementById("bewerkDocentVakgroep").value = vakgroep;
  document.getElementById("bewerkDocentMelding").className = "melding";
  document.getElementById("bewerkDocentMelding").textContent = "";
  document.getElementById("bewerkDocentModal").style.display = "flex";
}

function sluitBewerkDocent() {
  document.getElementById("bewerkDocentModal").style.display = "none";
}

document.getElementById("bewerkDocentForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const id = document.getElementById("bewerkDocentId").value;
  const voornaam = document.getElementById("bewerkDocentVoornaam").value.trim();
  const achternaam = document.getElementById("bewerkDocentAchternaam").value.trim();
  const email = document.getElementById("bewerkDocentEmail").value.trim();
  const vakgroep = document.getElementById("bewerkDocentVakgroep").value.trim();
  const melding = document.getElementById("bewerkDocentMelding");

  if (!voornaam || !achternaam) {
    melding.className = "melding melding--fout";
    melding.textContent = "Naam is verplicht.";
    return;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/admin/docenten/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ voornaam, achternaam, email, actief: true, vakgroep })
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      melding.className = "melding melding--fout";
      melding.textContent = data.fout || "Bewerken mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = "Docent bijgewerkt!";
    setTimeout(() => {
      sluitBewerkDocent();
      laadDocenten();
    }, 1000);

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});
