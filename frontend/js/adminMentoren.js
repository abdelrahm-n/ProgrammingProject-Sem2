const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

let alleBedrijven = [];

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
    if (antwoord.ok) {
      alleBedrijven = await antwoord.json();
    }
  } catch (fout) {
    console.error(fout);
  }
}

async function laadMentoren() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/mentoren", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;
    const mentoren = await antwoord.json();

    const lijst = document.getElementById("mentoren-lijst");
    if (mentoren.length === 0) {
      lijst.innerHTML = "<p>Geen mentoren gevonden.</p>";
      return;
    }

    let html =
      '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
        '<th style="padding:10px;">Naam</th>' +
        '<th style="padding:10px;">Email</th>' +
        '<th style="padding:10px;">Functie</th>' +
        '<th style="padding:10px;">Bedrijf</th>' +
        '<th style="padding:10px;">Status</th>' +
        '<th style="padding:10px;">Actie</th>' +
      '</tr></thead><tbody>';

    mentoren.forEach(m => {
      const status = m.actief ? "Actief" : "Inactief";
      const kleur = m.actief ? "#2E9E49" : "#990018";

      html +=
        '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:10px;"><strong>' + escape(m.voornaam + " " + m.achternaam) + '</strong></td>' +
          '<td style="padding:10px;">' + escape(m.email) + '</td>' +
          '<td style="padding:10px;">' + escape(m.functie || "-") + '</td>' +
          '<td style="padding:10px;">' + escape(m.bedrijf_naam || "-") + '</td>' +
          '<td style="padding:10px;"><span style="color:' + kleur + ';font-weight:600;">' + status + '</span></td>' +
          '<td style="padding:10px;">' +
            '<button class="btn btn--secundair" style="padding:4px 12px;font-size:0.85em;" onclick="openBewerk(' + m.id + ', ' + JSON.stringify(escape(m.functie || '')) + ', ' + (m.bedrijf_id || 'null') + ')">Bewerken</button> ' +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    lijst.innerHTML = html;

    const container = document.getElementById("stat-kaarten");
    const actief = mentoren.filter(m => m.actief).length;
    container.innerHTML =
      '<div class="stat-kaart" style="border-left:4px solid #8B0015;">' +
        '<div class="stat-kaart__icon" style="color:#8B0015;">' + mentoren.length + '</div>' +
        '<div class="stat-kaart__label">Mentoren</div>' +
      '</div>' +
      '<div class="stat-kaart" style="border-left:4px solid #2E9E49;">' +
        '<div class="stat-kaart__icon" style="color:#2E9E49;">' + actief + '</div>' +
        '<div class="stat-kaart__label">Actief</div>' +
      '</div>';

  } catch (fout) {
    console.error(fout);
  }
}

function openBewerk(id, functie, bedrijfId) {
  document.getElementById("bewerkId").value = id;
  document.getElementById("bewerkFunctie").value = functie;

  const select = document.getElementById("bewerkBedrijf");
  select.innerHTML = '<option value="">Geen bedrijf</option>';
  alleBedrijven.forEach(b => {
    const option = document.createElement("option");
    option.value = b.id;
    option.textContent = b.naam;
    if (b.id == bedrijfId) option.selected = true;
    select.appendChild(option);
  });

  document.getElementById("bewerkMelding").className = "melding";
  document.getElementById("bewerkMelding").textContent = "";
  document.getElementById("bewerkModal").style.display = "flex";
}

function sluitModal() {
  document.getElementById("bewerkModal").style.display = "none";
}

document.getElementById("bewerkForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const id = document.getElementById("bewerkId").value;
  const functie = document.getElementById("bewerkFunctie").value.trim();
  const bedrijf_id = document.getElementById("bewerkBedrijf").value || null;
  const melding = document.getElementById("bewerkMelding");

  try {
    const antwoord = await fetch(API_URL + "/api/admin/mentoren/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ functie, bedrijf_id })
    });

    if (!antwoord.ok) {
      const fout = await antwoord.json().catch(() => ({}));
      melding.className = "melding melding--fout";
      melding.textContent = fout.fout || "Bewerken mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = "Mentor bijgewerkt.";
    setTimeout(() => {
      sluitModal();
      laadMentoren();
    }, 1000);

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});

laadBedrijven().then(() => laadMentoren());
