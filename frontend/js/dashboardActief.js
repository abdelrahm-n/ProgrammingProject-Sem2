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

  /* --- Open acties --- */
  var acties = [];
  var huidigWeek = data.voortgang.huidig_week;
  var totaalWeken = data.voortgang.totaal_weken;
  var dagenDezeWeek = data.logboeken.dagen_deze_week || 0;

  if (dagenDezeWeek < 5 && huidigWeek > 0) {
    acties.push("Logboek van vandaag invullen");
  }
  if (dagenDezeWeek > 0 && dagenDezeWeek < 5) {
    acties.push("Week " + huidigWeek + " verder aanvullen");
  }

  if (data.feedback_weken && data.feedback_weken.length > 0) {
    data.feedback_weken.forEach(function(fw) {
      acties.push("Feedback op week " + fw.week_nummer + " bekijken");
    });
  }

  if (data.zelfevaluatie && data.zelfevaluatie.beschikbaar) {
    acties.push("Zelfevaluatie invullen");
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

  /* --- Logboeken --- */
  var logWeekMax = 5;
  var logTotaalMax = totaalWeken * logWeekMax;
  var dagenDezeWeek = data.logboeken.dagen_deze_week || 0;
  var totaalDagen = data.logboeken.totaal_dagen || 0;

  document.getElementById("log-week").textContent = dagenDezeWeek + " / " + logWeekMax;
  document.getElementById("log-totaal").textContent = totaalDagen + " / " + logTotaalMax;

  var logWeekPerc = logWeekMax > 0 ? Math.round((dagenDezeWeek / logWeekMax) * 100) : 0;
  document.getElementById("log-week-balk").style.width = logWeekPerc + "%";

  var logTotaalPerc = logTotaalMax > 0 ? Math.round((totaalDagen / logTotaalMax) * 100) : 0;
  document.getElementById("log-totaal-balk").style.width = logTotaalPerc + "%";

  /* --- Logboek status badge --- */
  var badge = document.getElementById("log-status-badge");
  if (dagenDezeWeek >= logWeekMax) {
    badge.textContent = "Volledig ingevuld";
    badge.className = "status-badge status-badge--success";
    badge.style.display = "inline-block";
  } else if (dagenDezeWeek >= logWeekMax - 1 && dagenDezeWeek > 0) {
    badge.textContent = "Bijna volledig deze week";
    badge.className = "status-badge status-badge--info";
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }

  /* --- Evaluaties --- */
  var evalBody = document.getElementById("eval-tabel-body");
  evalBody.innerHTML = "";

  var start = new Date(data.stage.startdatum);
  var eind = new Date(data.stage.einddatum);
  var midden = new Date((start.getTime() + eind.getTime()) / 2);

  var tussenDatum = "-";
  var eindeDatum = "-";
  if (data.evaluaties && data.evaluaties.length > 0) {
    var tussen = data.evaluaties.find(function(e) { return e.type === "tussentijdse_evaluatie"; });
    var einde = data.evaluaties.find(function(e) { return e.type === "eindevaluatie"; });
    if (tussen) tussenDatum = formatDate(tussen.datum);
    if (einde) eindeDatum = formatDate(einde.datum);
    else eindeDatum = formatDate(data.stage.einddatum);
  } else {
    tussenDatum = formatDate(midden);
    eindeDatum = formatDate(eind);
  }

  var zelfEvalTekst = "Nog niet beschikbaar";
  if (data.zelfevaluatie && data.zelfevaluatie.deadline) {
    zelfEvalTekst = formatDate(data.zelfevaluatie.deadline);
  }

  var evalRijen = [
    { label: "Tussentijdse evaluatie", datum: tussenDatum },
    { label: "Zelfevaluatie", datum: zelfEvalTekst },
    { label: "Eindevaluatie", datum: eindeDatum }
  ];

  evalRijen.forEach(function(ev) {
    var tr = document.createElement("tr");
    tr.innerHTML = "<td>" + ev.label + "</td><td>" + ev.datum + "</td>";
    evalBody.appendChild(tr);
  });
}

function formatDate(datum) {
  if (!datum) return "-";
  return new Date(datum).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
}

laadActiefDashboard();
