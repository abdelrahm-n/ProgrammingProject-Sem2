const API_URL = "http://localhost:3000";

/* Het id van de ingelogde student (uit de login). Zo zie je enkel je eigen overeenkomst. */
const studentId = localStorage.getItem("id");

const stapOverzicht = document.getElementById("stapOverzicht");
const stapContract = document.getElementById("stapContract");
const stapActivatie = document.getElementById("stapActivatie");

const bekijkBtn = document.getElementById("bekijkBtn");
const ondertekenBtn = document.getElementById("ondertekenBtn");
const handtekeningInput = document.getElementById("studentHandtekening");
const akkoordCheck = document.getElementById("akkoordCheck");

/* De overeenkomst zoals opgehaald uit de database */
let overeenkomst = null;

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

function toonDatum(waarde) {
  if (!waarde) return "-";
  return new Date(waarde).toLocaleDateString("nl-BE");
}

/* Vul de overeenkomst met de gegevens uit de database */
function vulContractIn() {
  if (!overeenkomst) return;

  zet("studentNaam", (overeenkomst.student_voornaam || "") + " " + (overeenkomst.student_achternaam || ""));
  zet("studentnummer", overeenkomst.studentnummer);
  zet("opleiding", overeenkomst.opleiding);
  zet("emailStudent", overeenkomst.email_student);
  zet("bedrijfNaam", overeenkomst.bedrijf_naam);
  zet("contactpersoon", overeenkomst.contactpersoon_bedrijf);
  zet("emailBedrijf", overeenkomst.email_bedrijf);
  zet("telefoon", overeenkomst.telefoon_bedrijf);
  zet("stageperiode", toonDatum(overeenkomst.startdatum) + " - " + toonDatum(overeenkomst.einddatum));
  zet("functie", overeenkomst.functie);
  zet("stageopdracht", overeenkomst.omschrijving_opdracht);

  /* Toon de handtekeningstatus uit de database */
  if (overeenkomst.getekend_door_student) {
    zet("studentCheck", "Ondertekend");
    const badge = document.getElementById("studentCheck");
    if (badge) badge.className = "signature-badge done";
  }
}

/* Onderteken als student via de backend (slaat op in de database) */
async function ondertekenAlsStudent() {
  try {
    const antwoord = await fetch(
      API_URL + "/api/stageovereenkomst/" + overeenkomst.stagevoorstel_id + "/onderteken-student",
      { method: "PUT" }
    );
    const data = await antwoord.json();

    if (!antwoord.ok) {
      const melding = document.getElementById("melding");
      if (melding) melding.textContent = data.message || "Ondertekenen mislukt.";
      return false;
    }
    return true;
  } catch (fout) {
    const melding = document.getElementById("melding");
    if (melding) melding.textContent = "Kan geen verbinding maken met de server.";
    return false;
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

ondertekenBtn.addEventListener("click", async function () {
  const gelukt = await ondertekenAlsStudent();
  if (gelukt) {
    window.location.href = "stageovereenkomst-getekend.html";
  }
});

/* Haal de overeenkomst van de ingelogde student op uit de database */
async function laadOvereenkomst() {
  if (!studentId) {
    toonOverzicht();
    return;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/stageovereenkomst/student/" + studentId);

    if (!antwoord.ok) {
      /* Nog geen overeenkomst: toon enkel het overzicht */
      toonOverzicht();
      return;
    }

    overeenkomst = await antwoord.json();
    vulContractIn();

    if (overeenkomst.getekend_door_student) {
      toonActivatie();
    } else {
      toonOverzicht();
    }
  } catch (fout) {
    console.error("Overeenkomst laden mislukt:", fout);
    toonOverzicht();
  }
}

laadOvereenkomst();
