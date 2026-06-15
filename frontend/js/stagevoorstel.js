/* Vul de studentgegevens automatisch in vanuit de ingelogde sessie */
function vulStudentgegevensIn() {
    const naam = localStorage.getItem("naam") || "Test Account";
    const email = localStorage.getItem("email") || "test.account@student.ehb.be";
    const studentnummer = localStorage.getItem("studentnummer") || "r0123456";

    const naamVeld = document.getElementById("studentNaam");
    const nummerVeld = document.getElementById("studentNummer");
    const opleidingVeld = document.getElementById("opleiding");
    const emailVeld = document.getElementById("emailStudent");

    naamVeld.value = naam;
    nummerVeld.value = studentnummer;
    opleidingVeld.value = "Toegepaste Informatica";
    emailVeld.value = email;

    /* Deze gegevens komen uit het profiel en mogen niet aangepast worden */
    naamVeld.readOnly = true;
    nummerVeld.readOnly = true;
    opleidingVeld.readOnly = true;
    emailVeld.readOnly = true;
}

/* Zet eerder ingevulde gegevens terug zodat ze bewaard blijven */
function herstelOpgeslagenAanvraag() {
    const opgeslagen = localStorage.getItem("stageAanvraag");
    if (!opgeslagen) {
        return;
    }

    const aanvraag = JSON.parse(opgeslagen);

    document.getElementById("stagebedrijf").value = aanvraag.stagebedrijf || "";
    document.getElementById("contactPersoon").value = aanvraag.contactPersoon || "";
    document.getElementById("emailBedrijf").value = aanvraag.emailBedrijf || "";
    document.getElementById("telefoonBedrijf").value = aanvraag.telefoonBedrijf || "";
    document.getElementById("adresBedrijf").value = aanvraag.adresBedrijf || "";
    document.getElementById("startDatum").value = aanvraag.startDatum || "";
    document.getElementById("eindDatum").value = aanvraag.eindDatum || "";
    document.getElementById("functie").value = aanvraag.functie || "";
    document.getElementById("stageopdracht").value = aanvraag.stageopdracht || "";
}

/* Bewaar de stagegegevens in de database tabellen via de backend */
async function bewaarInDatabase(aanvraag) {
    try {
        await fetch("http://localhost:3000/api/stages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (localStorage.getItem("token") || "")
            },
            body: JSON.stringify({
                bedrijf: aanvraag.stagebedrijf,
                omschrijving: aanvraag.stageopdracht
            })
        });
    } catch (fout) {
        /* Zonder server blijft de aanvraag in localStorage bewaard */
        console.log("Opslaan in database overgeslagen (geen server).");
    }
}

vulStudentgegevensIn();
herstelOpgeslagenAanvraag();

async function stagevoorstelIndienen() {

    const studentNaam = document.getElementById("studentNaam").value;
    const studentNummer = document.getElementById("studentNummer").value;
    const opleiding = document.getElementById("opleiding").value;
    const emailStudent = document.getElementById("emailStudent").value;

    const stagebedrijf = document.getElementById("stagebedrijf").value;
    const contactPersoon = document.getElementById("contactPersoon").value;
    const emailBedrijf = document.getElementById("emailBedrijf").value;
    const telefoonBedrijf = document.getElementById("telefoonBedrijf").value;
    const adresBedrijf = document.getElementById("adresBedrijf").value;

    const startDatum = document.getElementById("startDatum").value;
    const eindDatum = document.getElementById("eindDatum").value;

    const functie = document.getElementById("functie").value;
    const stageopdracht = document.getElementById("stageopdracht").value;

    if (
        !studentNaam ||
        !studentNummer ||
        !opleiding ||
        !emailStudent ||
        !stagebedrijf ||
        !contactPersoon ||
        !emailBedrijf ||
        !telefoonBedrijf ||
        !adresBedrijf ||
        !startDatum ||
        !eindDatum ||
        !functie ||
        !stageopdracht
    ) {
        alert("Vul alle verplichte velden in voordat je de stageaanvraag indient.");
        return;
    }

    const aanvraag = {
        studentNaam,
        studentNummer,
        opleiding,
        emailStudent,
        stagebedrijf,
        contactPersoon,
        emailBedrijf,
        telefoonBedrijf,
        adresBedrijf,
        startDatum,
        eindDatum,
        functie,
        stageopdracht
    };

    /* Bewaar lokaal zodat het overzicht en de overeenkomst de gegevens tonen */
    localStorage.setItem("stageAanvraag", JSON.stringify(aanvraag));
    localStorage.setItem("stageStatus", "ingediend");

    /* Bewaar de gegevens ook in de database tabellen */
    await bewaarInDatabase(aanvraag);

    window.location.href = "dashboard.html";
}