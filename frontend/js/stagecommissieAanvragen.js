function aanvraagGoedkeuren() {
    localStorage.setItem("stageStatus", "goedgekeurd");
    alert("Stageaanvraag goedgekeurd.");
}

function aanvraagAfkeuren() {
    localStorage.setItem("stageStatus", "afgekeurd");
    alert("Stageaanvraag afgekeurd.");
}