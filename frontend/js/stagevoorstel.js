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