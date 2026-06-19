const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token") || "";

const domeinen = {
  student: "student.ehb.be",
  docent: "docent.ehb.be",
  stagementor: "mentor.ehb.be",
  stagecommissie: "commissie.ehb.be",
  admin: "admin.ehb.be"
};

function genereerEmail() {
  const voornaam = document.getElementById("voornaam").value.trim().toLowerCase().replace(/[^a-z]/g, "");
  const achternaam = document.getElementById("achternaam").value.trim().toLowerCase().replace(/[^a-z]/g, "");
  const rol = document.getElementById("rol").value;

  if (voornaam && achternaam && rol) {
    const email = voornaam + "." + achternaam + "@" + domeinen[rol];
    document.getElementById("emailPreview").style.display = "block";
    document.getElementById("emailPreviewTekst").textContent = email;
  } else {
    document.getElementById("emailPreview").style.display = "none";
  }
}

document.getElementById("voornaam").addEventListener("input", genereerEmail);
document.getElementById("achternaam").addEventListener("input", genereerEmail);

document.getElementById("rol").addEventListener("change", function() {
  const rol = this.value;
  const extra = document.getElementById("extraVelden");

  document.querySelectorAll("#extraVelden > div").forEach(d => d.style.display = "none");

  if (rol) {
    extra.style.display = "block";
    const veld = document.getElementById("velden-" + rol);
    if (veld) veld.style.display = "block";
  } else {
    extra.style.display = "none";
  }

  genereerEmail();
});

async function laadDropdowns() {
  try {
    const [opleidingen, bedrijven] = await Promise.all([
      fetch(API_URL + "/api/admin/opleidingen", { headers: { "Authorization": "Bearer " + token } }).then(r => r.ok ? r.json() : []),
      fetch(API_URL + "/api/admin/bedrijven", { headers: { "Authorization": "Bearer " + token } }).then(r => r.ok ? r.json() : [])
    ]);

    const oSelect = document.getElementById("opleiding");
    opleidingen.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = o.naam + (o.afkorting ? " (" + o.afkorting + ")" : "");
      oSelect.appendChild(opt);
    });

    const bSelect = document.getElementById("bedrijf");
    bedrijven.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.naam;
      bSelect.appendChild(opt);
    });
  } catch (fout) {
    console.error(fout);
  }
}

document.getElementById("accountForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const rol = document.getElementById("rol").value;
  const voornaam = document.getElementById("voornaam").value.trim();
  const achternaam = document.getElementById("achternaam").value.trim();
  const wachtwoord = document.getElementById("wachtwoord").value;
  const melding = document.getElementById("melding");

  melding.className = "melding";
  melding.textContent = "";

  if (!rol || !voornaam || !achternaam || !wachtwoord) {
    melding.className = "melding melding--fout";
    melding.textContent = "Alle velden zijn verplicht.";
    return;
  }

  if (wachtwoord.length < 6) {
    melding.className = "melding melding--fout";
    melding.textContent = "Wachtwoord moet minstens 6 tekens hebben.";
    return;
  }

  const extra = {};

  if (rol === "student") {
    extra.studentnummer = document.getElementById("studentnummer").value.trim() || null;
    extra.opleiding_id = document.getElementById("opleiding").value || 1;
  } else if (rol === "docent") {
    extra.vakgroep = document.getElementById("vakgroep").value.trim() || null;
  } else if (rol === "stagementor") {
    extra.functie = document.getElementById("functie").value.trim() || null;
    extra.bedrijf_id = document.getElementById("bedrijf").value || null;
  } else if (rol === "stagecommissie") {
    extra.commissie_rol = document.getElementById("commissieRol").value.trim() || null;
  } else if (rol === "admin") {
    extra.dienst = document.getElementById("dienst").value.trim() || null;
  }

  try {
    const antwoord = await fetch(API_URL + "/api/admin/gebruiker-aanmaken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ voornaam, achternaam, wachtwoord, rol, extra })
    });

    const data = await antwoord.json().catch(() => ({}));

    if (!antwoord.ok) {
      melding.className = "melding melding--fout";
      melding.textContent = data.fout || "Aanmaken mislukt.";
      return;
    }

    melding.className = "melding melding--succes";
    melding.textContent = "Account aangemaakt! E-mailadres: " + data.email;
    document.getElementById("accountForm").reset();
    document.getElementById("extraVelden").style.display = "none";
    document.getElementById("emailPreview").style.display = "none";

  } catch (fout) {
    melding.className = "melding melding--fout";
    melding.textContent = "Kan geen verbinding maken met de server.";
  }
});

laadDropdowns();
