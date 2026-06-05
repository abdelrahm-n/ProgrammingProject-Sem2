// nav.js — gedeelde navigatielogica voor alle pagina's
// Voeg toe aan elke pagina: <script type="module" src="/js/nav.js"></script>

// Doorsturen naar login als er geen token is
if (!localStorage.getItem('token')) {
  window.location.href = '/login.html'
}

// Uitlogknop
const uitlogBtn = document.getElementById('uitlogBtn')
if (uitlogBtn) {
  uitlogBtn.addEventListener('click', function () {
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
    window.location.href = '/login.html'
  })
}
