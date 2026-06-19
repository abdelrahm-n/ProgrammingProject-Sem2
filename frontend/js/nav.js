// nav.js - navigatielogica voor alle pagina's
var rootPad = (window.location.pathname.indexOf('/student/') !== -1 ||
               window.location.pathname.indexOf('/docent/') !== -1 ||
               window.location.pathname.indexOf('/stagecommissie/') !== -1 ||
               window.location.pathname.indexOf('/mentor/') !== -1 ||
               window.location.pathname.indexOf('/admin/') !== -1) ? '../index.html' : 'index.html'

if (!localStorage.getItem('rol')) {
  window.location.href = rootPad
}

var uitlogBtn = document.getElementById('uitlogBtn')
if (uitlogBtn) {
  uitlogBtn.addEventListener('click', function() {
    localStorage.removeItem('rol')
    localStorage.removeItem('token')
    localStorage.removeItem('id')
    localStorage.removeItem('naam')
    localStorage.removeItem('email')
    localStorage.removeItem('studentnummer')
    localStorage.removeItem('opleiding')
    window.location.href = rootPad
  })
}
