const API_URL = "http://localhost:3000";

/* Vul de studentgegevens automatisch in vanuit de ingelogde sessie.
   De velden zijn readonly zodat de student ze niet kan aanpassen. */
function vulStudentgegevensIn() {
  const naam = localStorage.getItem("naam") || "";
  const email = localStorage.getItem("email") || "";
  const studentnummer = localStorage.getItem("studentnummer") || "";
  const opleiding = localStorage.getItem("opleiding") || "";

  document.getElementById("studentNaam").value = naam;
  document.getElementById("studentNummer").value = studentnummer;
  document.getElementById("opleiding").value = opleiding;
  document.getElementById("emailStudent").value = email;

  document.getElementById("studentNaam").readOnly = true;
  document.getElementById("studentNummer").readOnly = true;
  document.getElementById("opleiding").readOnly = true;
  document.getElementById("emailStudent").readOnly = true;
}

vulStudentgegevensIn();

/* Lijst van alle verplichte velden met hun foutmeldingen */
const verplichteVelden = [
  { id: "stagebedrijf", fout: "Vul de naam van het bedrijf in" },
  { id: "contactPersoon", fout: "Vul de contactpersoon in" },
  { id: "emailBedrijf", fout: "Vul een geldig e-mailadres in" },
  { id: "telefoonBedrijf", fout: "Vul het telefoonnummer in" },
  { id: "adresBedrijf", fout: "Vul het adres in" },
  { id: "startDatum", fout: "Kies een startdatum" },
  { id: "eindDatum", fout: "Kies een einddatum" },
  { id: "functie", fout: "Vul de functie in" },
  { id: "stageopdracht", fout: "Beschrijf de stageopdracht" }
];

/* Toon een foutmelding onder een veld */
function toonFout(inputElement, bericht) {
  inputElement.classList.add("fout");

  const bestaandeFout = inputElement.parentElement.querySelector(".fout-melding");
  if (bestaandeFout) bestaandeFout.remove();

  const foutElement = document.createElement("span");
  foutElement.className = "fout-melding";
  foutElement.textContent = bericht;
  inputElement.parentElement.appendChild(foutElement);
}

/* Verwijder de foutmelding van een veld */
function wisFout(inputElement) {
  inputElement.classList.remove("fout");
  const foutElement = inputElement.parentElement.querySelector(".fout-melding");
  if (foutElement) foutElement.remove();
}

/* Verwijder alle foutmeldingen */
function wisAlleFouten() {
  document.querySelectorAll(".fout").forEach(el => el.classList.remove("fout"));
  document.querySelectorAll(".fout-melding").forEach(el => el.remove());
}

/* Controleer of een e-mailadres geldig is */
function isGeldigEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* Valideer alle velden en geef terug of alles geldig is */
function valideerAlleVelden() {
  let geldig = true;

  wisAlleFouten();

  for (const veld of verplichteVelden) {
    const input = document.getElementById(veld.id);
    const waarde = input.value.trim();

    if (!waarde) {
      geldig = false;
      toonFout(input, veld.fout);
    } else if (veld.id === "emailBedrijf" && !isGeldigEmail(waarde)) {
      geldig = false;
      toonFout(input, "Vul een geldig e-mailadres in (bijv. naam@bedrijf.be)");
    }
  }

  const startDatum = document.getElementById("startDatum").value;
  const eindDatum = document.getElementById("eindDatum").value;

  if (startDatum && eindDatum) {
    if (new Date(eindDatum) <= new Date(startDatum)) {
      geldig = false;
      toonFout(document.getElementById("eindDatum"), "Einddatum moet na de startdatum liggen");
    }
  }

  /* Controleer of startdatum een weekdag is */
  if (startDatum) {
    var startDag = new Date(startDatum).getDay();
    if (startDag === 0 || startDag === 6) {
      geldig = false;
      toonFout(document.getElementById("startDatum"), "Startdatum mag geen weekenddag zijn");
    }
  }

  /* Controleer of einddatum een weekdag is */
  if (eindDatum) {
    var eindDag = new Date(eindDatum).getDay();
    if (eindDag === 0 || eindDag === 6) {
      geldig = false;
      toonFout(document.getElementById("eindDatum"), "Einddatum mag geen weekenddag zijn");
    }
  }

  return geldig;
}

/* Live validatie: verwijder foutmeldingen zodra een veld wordt ingevuld */
for (const veld of verplichteVelden) {
  const input = document.getElementById(veld.id);
  input.addEventListener("input", function () {
    if (this.value.trim()) {
      wisFout(this);
    }
  });
}

/* Blokkeer weekenddagen (za=6, zo=0) bij start- en einddatum */
function blokkeerWeekend(inputId) {
  const input = document.getElementById(inputId);
  input.addEventListener("change", function () {
    if (!this.value) return;
    var dag = new Date(this.value).getDay();
    if (dag === 0 || dag === 6) {
      this.value = "";
      toonFout(this, "Weekenddagen (za-zo) zijn niet toegestaan. Kies een werkdag.");
    }
  });
}
blokkeerWeekend("startDatum");
blokkeerWeekend("eindDatum");

/* Stagevoorstel indienen */
async function stagevoorstelIndienen() {
  if (!valideerAlleVelden()) {
    return;
  }

  const aanvraag = {
    stagebedrijf: document.getElementById("stagebedrijf").value.trim(),
    contactPersoon: document.getElementById("contactPersoon").value.trim(),
    emailBedrijf: document.getElementById("emailBedrijf").value.trim(),
    telefoonBedrijf: document.getElementById("telefoonBedrijf").value.trim(),
    adresBedrijf: document.getElementById("adresBedrijf").value.trim(),
    startDatum: document.getElementById("startDatum").value,
    eindDatum: document.getElementById("eindDatum").value,
    functie: document.getElementById("functie").value.trim(),
    stageopdracht: document.getElementById("stageopdracht").value.trim()
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
