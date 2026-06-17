const competenties = [
  { id: "lo1", naam: "LO1 - Beheersing van het planningsproces. De lerende professional beheerst het volledige project - of operationeel planningsproces." },
  { id: "lo2", naam: "LO2 - Ontwerpen van IT-oplossingen. De lerende professional ontwerpt IT-oplossingen volgens de industriestandaarden." },
  { id: "lo3", naam: "LO3 - Implementatie van digitale producten. De lerende professional implementeert digitale producten in een professionele omgeving." },
  { id: "lo4", naam: "LO4 - Integratie van technologie en infrastructuur De lerende professional integreert technologie en infrastructuur binnen een professionele omgeving." },
  { id: "lo5", naam: "LO5 - Onderzoekende houding De lerende professional hanteert een onderzoekende houding om tot innovatieve oplossingen te komen." },
  { id: "lo6", naam: "LO6 - Helder en transparant communiceren De lerende professional communiceert helder en transparant in een professionele omgeving en/of in teamverband." },
  { id: "lo7", naam: "LO7 - Probleemoplossend vermogen De lerende professional denkt kritisch na om problemen efficiënt en effectief op te lossen." },
  { id: "lo8", naam: "LO8 - Persoonlijke ontwikkeling De lerende professional ziet persoonlijke ontwikkeling als de basis voor professionele groei." },
  { id: "lo9", naam: "LO9 - Professionele attitude De lerende professional ontwikkelt een professionele attitude en handelt kwaliteitsvol." },
  { id: "lo10", naam: "LO10 - Ondernemend handelen De lerende professional demonstreert ondernemend handelen in functie van waardecreatie." },
  { id: "lo11", naam: "LO11 - Ethisch en deontologisch handelen De lerende professional handelt ethisch en deontologisch." }
]

let huidigeEvaluatieType = "tussen";

function toonZelfevaluatie(type) {
  huidigeEvaluatieType = type;

  document.getElementById("zelfevaluatieCard").style.display = "block";
  document.getElementById("zelfevaluatieTitel").textContent =
    type === "tussen"
      ? "Zelfevaluatie - tussentijdse evaluatie"
      : "Zelfevaluatie - eindevaluatie";

  const lijst = document.getElementById("competentieLijst");
  lijst.innerHTML = "";

  competenties.forEach((comp) => {
    lijst.innerHTML += `
      <div class="competentie-card">
        <div class="competentie-header">
          <h3>${comp.naam}</h3>
          <span class="gewicht">Gewicht: 20%</span>
        </div>

        <div class="score-keuzes">
          <label class="score-optie">
            <input type="radio" name="${comp.id}-score" value="5/5">
            <strong>5 punten - Sterk</strong><br>
            Ik voer deze competentie sterk uit.
          </label>

          <label class="score-optie">
            <input type="radio" name="${comp.id}-score" value="3/5">
            <strong>3 punten - Goed</strong><br>
            Ik kan dit meestal zelfstandig toepassen.
          </label>

          <label class="score-optie">
            <input type="radio" name="${comp.id}-score" value="0/5">
            <strong>0 punten - Onvoldoende</strong><br>
            Ik ontwikkel deze competentie nog onvoldoende.
          </label>
        </div>

        <textarea id="${comp.id}-reflectie" placeholder="Schrijf hier je reflectie..."></textarea>
      </div>
    `;
  });
}

function zelfEvaluatieOpslaan() {
  const zelfEvaluatie = competenties.map((comp) => {
    return {
      naam: comp.naam,
      zelfscore: document.querySelector(`input[name="${comp.id}-score"]:checked`)?.value || "",
      reflectie: document.getElementById(`${comp.id}-reflectie`).value,
      mentorscore: "Nog niet ingevuld",
      feedbackMentor: "Nog niet ingevuld"
    };
  });

  const nietAllesIngevuld = zelfEvaluatie.some(
    (item) => !item.zelfscore || !item.reflectie
  );

  if (nietAllesIngevuld) {
    alert("Vul voor elke competentie een score en reflectie in.");
    return;
  }

  if (huidigeEvaluatieType === "tussen") {
    localStorage.setItem("zelfEvaluatieTussen", JSON.stringify(zelfEvaluatie));
  } else {
    localStorage.setItem("zelfEvaluatieEinde", JSON.stringify(zelfEvaluatie));
  }

  alert("Zelfevaluatie opgeslagen.");

  document.getElementById("zelfevaluatieCard").style.display = "none";

  toonResultaat();
  toonEindeResultaat();
  updateInvullenKnop();
}

function scoreNaarGetal(score) {
  if (!score || score === "Nog niet ingevuld") return 0;
  return Number(score.split("/")[0]);
}

function toonResultaat() {
  const data = JSON.parse(localStorage.getItem("zelfEvaluatieTussen")) || [];
  const tbody = document.getElementById("evaluatieResultaat");

  if (data.length === 0) return;

  tbody.innerHTML = "";

  data.forEach((item) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.naam}</td>
        <td>${item.zelfscore}</td>
        <td>${item.mentorscore}</td>
        <td>${item.reflectie}</td>
        <td>${item.feedbackMentor}</td>
      </tr>
    `;
  });

  const studentTotaal = data.reduce((totaal, item) => totaal + scoreNaarGetal(item.zelfscore), 0);
  document.getElementById("studentTussenTotaal").textContent = `${studentTotaal}/55`;
}

function toonEindeResultaat() {
  const data = JSON.parse(localStorage.getItem("zelfEvaluatieEinde")) || [];
  const tbody = document.getElementById("eindeEvaluatieResultaat");

  if (data.length === 0) return;

  tbody.innerHTML = "";

  data.forEach((item) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.naam}</td>
        <td>${item.zelfscore}</td>
        <td>${item.mentorscore}</td>
        <td>${item.reflectie}</td>
        <td>${item.feedbackMentor}</td>
      </tr>
    `;
  });

  const studentTotaal = data.reduce((totaal, item) => totaal + scoreNaarGetal(item.zelfscore), 0);
  document.getElementById("studentEindeTotaal").textContent = `${studentTotaal}/55`;

  document.getElementById("eindResultaat").textContent = "In afwachting van mentor";
}

function updateInvullenKnop() {
  const tussen = JSON.parse(localStorage.getItem("zelfEvaluatieTussen")) || [];
  const einde = JSON.parse(localStorage.getItem("zelfEvaluatieEinde")) || [];

  if (tussen.length > 0) {
    document.getElementById("invullenTussenBtn").style.display = "none";
    document.getElementById("ingediendTussenBadge").style.display = "inline-block";
  }

  if (einde.length > 0) {
    document.getElementById("invullenEindeBtn").style.display = "none";
    document.getElementById("ingediendEindeBadge").style.display = "inline-block";
  }

  if (tussen.length > 0 && einde.length > 0) {
    document.getElementById("eindoverzichtCard").style.display = "block";
  }
}

toonResultaat();
toonEindeResultaat();
updateInvullenKnop();