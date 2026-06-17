const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

/* Formateer een datum naar Belgische notatie (dd/mm/jjjj) */
function toonDatum(waarde) {
  if (!waarde) return "-";
  return new Date(waarde).toLocaleDateString("nl-BE");
}

/* Verwijder gevaarlijke HTML tekens om XSS te voorkomen */
function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

/* Laad de statistieken van de API en toon ze als kaarten */
async function laadStatistieken() {
  try {
    const antwoord = await fetch(API_URL + "/api/stages/statistieken", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!antwoord.ok) {
      console.error("Kan statistieken niet laden");
      return;
    }

    const data = await antwoord.json();

    const statusAantallen = {};
    data.aantallen.forEach(r => {
      statusAantallen[r.status] = r.aantal;
    });

    const kaarten = [
      { label: "Totaal", waarde: data.totaal, kleur: "#7C3AED" },
      { label: "Ingediend", waarde: statusAantallen["ingediend"] || 0, kleur: "#2563EB" },
      { label: "Goedgekeurd", waarde: statusAantallen["goedgekeurd"] || 0, kleur: "#2E9E49" },
      { label: "Afgekeurd", waarde: statusAantallen["afgekeurd"] || 0, kleur: "#990018" },
      { label: "Aanpassing vereist", waarde: statusAantallen["aanpassing_vereist"] || 0, kleur: "#E58A12" }
    ];

    const kaartenContainer = document.getElementById("stat-kaarten");
    kaartenContainer.innerHTML = "";

    kaarten.forEach(kaart => {
      const kaartElement = document.createElement("div");
      kaartElement.className = "stat-kaart";
      kaartElement.style.borderLeft = "4px solid " + kaart.kleur;
      kaartElement.innerHTML =
        '<div class="stat-kaart__icon" style="color:' + kaart.kleur + ';">' +
          kaart.waarde +
        "</div>" +
        '<div class="stat-kaart__label">' + kaart.label + "</div>";
      kaartenContainer.appendChild(kaartElement);
    });

  } catch (fout) {
    console.error("Kan geen verbinding maken met de server:", fout);
  }
}

/* Laad de laatste stageaanvragen en toon ze als lijst */
async function laadRecenteAanvragen() {
  try {
    const antwoord = await fetch(API_URL + "/api/stages", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!antwoord.ok) {
      console.error("Kan aanvragen niet laden");
      return;
    }

    const aanvragen = await antwoord.json();
    const lijst = document.getElementById("recente-lijst");

    if (aanvragen.length === 0) {
      lijst.innerHTML = "<p>Er zijn nog geen stageaanvragen ingediend.</p>";
      return;
    }

    const recenteAanvragen = aanvragen.slice(0, 5);

    lijst.innerHTML = "";

    recenteAanvragen.forEach(aanvraag => {
      const statusLabels = {
        ingediend: "Nieuw",
        in_behandeling: "In behandeling",
        goedgekeurd: "Goedgekeurd",
        afgekeurd: "Afgekeurd",
        aanpassing_vereist: "Aanpassing"
      };

      const label = statusLabels[aanvraag.status] || aanvraag.status;

      const item = document.createElement("div");
      item.className = "aanvraag-lijst-item";
      item.style.cursor = "pointer";
      item.addEventListener("click", function () {
        window.location.href = "aanvragen.html";
      });

      item.innerHTML =
        "<div>" +
          "<strong>" + escape(aanvraag.voornaam + " " + aanvraag.achternaam) + "</strong>" +
          '<div style="color:#64748b;font-size:0.9em;">' +
            escape(aanvraag.bedrijf) +
            " &middot; ingediend op " + toonDatum(aanvraag.aangemaakt_op) +
          "</div>" +
        "</div>" +
        '<span class="status-badge status-' + aanvraag.status + '">' + label + "</span>";

      lijst.appendChild(item);
    });

  } catch (fout) {
    console.error("Kan geen verbinding maken met de server:", fout);
  }
}

/* Laad alles bij het openen van de pagina */
laadStatistieken();
laadRecenteAanvragen();
