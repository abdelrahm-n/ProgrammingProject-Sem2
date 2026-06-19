const API = "http://localhost:3000";

const stapOverzicht = document.getElementById("stapOverzicht");
const stapContract = document.getElementById("stapContract");
const stapActivatie = document.getElementById("stapActivatie");

const bekijkBtn = document.getElementById("bekijkBtn");
const ondertekenBtn = document.getElementById("ondertekenBtn");
const handtekeningInput = document.getElementById("studentHandtekening");
const akkoordCheck = document.getElementById("akkoordCheck");

let overeenkomstData = null;

/* Stappen tonen of verbergen */
function toonOverzicht() {
  if (stapOverzicht) stapOverzicht.style.display = "block";
  if (stapContract) stapContract.style.display = "none";
  if (stapActivatie) stapActivatie.style.display = "none";
}

function toonContract() {
  if (stapOverzicht) stapOverzicht.style.display = "none";
  if (stapContract) stapContract.style.display = "block";
  if (stapActivatie) stapActivatie.style.display = "none";
}

function toonActivatie() {
  if (stapOverzicht) stapOverzicht.style.display = "none";
  if (stapContract) stapContract.style.display = "none";
  if (stapActivatie) stapActivatie.style.display = "block";
}

/* Zet een waarde in een veld */
function zet(id, waarde) {
  const veld = document.getElementById(id);
  if (veld) veld.textContent = waarde || "-";
}

/* Haal de stageovereenkomst op via de backend /mijn */
async function haalOvereenkomstOp() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  try {
    const resp = await fetch(`${API}/api/stageovereenkomst/mijn`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (resp.status === 401) {
      window.location.href = "../index.html";
      return;
    }

    if (!resp.ok) {
      console.log("Geen stageovereenkomst gevonden.");
      return;
    }

    overeenkomstData = await resp.json();
    vulContractIn(overeenkomstData);
    toonJuisteStap(overeenkomstData);
  } catch (err) {
    console.error("Fout bij ophalen overeenkomst:", err);
  }
}

/* Vul het contract met de gegevens uit de database */
function vulContractIn(data) {
  zet("studentNaam", data.student_voornaam + " " + data.student_achternaam);
  zet("studentnummer", data.studentnummer);
  zet("opleiding", data.opleiding);
  zet("emailStudent", data.email_student);
  zet("bedrijfNaam", data.bedrijf_naam);
  zet("contactpersoon", data.mentor_voornaam ? data.mentor_voornaam + " " + data.mentor_achternaam : "-");
  zet("emailBedrijf", data.email_bedrijf);
  zet("telefoon", data.telefoon_bedrijf);
  zet("stageperiode", (data.startdatum || "") + " - " + (data.einddatum || ""));
  zet("functie", data.mentor_functie || "-");
  zet("stageopdracht", data.omschrijving_opdracht);

  /* Handtekening statussen */
  zet("studentCheck", data.getekend_door_student ? "Ondertekend" : "Nog niet ondertekend");
  zet("bedrijfCheck", data.getekend_door_bedrijf ? "Ondertekend" : "In afwachting");
  zet("schoolCheck", data.getekend_door_school ? "Ondertekend" : "In afwachting");
  zet("status", data.overeenkomst_status || "Onbekend");
}

/* Bepaal welke stap getoond moet worden */
function toonJuisteStap(data) {
  if (data.getekend_door_student) {
    zet("studentCheck", "Ondertekend");
    toonActivatie();
    vulActivatieIn(data);
  } else {
    toonOverzicht();
  }
}

/* Vul de activatie-pagina dynamisch in op basis van ondertekenstatus */
function vulActivatieIn(data) {
  var statusBox = document.querySelector("#stapActivatie .status-box");
  var studentSpan = document.querySelector("#stapActivatie .signature-overview p:nth-child(1) span");
  var bedrijfSpan = document.querySelector("#stapActivatie .signature-overview p:nth-child(2) span");
  var schoolSpan = document.querySelector("#stapActivatie .signature-overview p:nth-child(3) span");

  if (studentSpan) { studentSpan.textContent = "Ondertekend"; studentSpan.className = "status-ok"; }

  if (data.getekend_door_bedrijf) {
    if (bedrijfSpan) { bedrijfSpan.textContent = "Ondertekend"; bedrijfSpan.className = "status-ok"; }
  } else {
    if (bedrijfSpan) { bedrijfSpan.textContent = "In afwachting"; bedrijfSpan.className = "status-wait"; }
  }

  if (data.getekend_door_school) {
    if (schoolSpan) { schoolSpan.textContent = "Ondertekend"; schoolSpan.className = "status-ok"; }
  } else {
    if (schoolSpan) { schoolSpan.textContent = "In afwachting"; schoolSpan.className = "status-wait"; }
  }

  if (data.getekend_door_bedrijf && data.getekend_door_school) {
    if (statusBox) statusBox.textContent = "Status: Alle handtekeningen ontvangen";
  } else if (data.getekend_door_bedrijf) {
    if (statusBox) statusBox.textContent = "Status: Wacht op hogeschool";
  } else {
    if (statusBox) statusBox.textContent = "Status: Wacht op bedrijf";
  }
}

/* Onderteken als student via de backend */
async function ondertekenAlsStudent() {
  const token = localStorage.getItem("token");

  if (!token || !overeenkomstData) {
    alert("Er is iets misgegaan. Probeer opnieuw in te loggen.");
    return;
  }

  const voorstelId = overeenkomstData.stagevoorstel_id;

  try {
    const resp = await fetch(`${API}/api/stageovereenkomst/${voorstelId}/onderteken-student`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.fout || "Er is iets misgegaan bij het ondertekenen.");
      return;
    }

    overeenkomstData.getekend_door_student = true;
    zet("studentCheck", "Ondertekend");
    toonActivatie();
    vulActivatieIn(overeenkomstData);
  } catch (err) {
    console.error("Fout bij ondertekenen:", err);
    alert("Kan geen verbinding maken met de server.");
  }
}

/* Knop pas actief als naam ingevuld en akkoord aangevinkt */
function controleerOndertekening() {
  if (!handtekeningInput || !ondertekenBtn) return;
  const naamOk = handtekeningInput.value.trim().length >= 2;
  ondertekenBtn.disabled = !(naamOk && akkoordCheck.checked);
}

if (bekijkBtn) bekijkBtn.addEventListener("click", toonContract);
if (handtekeningInput) handtekeningInput.addEventListener("input", controleerOndertekening);
if (akkoordCheck) akkoordCheck.addEventListener("change", controleerOndertekening);
if (ondertekenBtn) ondertekenBtn.addEventListener("click", ondertekenAlsStudent);

haalOvereenkomstOp();
