const status = localStorage.getItem("stageStatus");

const startCard = document.getElementById("start-stage-card");
const statusCard = document.getElementById("status-card");
const statusTitel = document.getElementById("status-titel");
const statusTekst = document.getElementById("status-tekst");

const stepAanmaak = document.getElementById("step-aanmaak");
const stepIngediend = document.getElementById("step-ingediend");
const stepBehandeling = document.getElementById("step-behandeling");
const stepGoedgekeurd = document.getElementById("step-goedgekeurd");

if (status === "ingediend") {
    stepAanmaak.classList.add("active");
    stepIngediend.classList.add("active");

    startCard.style.display = "none";
    statusCard.style.display = "block";

    statusTitel.textContent = "Stageaanvraag ingediend";
    statusTekst.textContent =
        "Je stageaanvraag is ingediend en wordt momenteel verwerkt. Je ontvangt een melding zodra er een beslissing is genomen.";
}

if (status === "goedgekeurd") {
    stepAanmaak.classList.add("active");
    stepIngediend.classList.add("active");
    stepBehandeling.classList.add("active");
    stepGoedgekeurd.classList.add("active");

    startCard.style.display = "none";
    statusCard.style.display = "block";

    statusTitel.textContent = "Stageaanvraag goedgekeurd";
    statusTekst.textContent =
        "Je stageaanvraag is goedgekeurd. Je kan nu verdergaan met de volgende stap in je stageproces.";
}

if (status === "afgekeurd") {
    stepAanmaak.classList.add("active");
    stepIngediend.classList.add("active");

    startCard.style.display = "block";
    statusCard.style.display = "block";

    statusTitel.textContent = "Stageaanvraag afgekeurd";
    statusTekst.textContent =
        "Je stageaanvraag werd afgekeurd omdat er gegevens ontbreken of niet correct zijn ingevuld. Pas je stagevoorstel aan en dien het opnieuw in.";
}