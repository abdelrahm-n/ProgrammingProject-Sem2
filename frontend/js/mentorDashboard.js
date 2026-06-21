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
        document.getElementById("stagiairsLijst").innerHTML =
            "<p>Dashboard kon niet geladen worden.</p>";
    }
}

function toonStatistieken(statistieken) {
    const wachtSectie = document.getElementById("wachtSectie");
    const wachtLijst = document.getElementById("wachtLijst");

    wachtSectie.style.display = "block";

    wachtLijst.innerHTML = `
    <div class="dashboard-grid">
      <div class="student-card">
        <h3>Totaal stagiairs</h3>
        <p>${statistieken.totaalStudenten}</p>
      </div>

      <div class="student-card">
        <h3>In orde</h3>
        <p>${statistieken.inOrde}</p>
      </div>

      <div class="student-card">
        <h3>Actie vereist</h3>
        <p>${statistieken.actieVereist}</p>
      </div>
    </div>
  `;
}

function toonStagiairs(studenten) {
    const stagiairsLijst = document.getElementById("stagiairsLijst");

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
