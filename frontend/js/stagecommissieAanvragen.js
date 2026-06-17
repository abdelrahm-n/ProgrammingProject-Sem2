/* Haal de ingediende aanvraag en status op */
const aanvraag = JSON.parse(localStorage.getItem("stageAanvraag"));
const status = localStorage.getItem("stageStatus");

/* Zet een waarde in een veld (of een streepje als het leeg is) */
function zet(id, waarde) {
    document.getElementById(id).textContent = waarde || "-";
}

/* Vul alle gegevens van de student automatisch in */
if (aanvraag) {
    zet("aanvraagStudent", aanvraag.studentNaam);
    zet("aanvraagStudentNummer", aanvraag.studentNummer);
    zet("aanvraagOpleiding", aanvraag.opleiding);
    zet("aanvraagEmailStudent", aanvraag.emailStudent);
    zet("aanvraagBedrijf", aanvraag.stagebedrijf);
    zet("aanvraagAdres", aanvraag.adresBedrijf);
    zet("aanvraagContactPersoon", aanvraag.contactPersoon);
    zet("aanvraagEmailBedrijf", aanvraag.emailBedrijf);
    zet("aanvraagTelefoonBedrijf", aanvraag.telefoonBedrijf);
    zet("aanvraagStartDatum", aanvraag.startDatum);
    zet("aanvraagEindDatum", aanvraag.eindDatum);
    zet("aanvraagFunctie", aanvraag.functie);
    zet("aanvraagOpdracht", aanvraag.stageopdracht);
}

/* Toon de juiste statusbadge */
const badge = document.getElementById("aanvraagStatus");

if (status === "ingediend") {
    badge.textContent = "Nieuwe aanvraag ingediend";
    badge.className = "status-badge status-ingediend";
} else if (status === "goedgekeurd") {
    badge.textContent = "Goedgekeurd";
    badge.className = "status-badge status-goedgekeurd";
} else if (status === "afgekeurd") {
    badge.textContent = "Afgekeurd";
    badge.className = "status-badge status-afgekeurd";
} else if (status === "aanpassing_vereist") {
    badge.textContent = "Aanpassing vereist";
    badge.className = "status-badge status-aanpassing";
}

/* Sla de beslissing van de commissie op */
function zetStatus(nieuweStatus, bericht) {
    localStorage.setItem("stageStatus", nieuweStatus);
    alert(bericht);
    location.reload();
}

function aanvraagGoedkeuren() {
    zetStatus("goedgekeurd", "Stageaanvraag goedgekeurd.");
}

function aanvraagAfkeuren() {
    zetStatus("afgekeurd", "Stageaanvraag afgekeurd.");
}

function aanvraagAanpassing() {
    zetStatus("aanpassing_vereist", "Aanpassing vereist ingesteld.");
}
