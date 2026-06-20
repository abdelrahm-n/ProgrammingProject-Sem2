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

let huidigeAanvraagId = null;
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

/* ---------- VIEW TOGGLE ---------- */

function toonDetail() {
  lijstCard.style.display = "none";
  detailCard.style.display = "block";
  window.scrollTo(0, 0);
}

function toonLijst() {
  detailCard.style.display = "none";
  lijstCard.style.display = "block";
  huidigeAanvraagId = null;
  laadLijst();
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
        '<div class="lijst-info">' +
          '<span class="lijst-naam">' + escape(a.voornaam + " " + a.achternaam) + "</span>" +
          '<span class="lijst-meta">' +
            escape(a.bedrijf) + " &middot; ingediend op " + toonDatum(a.aangemaakt_op) +
          "</span>" +
        "</div>" +
        '<span class="status-badge status-' + a.status + '">' + label + "</span>";
      aanvraagLijst.appendChild(item);
    });
  } catch (fout) {
    aanvraagLijst.innerHTML = "<p>Kan geen verbinding maken met de server.</p>";
  }
}

/* ---------- DETAIL ---------- */

function rij(label, waarde, extraClass) {
  const cls = extraClass ? ' class="' + extraClass + '"' : "";
  return "<tr" + cls + "><td>" + label + "</td><td>" + escape(waarde || "-") + "</td></tr>";
}

async function openDetail(id) {
  huidigeAanvraagId = id;

  tabelBody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:24px;color:var(--color-text-muted);">Laden...</td></tr>';
  bestaandeFeedback.style.display = "none";
  detailTitel.textContent = "";
  statusBadge.textContent = "";
  statusBadge.className = "status-badge";

  toonDetail();

  try {
    const antwoord = await fetch(API_URL + "/api/stages/" + id, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!antwoord.ok) {
      tabelBody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:24px;color:var(--color-error);">Kon de aanvraag niet laden.</td></tr>';
      return;
    }

    const a = await antwoord.json();

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
      rij("Omschrijving opdracht", a.omschrijving_opdracht, "rij-omschrijving");

    if (a.commissie_feedback) {
      bestaandeFeedback.style.display = "block";
      bestaandeFeedbackTekst.textContent = a.commissie_feedback;
    } else {
      bestaandeFeedback.style.display = "none";
    }
  } catch (fout) {
    tabelBody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:24px;color:var(--color-error);">Kan geen verbinding maken met de server.</td></tr>';
  }
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
    toonLijst();
const urlParams = new URLSearchParams(window.location.search);
const svId = urlParams.get("sv_id");

if (svId) {
  openDetail(svId);
} else {
const urlParams = new URLSearchParams(window.location.search);
const svId = urlParams.get("sv_id");

if (svId) {
  openDetail(svId);
} else {
  laadLijst();
}
}
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

document.getElementById("terugNaarLijst").addEventListener("click", toonLijst);

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

const urlParams = new URLSearchParams(window.location.search);
const svId = urlParams.get("sv_id");

if (svId) {
  openDetail(svId);
} else {
  laadLijst();
}
