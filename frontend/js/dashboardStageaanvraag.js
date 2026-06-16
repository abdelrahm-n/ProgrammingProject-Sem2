const API_URL = "http://localhost:3000";

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
const overeenkomstKnop = document.getElementById("overeenkomst-knop");

const geschiedenisCard = document.getElementById("geschiedenis-card");
const geschiedenisLijst = document.getElementById("geschiedenis-lijst");

/* Toon een datum als dd-mm-jjjj (of een streepje) */
function toonDatum(waarde) {
    if (!waarde) return "-";
    return new Date(waarde).toLocaleDateString("nl-BE");
}

/* Nette label per status */
const statusLabels = {
    ingediend: "Ingediend",
    in_behandeling: "In behandeling",
    goedgekeurd: "Goedgekeurd",
    afgekeurd: "Afgekeurd",
    aanpassing_vereist: "Aanpassing vereist"
};

/* Vul de voortgangsbalk en de statuskaart op basis van de laatste aanvraag */
function toonStatus(voorstel) {
    const status = voorstel.status;

    stepAanmaak.classList.add("active");
    stepIngediend.classList.add("active");
    startCard.style.display = "none";
    statusCard.style.display = "block";

    if (status === "ingediend" || status === "in_behandeling") {
        if (status === "in_behandeling") stepBehandeling.classList.add("active");
        statusTitel.textContent = "Stageaanvraag " + statusLabels[status].toLowerCase();
        statusTekst.textContent =
            "Je stageaanvraag is ingediend en wordt momenteel verwerkt. Je ontvangt een melding zodra er een beslissing is genomen.";
    } else if (status === "goedgekeurd") {
        stepBehandeling.classList.add("active");
        stepGoedgekeurd.classList.add("active");
        laatsteStatus.textContent = "Goedgekeurd";
        statusTitel.textContent = "Stageaanvraag goedgekeurd";
        statusTekst.textContent = "Je stageaanvraag is goedgekeurd. Je kan nu verdergaan met de stageovereenkomst.";
        overeenkomstKnop.style.display = "inline-block";
    } else if (status === "afgekeurd") {
        stepBehandeling.classList.add("active");
        stepGoedgekeurd.classList.add("rejected");
        laatsteStatus.textContent = "Afgekeurd";
        statusTitel.textContent = "Stageaanvraag afgekeurd";
        statusTekst.textContent =
            "Je stageaanvraag werd afgekeurd. " +
            (voorstel.commissie_feedback ? "Feedback: " + voorstel.commissie_feedback : "Pas je stagevoorstel aan en dien het opnieuw in.");
        startCard.style.display = "block";
        startCardTitle.textContent = "Stagevoorstel opnieuw indienen";
        startCardText.textContent = "Pas je stagevoorstel aan op basis van de feedback en dien het opnieuw in.";
        startCardButton.textContent = "Stagevoorstel indienen";
    } else if (status === "aanpassing_vereist") {
        stepBehandeling.classList.add("active");
        stepGoedgekeurd.classList.add("warning");
        laatsteStatus.textContent = "Aanpassing vereist";
        statusTitel.textContent = "Aanpassing vereist";
        statusTekst.textContent =
            "Je stagevoorstel moet aangepast worden. " +
            (voorstel.commissie_feedback ? "Feedback: " + voorstel.commissie_feedback : "Bekijk de feedback van de stagecommissie.");
        startCard.style.display = "block";
        startCardTitle.textContent = "Stagevoorstel aanpassen";
        startCardText.textContent = "Pas je stagevoorstel aan op basis van de feedback van de stagecommissie.";
        startCardButton.textContent = "Stagevoorstel aanpassen";
    }
}

/* Toon de volledige geschiedenis van ingediende aanvragen */
function toonGeschiedenis(voorstellen) {
    if (voorstellen.length === 0) return;

    geschiedenisCard.style.display = "block";
    geschiedenisLijst.innerHTML = "";

    voorstellen.forEach(v => {
        const status = v.status;
        const label = statusLabels[status] || status;

        const blok = document.createElement("div");
        blok.className = "aanvraag-rij";
        blok.style.cssText = "border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:12px;";

        let feedbackHtml = "";
        if (v.commissie_feedback && (status === "afgekeurd" || status === "aanpassing_vereist")) {
            feedbackHtml =
                '<p style="margin:8px 0 0;color:#b45309;"><strong>Feedback commissie:</strong> ' +
                v.commissie_feedback + "</p>";
        }

        blok.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">' +
                "<strong>" + (v.bedrijf || "Onbekend bedrijf") + "</strong>" +
                '<span class="status-badge status-' + status + '">' + label + "</span>" +
            "</div>" +
            '<p style="margin:6px 0 0;color:#475569;">' + (v.functie || "") + "</p>" +
            '<p style="margin:4px 0 0;color:#64748b;font-size:0.9em;">' +
                "Ingediend op " + toonDatum(v.aangemaakt_op) +
                " &middot; " + toonDatum(v.startdatum) + " t.e.m. " + toonDatum(v.einddatum) +
            "</p>" +
            feedbackHtml;

        geschiedenisLijst.appendChild(blok);
    });
}

/* Haal de aanvragen van de ingelogde student op (alleen de eigen aanvragen) */
async function laadAanvragen() {
    try {
        const antwoord = await fetch(API_URL + "/api/stages/mijn", {
            headers: { "Authorization": "Bearer " + (localStorage.getItem("token") || "") }
        });

        if (!antwoord.ok) return;

        const voorstellen = await antwoord.json();

        if (voorstellen.length === 0) {
            /* Geen aanvragen: toon enkel de startkaart */
            return;
        }

        toonStatus(voorstellen[0]);
        toonGeschiedenis(voorstellen);
    } catch (fout) {
        console.error("Kan aanvragen niet laden:", fout);
    }
}

laadAanvragen();
