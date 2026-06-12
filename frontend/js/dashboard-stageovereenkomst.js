/*<const stagevoorstelStatus = "goedgekeurd"; 
// later komt dit uit de database

const stageovereenkomstTekst = document.getElementById("stageovereenkomstTekst");
const stageovereenkomstBtn = document.getElementById("stageovereenkomstBtn");

if (stagevoorstelStatus === "goedgekeurd") {
  stageovereenkomstTekst.textContent =
    "Je stagevoorstel is goedgekeurd. Je kan nu je stageovereenkomst controleren en ondertekenen.";

  stageovereenkomstBtn.textContent = "Stageovereenkomst openen";
  stageovereenkomstBtn.href = "stageovereenkomst.html";
  stageovereenkomstBtn.classList.remove("btn-secondary", "disabled-link");
  stageovereenkomstBtn.classList.add("btn-primary");
}>


/*
  TESTSTATUS

  niet_ingediend
  ingediend
  in_behandeling
  goedgekeurd
*/

const stagevoorstelStatus = "niet_ingediend";

const stageprocesCard =
  document.getElementById("stageprocesCard");

const stageovereenkomstCard =
  document.getElementById("stageovereenkomstCard");

if (stagevoorstelStatus === "goedgekeurd") {
  stageprocesCard.style.display = "none";
  stageovereenkomstCard.style.display = "block";
}