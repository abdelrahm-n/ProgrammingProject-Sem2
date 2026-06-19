const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

let alleGebruikers = [];

const rolLabels = {
  student: "Student",
  docent: "Docent",
  stagementor: "Mentor",
  stagecommissie: "Commissie",
  admin: "Admin"
};

const rolKleuren = {
  student: "#2563EB",
  docent: "#2E9E49",
  stagementor: "#E58A12",
  stagecommissie: "#7C3AED",
  admin: "#8B0015"
};

function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

async function laadGebruikers() {
  try {
    const antwoord = await fetch(API_URL + "/api/admin/gebruikers", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!antwoord.ok) {
      console.error("Kan gebruikers niet laden");
      return;
    }

    alleGebruikers = await antwoord.json();
    toonGebruikers(alleGebruikers);

  } catch (fout) {
    console.error("Kan geen verbinding maken met de server:", fout);
  }
}

function toonGebruikers(gebruikers) {
  const lijst = document.getElementById("gebruikers-lijst");

  if (gebruikers.length === 0) {
    lijst.innerHTML = "<p>Geen gebruikers gevonden.</p>";
    return;
  }

  let html =
    '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
    '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
      '<th style="padding:10px;">Naam</th>' +
      '<th style="padding:10px;">E-mail</th>' +
      '<th style="padding:10px;">Rol</th>' +
      '<th style="padding:10px;">Status</th>' +
      '<th style="padding:10px;">Acties</th>' +
    '</tr></thead><tbody>';

  gebruikers.forEach(g => {
    const label = rolLabels[g.rol] || g.rol;
    const kleur = rolKleuren[g.rol] || "#64748b";
    const statusTekst = g.actief ? "Actief" : "Inactief";
    const statusKleur = g.actief ? "#2E9E49" : "#990018";

    html +=
      '<tr style="border-bottom:1px solid #e2e8f0;">' +
        '<td style="padding:10px;"><strong>' + escape(g.voornaam + " " + g.achternaam) + '</strong></td>' +
        '<td style="padding:10px;color:#64748b;">' + escape(g.email) + '</td>' +
        '<td style="padding:10px;"><span class="status-badge" style="background:' + kleur + ';">' + label + '</span></td>' +
        '<td style="padding:10px;"><span style="color:' + statusKleur + ';font-weight:600;">' + statusTekst + '</span></td>' +
        '<td style="padding:10px;white-space:nowrap;">' +
          '<button class="btn btn--secundair" style="padding:4px 10px;font-size:0.8em;" onclick="openRolWijzig(' + g.id + ', \'' + g.rol + '\')">Rol</button> ' +
          '<button class="btn btn--secundair" style="padding:4px 10px;font-size:0.8em;" onclick="openWachtwoord(' + g.id + ')">Wachtwoord</button> ' +
          '<button class="btn btn--secundair" style="padding:4px 10px;font-size:0.8em;color:#990018;" onclick="verwijderGebruiker(' + g.id + ', \'' + escape(g.voornaam + " " + g.achternaam) + '\')">Verwijder</button>' +
        '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  lijst.innerHTML = html;
}

/* Zoekfunctie */
document.getElementById("zoekVeld").addEventListener("input", function () {
  const zoekwoord = this.value.trim().toLowerCase();

  if (!zoekwoord) {
    toonGebruikers(alleGebruikers);
    return;
  }

  const gefilterd = alleGebruikers.filter(g => {
    const naam = (g.voornaam + " " + g.achternaam).toLowerCase();
    const email = g.email.toLowerCase();
    return naam.includes(zoekwoord) || email.includes(zoekwoord);
  });

  toonGebruikers(gefilterd);
});

/* ============================================================
   ROL WIJZIGEN
   ============================================================ */

function openRolWijzig(id, huidigeRol) {
  document.getElementById("rolModalId").value = id;
  document.getElementById("rolSelect").value = huidigeRol;
  document.getElementById("rolMelding").className = "melding";
  document.getElementById("rolMelding").textContent = "";
  document.getElementById("rolModal").style.display = "flex";
}

function sluitRolModal() {
  document.getElementById("rolModal").style.display = "none";
}

document.getElementById("rolForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const id = document.getElementById("rolModalId").value;
  const nieuweRol = document.getElementById("rolSelect").value;
  const melding = document.getElementById("rolMelding");

  try {
    const antwoord = await fetch(API_URL + "/api/admin/gebruikers/" + id + "/rol", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ nieuweRol })
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      melding.className = "melding melding--fout";
      melding.textContent = data.fout || "Rol wijzigen mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = data.bericht || "Rol gewijzigd.";
    setTimeout(() => {
      sluitRolModal();
      laadGebruikers();
    }, 1000);

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});

/* ============================================================
   WACHTWOORD WIJZIGEN
   ============================================================ */

function openWachtwoord(id) {
  document.getElementById("wwModalId").value = id;
  document.getElementById("nieuwWachtwoord").value = "";
  document.getElementById("wwMelding").className = "melding";
  document.getElementById("wwMelding").textContent = "";
  document.getElementById("wwModal").style.display = "flex";
}

function sluitWwModal() {
  document.getElementById("wwModal").style.display = "none";
}

document.getElementById("wwForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const id = document.getElementById("wwModalId").value;
  const nieuwWachtwoord = document.getElementById("nieuwWachtwoord").value;
  const melding = document.getElementById("wwMelding");

  if (nieuwWachtwoord.length < 6) {
    melding.className = "melding melding--fout";
    melding.textContent = "Wachtwoord moet minstens 6 tekens hebben.";
    return;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/admin/gebruikers/" + id + "/wachtwoord", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ nieuwWachtwoord })
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      melding.className = "melding melding--fout";
      melding.textContent = data.fout || "Wachtwoord wijzigen mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = "Wachtwoord succesvol gewijzigd.";
    setTimeout(() => sluitWwModal(), 1500);

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});

/* ============================================================
   GEBRUIKER VERWIJDEREN
   ============================================================ */

async function verwijderGebruiker(id, naam) {
  if (!confirm("Weet je zeker dat je " + naam + " wilt deactiveren?")) return;

  try {
    const antwoord = await fetch(API_URL + "/api/admin/gebruikers/" + id, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      alert(data.fout || "Verwijderen mislukt.");
      return;
    }

    laadGebruikers();

  } catch (fout) {
    alert("Kan geen verbinding maken met de server.");
  }
}

laadGebruikers();
