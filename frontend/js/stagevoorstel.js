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

vulStudentgegevensIn();

function stagevoorstelIndienen() {

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

    localStorage.setItem("stageAanvraag", JSON.stringify(aanvraag));
    localStorage.setItem("stageStatus", "ingediend");

    window.location.href = "dashboard.html";
}