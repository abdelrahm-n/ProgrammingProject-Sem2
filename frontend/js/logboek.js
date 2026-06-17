const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token") || "";

const geenStageCard = document.getElementById("geen-stage-card");
const toevoegCard = document.getElementById("toevoeg-card");
const overzichtCard = document.getElementById("overzicht-card");
const wekenContainer = document.getElementById("logboek-weken");
const intro = document.getElementById("logboek-intro");
const fout = document.getElementById("logFout");

function toonDatum(waarde) {
  if (!waarde) return "-";
  return new Date(waarde).toLocaleDateString("nl-BE");
}

function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

/* Toon alle weken met hun dagitems */
function toonLogboek(data) {
  if (!data.stage) {
    geenStageCard.style.display = "block";
    return;
  }

  intro.textContent = "Logboek voor je stage bij " + data.stage.bedrijf + ".";
  toevoegCard.style.display = "block";
  overzichtCard.style.display = "block";

  wekenContainer.innerHTML = "";

  if (data.weken.length === 0) {
    wekenContainer.innerHTML = "<p>Je hebt nog geen logboekdagen toegevoegd.</p>";
    return;
  }

  data.weken.forEach(week => {
    const weekBlok = document.createElement("div");
    weekBlok.style.cssText = "margin-bottom:24px;";

    let dagenHtml = "";
    if (week.dagen.length === 0) {
      dagenHtml = "<p style='color:#64748b;'>Geen dagen in deze week.</p>";
    } else {
      dagenHtml =
        '<table class="logboek-tabel" style="width:100%;border-collapse:collapse;">' +
          "<thead><tr>" +
            '<th style="text-align:left;border-bottom:2px solid #e2e8f0;padding:8px;">Datum</th>' +
            '<th style="text-align:left;border-bottom:2px solid #e2e8f0;padding:8px;">Uitgevoerde taken</th>' +
            '<th style="text-align:left;border-bottom:2px solid #e2e8f0;padding:8px;">Reflectie</th>' +
            '<th style="text-align:left;border-bottom:2px solid #e2e8f0;padding:8px;">Problemen/leerpunten</th>' +
            '<th style="border-bottom:2px solid #e2e8f0;padding:8px;"></th>' +
          "</tr></thead><tbody>" +
          week.dagen.map(dag =>
            "<tr>" +
              '<td style="padding:8px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">' + toonDatum(dag.datum) + "</td>" +
              '<td style="padding:8px;border-bottom:1px solid #f1f5f9;">' + escape(dag.uitgevoerde_taken) + "</td>" +
              '<td style="padding:8px;border-bottom:1px solid #f1f5f9;">' + escape(dag.reflectie) + "</td>" +
              '<td style="padding:8px;border-bottom:1px solid #f1f5f9;">' + escape(dag.problemen_leerpunten) + "</td>" +
              '<td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;">' +
                '<button class="btn btn--gevaar" style="padding:4px 10px;" onclick="verwijderDag(' + dag.id + ')">Verwijder</button>' +
              "</td>" +
            "</tr>"
          ).join("") +
          "</tbody></table>";
    }

    const feedbackHtml = week.feedback_mentor
      ? '<p style="margin:8px 0 0;color:#1d4ed8;"><strong>Feedback mentor:</strong> ' + escape(week.feedback_mentor) + "</p>"
      : "";

    weekBlok.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        "<h3 style='margin:0;'>Week " + week.week_nummer +
          " <span style='font-weight:normal;color:#64748b;font-size:0.85em;'>(" +
          toonDatum(week.week_start) + " - " + toonDatum(week.week_einde) + ")</span></h3>" +
        (week.status ? '<span class="status-badge status-' + week.status + '">' + week.status + "</span>" : "") +
      "</div>" +
      dagenHtml +
      feedbackHtml;

    wekenContainer.appendChild(weekBlok);
  });
}

/* Haal het logboek van de ingelogde student op (enkel de eigen stage) */
async function laadLogboek() {
  try {
    const antwoord = await fetch(API_URL + "/api/logboeken/mijn", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) {
      geenStageCard.style.display = "block";
      return;
    }
    const data = await antwoord.json();
    toonLogboek(data);
  } catch (f) {
    console.error("Logboek laden mislukt:", f);
    geenStageCard.style.display = "block";
  }
}

/* Voeg een nieuwe logboekdag toe (dynamisch in de database) */
async function voegDagToe() {
  fout.style.display = "none";

  const datum = document.getElementById("logDatum").value;
  const uitgevoerde_taken = document.getElementById("logTaken").value.trim();
  const reflectie = document.getElementById("logReflectie").value.trim();
  const problemen_leerpunten = document.getElementById("logProblemen").value.trim();

  if (!datum || !uitgevoerde_taken) {
    fout.textContent = "Datum en uitgevoerde taken zijn verplicht.";
    fout.style.display = "block";
    return;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/logboeken/dag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ datum, uitgevoerde_taken, reflectie, problemen_leerpunten })
    });

    const data = await antwoord.json();
    if (!antwoord.ok) {
      fout.textContent = data.fout || "Toevoegen mislukt.";
      fout.style.display = "block";
      return;
    }

    /* Velden leegmaken en het overzicht verversen */
    document.getElementById("logTaken").value = "";
    document.getElementById("logReflectie").value = "";
    document.getElementById("logProblemen").value = "";
    laadLogboek();
  } catch (f) {
    fout.textContent = "Kan geen verbinding maken met de server.";
    fout.style.display = "block";
  }
}

/* Verwijder een logboekdag (enkel de eigen items) */
async function verwijderDag(id) {
  if (!confirm("Deze logboekdag verwijderen?")) return;

  try {
    const antwoord = await fetch(API_URL + "/api/logboeken/dag/" + id, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });
    if (antwoord.ok) {
      laadLogboek();
    }
  } catch (f) {
    console.error("Verwijderen mislukt:", f);
  }
}

document.getElementById("toevoegBtn").addEventListener("click", voegDagToe);

laadLogboek();
