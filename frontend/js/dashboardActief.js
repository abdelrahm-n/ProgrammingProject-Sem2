const API_BASE = "http://localhost:3000";

async function laadActiefDashboard() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const resp = await fetch(`${API_BASE}/api/stages/mijn/actief`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resp.ok) {
      return;
    }

    const data = await resp.json();

    document.getElementById("proces-dashboard").style.display = "none";
    document.getElementById("actief-dashboard").style.display = "block";

    vulDashboardIn(data);
  } catch (err) {
    console.error("Fout bij laden actief dashboard:", err);
  }
}

function vulDashboardIn(data) {
  var volledigeNaam = localStorage.getItem("naam") || "Student";
  var voornaam = volledigeNaam.split(" ")[0];
  document.getElementById("welkom-tekst").textContent = "Welkom, " + voornaam;

  document.getElementById("info-bedrijf").textContent = data.bedrijf.naam;

  var dataEl = document.getElementById("info-data");
  if (dataEl) {
    dataEl.textContent = formatDate(data.stage.startdatum) + " – " + formatDate(data.stage.einddatum);
  }

  if (data.mentor) {
    document.getElementById("info-mentor").textContent = data.mentor.voornaam + " " + data.mentor.achternaam;
  } else {
    document.getElementById("info-mentor").textContent = "-";
  }

  if (data.docent) {
    document.getElementById("info-docent").textContent = data.docent.voornaam + " " + data.docent.achternaam;
  } else {
    document.getElementById("info-docent").textContent = "-";
  }

  var weekTekst = "Week " + data.voortgang.huidig_week + " / " + data.voortgang.totaal_weken;
  document.getElementById("info-week").textContent = weekTekst;

  var perc = data.voortgang.totaal_weken > 0
    ? Math.round((data.voortgang.huidig_week / data.voortgang.totaal_weken) * 100)
    : 0;
  document.getElementById("info-progress-balk").style.width = perc + "%";

  var acties = [];
  if (data.logboeken.ingevulde_weken < data.voortgang.totaal_weken) {
    acties.push("Logboek invullen voor deze week");
  }
  if (!data.overeenkomst || data.overeenkomst.status !== "gevalideerd") {
    acties.push("Stageovereenkomst ondertekenen");
  }
  if (acties.length === 0) acties.push("Geen open acties");

  var actieLijst = document.getElementById("open-acties-lijst");
  actieLijst.innerHTML = "";
  acties.forEach(function(actie) {
    var div = document.createElement("div");
    div.className = "actie-item";
    div.textContent = actie;
    actieLijst.appendChild(div);
  });

  document.getElementById("log-vandaag").textContent = "0";
  document.getElementById("log-week").textContent = data.logboeken.ingevulde_weken + " / " + data.voortgang.totaal_weken;
  document.getElementById("log-totaal").textContent = data.logboeken.totaal_dagen + " / " + (data.voortgang.totaal_weken * 5);

  var evalBody = document.getElementById("eval-tabel-body");
  evalBody.innerHTML = "";
  if (data.evaluaties && data.evaluaties.length > 0) {
    data.evaluaties.forEach(function(ev) {
      var tr = document.createElement("tr");
      var typeLabel = ev.type === "tussentijdse_evaluatie" ? "Tussentijdse evaluatie"
        : ev.type === "eindevaluatie" ? "Eindevaluatie"
        : ev.type === "zelfevaluatie" ? "Zelfevaluatie" : ev.type;
      tr.innerHTML = "<td>" + typeLabel + "</td><td>" + formatDate(ev.datum) + "</td>";
      evalBody.appendChild(tr);
    });
  } else {
    var tr = document.createElement("tr");
    tr.innerHTML = "<td>Geen evaluaties gepland</td><td>-</td>";
    evalBody.appendChild(tr);
  }
}

function formatDate(datum) {
  if (!datum) return "-";
  return new Date(datum).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
}

laadActiefDashboard();
