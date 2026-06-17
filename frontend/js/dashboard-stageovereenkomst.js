const API = "http://localhost:3000/api"
const STUDENT_ID = 1 // voorlopig hardcoded

document.addEventListener("DOMContentLoaded", function () {
  laadDashboardStatus()
})

async function laadDashboardStatus() {
  try {
    const res = await fetch(`${API}/stageovereenkomst/voorstel/${STUDENT_ID}`)
    const data = await res.json()

    if (!res.ok) {
      // Geen voorstel gevonden → toon "stageproces starten"
      return
    }

    const stageprocesCard = document.getElementById("stageprocesCard")
    const stageovereenkomstCard = document.getElementById("stageovereenkomstCard")

    if (data.status_naam === "goedgekeurd") {
      // Verberg "stageproces starten", toon "stageovereenkomst"
      if (stageprocesCard) stageprocesCard.style.display = "none"
      if (stageovereenkomstCard) stageovereenkomstCard.style.display = "block"
    } else if (data.status_naam === "ingediend") {
      // Toon progress stap "ingediend"
      const step = document.getElementById("step-ingediend")
      if (step) step.classList.add("active")
    }
  } catch (error) {
    console.error("Dashboard status laden mislukt:", error)
  }
}
