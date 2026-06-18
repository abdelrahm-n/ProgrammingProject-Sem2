let huidigeEvaluatieType = "tussen";

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


function openMentorEvaluatie() {
  document.getElementById("studentenLijstCard").style.display = "none";
  document.getElementById("mentorKeuzeCard").style.display = "block";
}

function terugNaarStudenten() {
  document.getElementById("studentenLijstCard").style.display = "block";
  document.getElementById("mentorKeuzeCard").style.display = "none";
  document.getElementById("mentorFormulierCard").style.display = "none";
}

function toonMentorEvaluatie(type) {
  huidigeEvaluatieType = type;

  document.getElementById("mentorKeuzeCard").style.display = "none";
  document.getElementById("mentorFormulierCard").style.display = "block";

  document.getElementById("mentorEvaluatieTitel").textContent =
    type === "tussen" ? "Tussentijdse evaluatie" : "Eindevaluatie";

  const studentData =
    type === "tussen"
      ? JSON.parse(localStorage.getItem("zelfEvaluatieTussen")) || []
      : JSON.parse(localStorage.getItem("zelfEvaluatieEinde")) || [];

  const lijst = document.getElementById("mentorCompetentieLijst");
  lijst.replaceChildren();

  competenties.forEach((comp, index) => {
    const kaart = document.createElement("div");
    kaart.className = "competentie-card";

    const titel = document.createElement("h3");
    titel.textContent = comp.naam;

    const zelfscore = document.createElement("p");
    zelfscore.innerHTML = `<strong>Zelfscore student:</strong> ${studentData[index]?.zelfscore || "Nog niet ingevuld"}`;

    const reflectie = document.createElement("p");
    reflectie.innerHTML = `<strong>Reflectie student:</strong> ${studentData[index]?.reflectie || "Nog niet ingevuld"}`;

    const scoreLabel = document.createElement("label");
    scoreLabel.textContent = "Mentorscore";

    const select = document.createElement("select");
    select.id = `${comp.id}-mentor-score`;

    ["", "5/5", "3/5", "0/5"].forEach((score) => {
      const option = document.createElement("option");
      option.value = score;
      option.textContent = score === "" ? "Kies score" : score;
      select.appendChild(option);
    });

    const feedbackLabel = document.createElement("label");
    feedbackLabel.textContent = "Feedback mentor";

    const feedback = document.createElement("textarea");
    feedback.id = `${comp.id}-mentor-feedback`;
    feedback.placeholder = "Schrijf hier feedback voor de student...";

    kaart.appendChild(titel);
    kaart.appendChild(zelfscore);
    kaart.appendChild(reflectie);
    kaart.appendChild(scoreLabel);
    kaart.appendChild(select);
    kaart.appendChild(feedbackLabel);
    kaart.appendChild(feedback);

    lijst.appendChild(kaart);
  });
}

function mentorEvaluatieOpslaan() {
  const studentData =
    huidigeEvaluatieType === "tussen"
      ? JSON.parse(localStorage.getItem("zelfEvaluatieTussen")) || []
      : JSON.parse(localStorage.getItem("zelfEvaluatieEinde")) || [];

  const evaluatie = competenties.map((comp, index) => {
    return {
      naam: comp.naam,
      zelfscore: studentData[index]?.zelfscore || "Nog niet ingevuld",
      reflectie: studentData[index]?.reflectie || "Nog niet ingevuld",
      mentorscore: document.getElementById(`${comp.id}-mentor-score`).value,
      feedbackMentor: document.getElementById(`${comp.id}-mentor-feedback`).value
    };
  });

  const nietAllesIngevuld = evaluatie.some(
    item => !item.mentorscore || !item.feedbackMentor
  );

  if (nietAllesIngevuld) {
    alert("Vul voor elke competentie een mentorscore en feedback in.");
    return;
  }

  if (huidigeEvaluatieType === "tussen") {
    localStorage.setItem("zelfEvaluatieTussen", JSON.stringify(evaluatie));
  } else {
    localStorage.setItem("zelfEvaluatieEinde", JSON.stringify(evaluatie));
  }

  alert("Mentorevaluatie opgeslagen.");
  terugNaarStudenten();
}