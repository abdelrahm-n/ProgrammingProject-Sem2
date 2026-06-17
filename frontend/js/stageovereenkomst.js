/* Haal de ingediende aanvraag op uit localStorage */
const aanvraag = JSON.parse(localStorage.getItem("stageAanvraag")) || {};

const stapOverzicht = document.getElementById("stapOverzicht");
const stapContract = document.getElementById("stapContract");
const stapActivatie = document.getElementById("stapActivatie");

const bekijkBtn = document.getElementById("bekijkBtn");
const ondertekenBtn = document.getElementById("ondertekenBtn");
const handtekeningInput = document.getElementById("studentHandtekening");
const akkoordCheck = document.getElementById("akkoordCheck");

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

/* Vul de overeenkomst met de gegevens van de student */
function vulContractIn() {
  zet("studentNaam", aanvraag.studentNaam);
  zet("studentnummer", aanvraag.studentNummer);
  zet("opleiding", aanvraag.opleiding);
  zet("emailStudent", aanvraag.emailStudent);
  zet("bedrijfNaam", aanvraag.stagebedrijf);
  zet("contactpersoon", aanvraag.contactPersoon);
  zet("emailBedrijf", aanvraag.emailBedrijf);
  zet("telefoon", aanvraag.telefoonBedrijf);
  zet("stageperiode", (aanvraag.startDatum || "") + " - " + (aanvraag.eindDatum || ""));
  zet("functie", aanvraag.functie);
  zet("stageopdracht", aanvraag.stageopdracht);
}

/* Onderteken als student */
function ondertekenAlsStudent() {
  localStorage.setItem("getekend_student", "ja");
  zet("studentCheck", "Ondertekend");
  zet("status", "Wacht op bedrijf");
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
  window.location.href = "stageovereenkomst-getekend.html";
});

/* Vul de gegevens in en toon de juiste stap */
vulContractIn();

if (localStorage.getItem("getekend_student") === "ja") {
  zet("studentCheck", "Ondertekend");
  toonActivatie();
} else {
  toonOverzicht();
}
