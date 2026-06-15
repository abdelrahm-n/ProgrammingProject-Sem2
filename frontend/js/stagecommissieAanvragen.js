const aanvraag = JSON.parse(localStorage.getItem("stageAanvraag"));

if (aanvraag) {
    document.getElementById("aanvraagStudent").textContent = aanvraag.studentNaam;
    document.getElementById("aanvraagStudentNummer").textContent = aanvraag.studentNummer;
    document.getElementById("aanvraagOpleiding").textContent = aanvraag.opleiding;
    document.getElementById("aanvraagEmailStudent").textContent = aanvraag.emailStudent;

    document.getElementById("aanvraagBedrijf").textContent = aanvraag.stagebedrijf;
    document.getElementById("aanvraagAdres").textContent = aanvraag.adresBedrijf;
    document.getElementById("aanvraagContactPersoon").textContent = aanvraag.contactPersoon;
    document.getElementById("aanvraagEmailBedrijf").textContent = aanvraag.emailBedrijf;
    document.getElementById("aanvraagTelefoonBedrijf").textContent = aanvraag.telefoonBedrijf;

    document.getElementById("aanvraagStartDatum").textContent = aanvraag.startDatum;
    document.getElementById("aanvraagEindDatum").textContent = aanvraag.eindDatum;

    document.getElementById("aanvraagFunctie").textContent = aanvraag.functie;
    document.getElementById("aanvraagOpdracht").textContent = aanvraag.stageopdracht;
}

const status = localStorage.getItem("stageStatus");
const aanvraagStatus = document.getElementById("aanvraagStatus");

if (status === "ingediend") {
    aanvraagStatus.textContent = "Nieuwe aanvraag ingediend";
    aanvraagStatus.className = "status-badge status-ingediend";
}

if (status === "afgekeurd") {
    aanvraagStatus.textContent = "Afgekeurd - wachtend op aanpassing";
    aanvraagStatus.className = "status-badge status-afgekeurd";
}

if (status === "aanpassing_vereist") {
    aanvraagStatus.textContent = "Aanpassing vereist - wachtend op nieuwe indiening";
    aanvraagStatus.className = "status-badge status-aanpassing";
}

if (status === "goedgekeurd") {
    aanvraagStatus.textContent = "Goedgekeurd";
    aanvraagStatus.className = "status-badge status-goedgekeurd";
}

function aanvraagGoedkeuren() {
    localStorage.setItem("stageStatus", "goedgekeurd");
    alert("Stageaanvraag goedgekeurd.");
}

function aanvraagAfkeuren() {
    localStorage.setItem("stageStatus", "afgekeurd");
    alert("Stageaanvraag afgekeurd.");
}

function aanvraagAanpassing() {
    localStorage.setItem("stageStatus", "aanpassing_vereist");
    alert("Aanpassing vereist ingesteld.");
}