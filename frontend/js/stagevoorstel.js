const API = "http://localhost:3000";

/* Vul de studentgegevens automatisch in via de backend */
async function vulStudentgegevensIn() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const resp = await fetch(`${API}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resp.ok) return;

        const gebruiker = await resp.json();

        document.getElementById("studentNaam").value =
            (gebruiker.voornaam || "") + " " + (gebruiker.achternaam || "");
        document.getElementById("studentNummer").value = gebruiker.studentnummer || "";
        document.getElementById("opleiding").value = gebruiker.opleiding || "";
        document.getElementById("emailStudent").value = gebruiker.email || "";

        /* Gegevens uit profiel mogen niet aangepast worden */
        document.getElementById("studentNaam").readOnly = true;
        document.getElementById("studentNummer").readOnly = true;
        document.getElementById("opleiding").readOnly = true;
        document.getElementById("emailStudent").readOnly = true;
    } catch (err) {
        console.error("Fout bij ophalen profiel:", err);
    }
}

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
        !stagebedrijf || !startDatum ||
        !eindDatum || !stageopdracht
    ) {
        alert("Vul alle verplichte velden in: bedrijf, startdatum, einddatum en stageopdracht zijn verplicht.");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Je bent niet ingelogd.");
        return;
    }

    try {
        const resp = await fetch(`${API}/api/stages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                stagebedrijf,
                contactPersoon,
                emailBedrijf,
                telefoonBedrijf,
                adresBedrijf,
                startDatum,
                eindDatum,
                functie,
                stageopdracht
            })
        });

        const data = await resp.json();

        if (!resp.ok) {
            alert(data.fout || "Er is iets misgegaan bij het indienen.");
            return;
        }

        /* Sla het voorstel ID op voor andere pagina's */
        localStorage.setItem("stageVoorstelId", data.id);
        localStorage.setItem("stageStatus", "ingediend");

        window.location.href = "dashboard.html";
    } catch (err) {
        console.error("Fout bij indienen:", err);
        alert("Kan geen verbinding maken met de server.");
    }
}

vulStudentgegevensIn();
