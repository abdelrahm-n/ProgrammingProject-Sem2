const API_URL = "http://localhost:3000/api/stageovereenkomst";

const stagevoorstelId = 1;

const stapOverzicht = document.getElementById("stapOverzicht");
const stapContract = document.getElementById("stapContract");
const stapActivatie = document.getElementById("stapActivatie");

const bekijkBtn = document.getElementById("bekijkBtn");
const ondertekenBtn = document.getElementById("ondertekenBtn");

function toonOverzicht() {
  stapOverzicht.style.display = "block";
  stapContract.style.display = "none";
  stapActivatie.style.display = "none";
}

function toonContract() {
  stapOverzicht.style.display = "none";
  stapContract.style.display = "block";
  stapActivatie.style.display = "none";
}

function toonActivatie() {
  stapOverzicht.style.display = "none";
  stapContract.style.display = "none";
  stapActivatie.style.display = "block";
}

async function laadStageovereenkomst() {
  const melding = document.getElementById("melding");

  try {
    const response = await fetch(`${API_URL}/${stagevoorstelId}`);
    const data = await response.json();

    if (!response.ok) {
      melding.textContent = data.message;
      return;
    }

    document.getElementById("studentNaam").textContent =
      `${data.student_voornaam} ${data.student_achternaam}`;

    document.getElementById("studentnummer").textContent = data.studentnummer;
    document.getElementById("opleiding").textContent = data.opleiding;
    document.getElementById("emailStudent").textContent = data.email_student;

    document.getElementById("bedrijfNaam").textContent = data.bedrijf_naam;

    document.getElementById("contactpersoon").textContent =
      data.mentor_voornaam
        ? `${data.mentor_voornaam} ${data.mentor_achternaam}`
        : "Niet ingevuld";

    document.getElementById("emailBedrijf").textContent = data.email_bedrijf;
    document.getElementById("telefoon").textContent = data.telefoon;

    document.getElementById("stageperiode").textContent =
      `${formatDatum(data.startdatum)} - ${formatDatum(data.einddatum)}`;

    document.getElementById("functie").textContent =
      data.mentor_functie ?? "Niet ingevuld";

    document.getElementById("stageopdracht").textContent =
      data.omschrijving_opdracht;

    document.getElementById("status").textContent = data.overeenkomst_status;

    document.getElementById("studentCheck").value =
      data.getekend_door_student ? "Ondertekend" : "Nog niet ondertekend";

    document.getElementById("bedrijfCheck").value =
      data.getekend_door_bedrijf ? "Ondertekend" : "Nog niet ondertekend";

    document.getElementById("schoolCheck").value =
      data.getekend_door_stagecommissie ? "Ondertekend" : "Nog niet ondertekend";

    if (data.getekend_door_student) {
      ondertekenBtn.disabled = true;
      ondertekenBtn.textContent = "Al ondertekend";
      toonActivatie();
    } else {
      toonOverzicht();
    }

  } catch (error) {
    console.error(error);
    melding.textContent = "Kan stageovereenkomst niet laden.";
  }
}

async function ondertekenAlsStudent() {
  const melding = document.getElementById("melding");

  try {
    const response = await fetch(`${API_URL}/${stagevoorstelId}/onderteken-student`, {
      method: "PUT"
    });

    const data = await response.json();

    if (!response.ok) {
      melding.textContent = data.message;
      return;
    }

    melding.textContent = data.message;

    document.getElementById("studentCheck").value = "Ondertekend";
    document.getElementById("status").textContent = "Wacht op bedrijf";

    ondertekenBtn.disabled = true;
    ondertekenBtn.textContent = "Al ondertekend";

    toonActivatie();

  } catch (error) {
    console.error(error);
    melding.textContent = "Er ging iets mis bij het ondertekenen.";
  }
}

function formatDatum(datum) {
  if (!datum) return "";
  return new Date(datum).toLocaleDateString("nl-BE");
}

bekijkBtn.addEventListener("click", toonContract);
ondertekenBtn.addEventListener("click", ondertekenAlsStudent);

laadStageovereenkomst();