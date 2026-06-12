const status = localStorage.getItem("stageStatus");

if (status === "ingediend") {

    const stap = document.getElementById("step-ingediend");

    if (stap) {
        stap.classList.add("active");
    }

    const kaart = document.getElementById("start-stage-card");

    if (kaart) {
        kaart.style.display = "none";
    }
}