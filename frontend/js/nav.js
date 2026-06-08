// nav.js - navigatielogica voor alle pagina's

console.log('nav.js geladen')

// stuur door naar index als er geen rol is
if (!localStorage.getItem('rol')) {
  window.location.href = 'index.html'
}

// uitlogknop
var uitlogBtn = document.getElementById('uitlogBtn')
if (uitlogBtn) {
  uitlogBtn.addEventListener('click', function() {
    localStorage.removeItem('rol')
    window.location.href = 'index.html'
  })
}