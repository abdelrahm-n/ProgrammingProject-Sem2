const status = localStorage.getItem("stageStatus");
const laatsteStatus = document.getElementById("laatste-status");
const startCard = document.getElementById("start-stage-card");
const statusCard = document.getElementById("status-card");
const statusTitel = document.getElementById("status-titel");
const statusTekst = document.getElementById("status-tekst");

const stepAanmaak = document.getElementById("step-aanmaak");
const stepIngediend = document.getElementById("step-ingediend");
const stepBehandeling = document.getElementById("step-behandeling");
const stepGoedgekeurd = document.getElementById("step-goedgekeurd");
const startCardTitle = document.getElementById("start-card-title");
const startCardText = document.getElementById("start-card-text");
const startCardButton = document.getElementById("start-card-button");

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

    laatsteStatus.textContent = "Goedgekeurd";

    startCard.style.display = "none";
    statusCard.style.display = "block";

    statusTitel.textContent = "Stageaanvraag goedgekeurd";
    statusTekst.textContent = "Je stageaanvraag is goedgekeurd. Je kan nu verdergaan met de stageovereenkomst.";
}

if (status === "afgekeurd") {
    stepAanmaak.classList.add("active");
    stepIngediend.classList.add("active");
    stepBehandeling.classList.add("active");

    stepGoedgekeurd.classList.add("rejected");

    laatsteStatus.textContent = "Afgekeurd";

    startCard.style.display = "block";
    statusCard.style.display = "block";

    statusTitel.textContent = "Stageaanvraag afgekeurd";
    statusTekst.textContent =
        "Je stageaanvraag werd afgekeurd omdat er gegevens ontbreken of niet correct zijn ingevuld. Pas je stagevoorstel aan en dien het opnieuw in.";
    startCardTitle.textContent = "Stagevoorstel aanpassen";
    startCardText.textContent =
        "Pas je stagevoorstel aan op basis van de feedback en dien het opnieuw in.";
    startCardButton.textContent = "Stagevoorstel aanpassen";
}

if (status === "aanpassing_vereist") {
    stepAanmaak.classList.add("active");
    stepIngediend.classList.add("active");
    stepBehandeling.classList.add("active");

    stepGoedgekeurd.classList.add("rejected");
    laatsteStatus.textContent = "Aanpassing vereist";

    startCard.style.display = "block";
    statusCard.style.display = "block";

    statusTitel.textContent = "Aanpassing vereist";
    statusTekst.textContent =
        "Je stagevoorstel moet aangepast worden voordat het opnieuw beoordeeld kan worden.";

    startCardTitle.textContent = "Stagevoorstel aanpassen";
    startCardText.textContent =
        "Pas je stagevoorstel aan op basis van de feedback van de stagecommissie.";
    startCardButton.textContent = "Stagevoorstel aanpassen";
}