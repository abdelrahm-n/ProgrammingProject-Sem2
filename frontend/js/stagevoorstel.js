const API_URL = "http://localhost:3000";

/* Vul de studentgegevens automatisch in vanuit de ingelogde sessie.
   Deze gegevens komen uit de database (via de login) en mogen niet
   aangepast worden. */
function vulStudentgegevensIn() {
    const naam = localStorage.getItem("naam") || "";
    const email = localStorage.getItem("email") || "";
    const studentnummer = localStorage.getItem("studentnummer") || "";
    const opleiding = localStorage.getItem("opleiding") || "";

    const naamVeld = document.getElementById("studentNaam");
    const nummerVeld = document.getElementById("studentNummer");
    const opleidingVeld = document.getElementById("opleiding");
    const emailVeld = document.getElementById("emailStudent");

    naamVeld.value = naam;
    nummerVeld.value = studentnummer;
    opleidingVeld.value = opleiding;
    emailVeld.value = email;

    naamVeld.readOnly = true;
    nummerVeld.readOnly = true;
    opleidingVeld.readOnly = true;
    emailVeld.readOnly = true;
}

vulStudentgegevensIn();

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

    try {
        const antwoord = await fetch(API_URL + "/api/stages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (localStorage.getItem("token") || "")
            },
            body: JSON.stringify(aanvraag)
        });

        if (!antwoord.ok) {
            const fout = await antwoord.json().catch(() => ({}));
            alert(fout.fout || "Indienen mislukt. Probeer opnieuw.");
            return;
        }

        window.location.href = "dashboard.html";
    } catch (fout) {
        alert("Kan geen verbinding maken met de server.");
    }
}
