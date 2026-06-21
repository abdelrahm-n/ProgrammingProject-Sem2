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
      "<p>Dashboard kon niet geladen worden.</p>";
  }
}

function toonStatistieken(statistieken) {
  document.getElementById("totaalStudenten").textContent = statistieken.totaalStudenten;
  document.getElementById("inOrde").textContent = statistieken.inOrde;
  document.getElementById("actieVereist").textContent = statistieken.actieVereist;
}


function toonStagiairs(studenten) {
  const stagiairsLijst = document.getElementById("stagiairsTabel");

  if (!studenten || studenten.length === 0) {
    stagiairsLijst.innerHTML = "<p>Je hebt nog geen actieve stagiairs.</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Bedrijf</th>
          <th>Laatste logboekweek</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  studenten.forEach((student) => {
    const naam = `${student.voornaam} ${student.achternaam}`;
    const week = student.week_nummer ? `Week ${student.week_nummer}` : "Nog geen logboek";
    const status = student.logboek_status || "Nog niet gestart";

    html += `
      <tr>
        <td>${naam}</td>
        <td>${student.bedrijf || "-"}</td>
        <td>${week}</td>
        <td>${status}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  stagiairsLijst.innerHTML = html;
}

laadMentorDashboard();