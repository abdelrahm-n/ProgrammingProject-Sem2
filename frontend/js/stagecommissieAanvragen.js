const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

const lijstCard = document.getElementById("lijst-card");
const detailCard = document.getElementById("detail-card");
const aanvraagLijst = document.getElementById("aanvraag-lijst");
const tabelBody = document.getElementById("aanvraag-tabel-body");
const detailTitel = document.getElementById("detailTitel");
const statusBadge = document.getElementById("aanvraagStatus");
const bestaandeFeedback = document.getElementById("bestaande-feedback");
const bestaandeFeedbackTekst = document.getElementById("bestaande-feedback-tekst");

const overlay = document.getElementById("feedback-overlay");
const feedbackTitel = document.getElementById("feedback-titel");
const feedbackUitleg = document.getElementById("feedback-uitleg");
const feedbackTekst = document.getElementById("feedback-tekst");
const feedbackFout = document.getElementById("feedback-fout");

/* De aanvraag die op dit moment open staat */
let huidigeAanvraagId = null;
/* De beslissing die in de popup verwerkt wordt (afgekeurd / aanpassing_vereist) */
let openstaandeBeslissing = null;

const statusLabels = {
  ingediend: "Nieuwe aanvraag",
  in_behandeling: "In behandeling",
  goedgekeurd: "Goedgekeurd",
  afgekeurd: "Afgekeurd",
  aanpassing_vereist: "Aanpassing vereist"
};

function toonDatum(waarde) {
  if (!waarde) return "-";
  return new Date(waarde).toLocaleDateString("nl-BE");
}

function escape(tekst) {
  if (tekst == null) return "";
  const div = document.createElement("div");
  div.textContent = tekst;
  return div.innerHTML;
}

/* ---------- LIJST ---------- */

async function laadLijst() {
  try {
    const antwoord = await fetch(API_URL + "/api/stages", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!antwoord.ok) {
      aanvraagLijst.innerHTML = "<p>Kan de aanvragen niet laden.</p>";
      return;
    }

    const aanvragen = await antwoord.json();

    if (aanvragen.length === 0) {
      aanvraagLijst.innerHTML = "<p>Er zijn nog geen ingediende aanvragen.</p>";
      return;
    }

    aanvraagLijst.innerHTML = "";
    aanvragen.forEach(a => {
      const label = statusLabels[a.status] || a.status;
      const item = document.createElement("div");
      item.className = "aanvraag-lijst-item";
      item.addEventListener("click", () => openDetail(a.id));
      item.innerHTML =
        "<div>" +
          "<strong>" + escape(a.voornaam + " " + a.achternaam) + "</strong>" +
          '<div style="color:#64748b;font-size:0.9em;">' +
            escape(a.bedrijf) + " &middot; ingediend op " + toonDatum(a.aangemaakt_op) +
          "</div>" +
        "</div>" +
        '<span class="status-badge status-' + a.status + '">' + label + "</span>";
      aanvraagLijst.appendChild(item);
    });
  } catch (fout) {
    aanvraagLijst.innerHTML = "<p>Kan geen verbinding maken met de server.</p>";
  }
}

/* ---------- DETAIL ---------- */

function rij(label, waarde) {
  return "<tr><td>" + label + "</td><td>" + escape(waarde || "-") + "</td></tr>";
}

async function openDetail(id) {
  try {
    const antwoord = await fetch(API_URL + "/api/stages/" + id, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!antwoord.ok) return;

    const a = await antwoord.json();
    huidigeAanvraagId = id;

    detailTitel.textContent = a.voornaam + " " + a.achternaam;

    const label = statusLabels[a.status] || a.status;
    statusBadge.textContent = label;
    statusBadge.className = "status-badge status-" + a.status;

    tabelBody.innerHTML =
      rij("Student", a.voornaam + " " + a.achternaam) +
      rij("Studentnummer", a.studentnummer) +
      rij("Opleiding", a.opleiding) +
      rij("E-mail student", a.student_email) +
      rij("Stagebedrijf", a.bedrijf) +
      rij("Adres bedrijf", a.adres) +
      rij("Contactpersoon", a.contactpersoon) +
      rij("E-mail bedrijf", a.bedrijf_email) +
      rij("Telefoon", a.telefoon) +
      rij("Startdatum", toonDatum(a.startdatum)) +
      rij("Einddatum", toonDatum(a.einddatum)) +
      rij("Functie", a.functie) +
      rij("Omschrijving opdracht", a.omschrijving_opdracht);

    /* Toon eerdere feedback indien aanwezig */
    if (a.commissie_feedback) {
      bestaandeFeedback.style.display = "block";
      bestaandeFeedbackTekst.textContent = a.commissie_feedback;
    } else {
      bestaandeFeedback.style.display = "none";
    }

    lijstCard.style.display = "none";
    detailCard.style.display = "block";
    window.scrollTo(0, 0);
  } catch (fout) {
    console.error("Detail laden mislukt:", fout);
  }
}

function terugNaarLijst() {
  detailCard.style.display = "none";
  lijstCard.style.display = "block";
  huidigeAanvraagId = null;
}

/* ---------- BESLISSING VERSTUREN ---------- */

async function verstuurBeslissing(beslissing, feedback) {
  try {
    const antwoord = await fetch(API_URL + "/api/stages/" + huidigeAanvraagId + "/beoordeling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ beslissing, feedback: feedback || null })
    });

    if (!antwoord.ok) {
      const fout = await antwoord.json().catch(() => ({}));
      alert(fout.fout || "Beslissing opslaan mislukt.");
      return;
    }

    sluitPopup();
    terugNaarLijst();
    laadLijst();
  } catch (fout) {
    alert("Kan geen verbinding maken met de server.");
  }
}

/* ---------- FEEDBACK POPUP ---------- */

function openPopup(beslissing) {
  openstaandeBeslissing = beslissing;
  feedbackTekst.value = "";
  feedbackFout.style.display = "none";

  if (beslissing === "afgekeurd") {
    feedbackTitel.textContent = "Aanvraag afkeuren";
    feedbackUitleg.textContent = "Geef de reden waarom de aanvraag wordt afgekeurd. De student ziet deze feedback.";
  } else {
    feedbackTitel.textContent = "Aanpassing vereist";
    feedbackUitleg.textContent = "Beschrijf wat de student moet aanpassen voor een nieuwe indiening.";
  }

  overlay.style.display = "flex";
}

function sluitPopup() {
  overlay.style.display = "none";
  openstaandeBeslissing = null;
}

/* ---------- EVENTS ---------- */

document.getElementById("terugNaarLijst").addEventListener("click", terugNaarLijst);

document.getElementById("btnGoedkeuren").addEventListener("click", function () {
  if (confirm("Deze aanvraag goedkeuren?")) {
    verstuurBeslissing("goedgekeurd", null);
  }
});

document.getElementById("btnAfkeuren").addEventListener("click", function () {
  openPopup("afgekeurd");
});

document.getElementById("btnAanpassing").addEventListener("click", function () {
  openPopup("aanpassing_vereist");
});

document.getElementById("feedback-annuleer").addEventListener("click", sluitPopup);

document.getElementById("feedback-verstuur").addEventListener("click", function () {
  const tekst = feedbackTekst.value.trim();
  if (!tekst) {
    feedbackFout.style.display = "block";
    return;
  }
  verstuurBeslissing(openstaandeBeslissing, tekst);
});

laadLijst();
