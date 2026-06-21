const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../index.html";
}

async function laadMentorDashboard() {
  try {
    const response = await fetch("http://localhost:3000/api/mentor/dashboard", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = "../index.html";
      return;
    }

    const data = await response.json();

    toonStatistieken(data.statistieken);
    toonStagiairs(data.studenten);

  } catch (err) {
    console.error("Fout bij laden dashboard:", err);
    document.getElementById("stagiairsTabel").innerHTML =
      "<tr><td colspan='2'>Dashboard kon niet geladen worden.</td></tr>";
  }
}

function toonStatistieken(statistieken) {
  document.getElementById("totaalStudenten").textContent = statistieken.totaalStudenten;
  document.getElementById("inOrde").textContent = statistieken.inOrde;
  document.getElementById("actieVereist").textContent = statistieken.actieVereist;
}


function toonStagiairs(studenten) {
  const stagiairsTabel = document.getElementById("stagiairsTabel");

  if (!studenten || studenten.length === 0) {
    stagiairsTabel.innerHTML = `
      <tr>
        <td colspan="2">Je hebt nog geen actieve stagiairs.</td>
      </tr>
    `;
    return;
  }

  let html = "";

  studenten.forEach((student) => {
    const naam = `${student.voornaam} ${student.achternaam}`;
    const week = student.week_nummer
      ? `Logboek week ${student.week_nummer}`
      : "Geen logboek";

    const status = student.logboek_status || "nog niet gestart";
    console.log(student);
    html += `
      <tr>
    <td>${naam}</td>
    <td>${week}</td>
    <td>
      <a class="btn btn--primair" href="logboek-detail.html?studentId=${student.student_id}">
        Bekijken
      </a>
    </td>
  </tr>
    `;
  });

  stagiairsTabel.innerHTML = html;
}

laadMentorDashboard();
