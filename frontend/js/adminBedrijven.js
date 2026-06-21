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
        '<th style="padding:10px;">Actie</th>' +
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
          '<td style="padding:10px;">' +
            '<button class="btn btn--secundair" style="padding:4px 12px;font-size:0.85em;" onclick="openBewerkBedrijf(' + b.id + ', ' + esc(b.naam) + ', ' + esc(b.adres) + ', ' + esc(b.email) + ', ' + esc(b.telefoon) + ', ' + esc(b.contactpersoon) + ', ' + (b.actief ? 'true' : 'false') + ')">Bewerken</button>' +
          '</td>' +
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

/* NIEUW BEDRIJF */

function openNieuwBedrijf() {
  document.getElementById("nieuwBedrijfForm").reset();
  document.getElementById("bedrijfMelding").className = "melding";
  document.getElementById("bedrijfMelding").textContent = "";
  document.getElementById("nieuwBedrijfModal").style.display = "flex";
}

function sluitNieuwBedrijf() {
  document.getElementById("nieuwBedrijfModal").style.display = "none";
}

document.getElementById("nieuwBedrijfForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const naam = document.getElementById("bedrijfNaam").value.trim();
  const adres = document.getElementById("bedrijfAdres").value.trim();
  const email = document.getElementById("bedrijfEmail").value.trim();
  const telefoon = document.getElementById("bedrijfTelefoon").value.trim();
  const contactpersoon = document.getElementById("bedrijfContact").value.trim();
  const melding = document.getElementById("bedrijfMelding");

  if (!naam) {
    melding.className = "melding melding--fout";
    melding.textContent = "Bedrijfsnaam is verplicht.";
    return;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/admin/bedrijven", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ naam, adres, email, telefoon, contactpersoon })
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      melding.className = "melding melding--fout";
      melding.textContent = data.fout || "Aanmaken mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = "Bedrijf aangemaakt!";
    setTimeout(() => {
      sluitNieuwBedrijf();
      laadBedrijven();
    }, 1000);

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});

/* BEWERK BEDRIJF */

function openBewerkBedrijf(id, naam, adres, email, telefoon, contact, actief) {
  document.getElementById("bewerkBedrijfId").value = id;
  document.getElementById("bewerkBedrijfNaam").value = naam;
  document.getElementById("bewerkBedrijfAdres").value = adres;
  document.getElementById("bewerkBedrijfEmail").value = email;
  document.getElementById("bewerkBedrijfTelefoon").value = telefoon;
  document.getElementById("bewerkBedrijfContact").value = contact;
  document.getElementById("bewerkBedrijfMelding").className = "melding";
  document.getElementById("bewerkBedrijfMelding").textContent = "";
  document.getElementById("bewerkBedrijfModal").style.display = "flex";
}

function sluitBewerkBedrijf() {
  document.getElementById("bewerkBedrijfModal").style.display = "none";
}

document.getElementById("bewerkBedrijfForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const id = document.getElementById("bewerkBedrijfId").value;
  const naam = document.getElementById("bewerkBedrijfNaam").value.trim();
  const adres = document.getElementById("bewerkBedrijfAdres").value.trim();
  const email = document.getElementById("bewerkBedrijfEmail").value.trim();
  const telefoon = document.getElementById("bewerkBedrijfTelefoon").value.trim();
  const contactpersoon = document.getElementById("bewerkBedrijfContact").value.trim();
  const melding = document.getElementById("bewerkBedrijfMelding");

  if (!naam) {
    melding.className = "melding melding--fout";
    melding.textContent = "Bedrijfsnaam is verplicht.";
    return;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/admin/bedrijven/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ naam, adres, email, telefoon, contactpersoon, actief: true })
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      melding.className = "melding melding--fout";
      melding.textContent = data.fout || "Bewerken mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = "Bedrijf bijgewerkt!";
    setTimeout(() => {
      sluitBewerkBedrijf();
      laadBedrijven();
    }, 1000);

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});

laadBedrijven();
