const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

/* Alle gebruikers worden hier bewaard voor filtering */
let alleGebruikers = [];

/* Rol-labels voor weergave */
const rolLabels = {
  student: "Student",
  docent: "Docent",
  stagementor: "Mentor",
  stagecommissie: "Commissie",
  admin: "Admin"
};

/* Kleur per rol voor de badge */
const rolKleuren = {
  student: "#2563EB",
  docent: "#2E9E49",
  stagementor: "#E58A12",
  stagecommissie: "#7C3AED",
  admin: "#8B0015"
};

/* Laad alle gebruikers van de API */
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

/* Toon de gebruikerslijst in de HTML */
function toonGebruikers(gebruikers) {
  const lijst = document.getElementById("gebruikers-lijst");

  if (gebruikers.length === 0) {
    lijst.innerHTML = "<p>Geen gebruikers gevonden.</p>";
    return;
  }

  /* Bouw een tabel */
  let html =
    '<table class="aanvraag-tabel" style="width:100%;border-collapse:collapse;">' +
    '<thead><tr style="border-bottom:2px solid #e2e8f0;text-align:left;">' +
      '<th style="padding:10px;">Naam</th>' +
      '<th style="padding:10px;">E-mail</th>' +
      '<th style="padding:10px;">Rol</th>' +
      '<th style="padding:10px;">Status</th>' +
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
      '</tr>';
  });

  html += '</tbody></table>';
  lijst.innerHTML = html;
}

/* Zoekfunctie: filter op naam of e-mail */
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

/* XSS-veilig tekst tonen */
function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

/* Laad gebruikers bij het openen van de pagina */
laadGebruikers();
