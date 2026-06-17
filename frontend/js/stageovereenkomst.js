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
  stapOverzicht.style.display = "block";
  stapContract.style.display = "none";
  stapActivatie.style.display = "none";
}

function toonContract() {
  stapOverzicht.style.display = "none";
  stapContract.style.display = "block";
  stapActivatie.style.display = "none";
}

function toonActivatie() {
  stapOverzicht.style.display = "none";
  stapContract.style.display = "none";
  stapActivatie.style.display = "block";
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
  } else {
    toonOverzicht();
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

    zet("studentCheck", "Ondertekend");
    toonActivatie();
  } catch (err) {
    console.error("Fout bij ondertekenen:", err);
    alert("Kan geen verbinding maken met de server.");
  }
}

/* Knop pas actief als naam ingevuld en akkoord aangevinkt */
function controleerOndertekening() {
  const naamOk = handtekeningInput.value.trim().length >= 2;
  ondertekenBtn.disabled = !(naamOk && akkoordCheck.checked);
}

bekijkBtn.addEventListener("click", toonContract);
handtekeningInput.addEventListener("input", controleerOndertekening);
akkoordCheck.addEventListener("change", controleerOndertekening);

ondertekenBtn.addEventListener("click", function () {
  ondertekenAlsStudent();
});

haalOvereenkomstOp();
