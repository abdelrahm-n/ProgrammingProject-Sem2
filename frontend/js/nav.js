// nav.js - navigatielogica voor alle pagina's

// --- Bepaal root pad ---
var rootPad = (window.location.pathname.indexOf('/student/') !== -1 ||
               window.location.pathname.indexOf('/docent/') !== -1 ||
               window.location.pathname.indexOf('/stagecommissie/') !== -1 ||
               window.location.pathname.indexOf('/mentor/') !== -1 ||
               window.location.pathname.indexOf('/admin/') !== -1) ? '../index.html' : 'index.html'

// --- Blokkeer toegang als niet ingelogd ---
if (!localStorage.getItem('rol')) {
  window.location.href = rootPad
}

// --- Dynamische sidebar ---
var sidebarConfig = {
  student: [
    { bestand: 'dashboard.html',      label: 'Dashboard' },
    { bestand: 'logboek.html',        label: 'Logboek' },
    { bestand: 'evaluatie.html',      label: 'Evaluatie' },
    { bestand: 'profiel.html',        label: 'Profiel' }
  ],
  docent: [
    { bestand: 'dashboard.html',      label: 'Dashboard' },
    { bestand: 'studenten.html',      label: 'Studenten' },
    { bestand: 'logboeken.html',      label: 'Logboeken' },
    { bestand: 'evaluatie.html',      label: 'Evaluatie' },
    { bestand: 'profiel.html',        label: 'Profiel' }
  ],
  stagementor: [
    { bestand: 'dashboard.html',      label: 'Dashboard' },
    { bestand: 'stagiairs.html',      label: 'Stagiairs' },
    { bestand: 'logboeken.html',      label: 'Logboeken' },
    { bestand: 'evaluatie.html',      label: 'Evaluatie' },
    { bestand: 'profiel.html',        label: 'Profiel' }
  ],
  stagecommissie: [
    { bestand: 'dashboard.html',      label: 'Dashboard' },
    { bestand: 'aanvragen.html',      label: 'Aanvragen' },
    { bestand: 'overeenkomsten.html', label: 'Overeenkomsten' },
    { bestand: 'profiel.html',        label: 'Profiel' }
  ],
  admin: [
    { bestand: 'dashboard.html',      label: 'Dashboard' },
    { bestand: 'studenten.html',      label: 'Student' },
    { bestand: 'docenten.html',       label: 'Docent' },
    { bestand: 'bedrijven.html',      label: 'Bedrijven' },
    { bestand: 'stages.html',         label: 'Stage' },
    { bestand: 'documenten.html',     label: 'Documenten' }
  ]
}

var logoutSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
  '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'

var sidebar = document.querySelector('nav.sidebar')
if (sidebar) {
  var rol = localStorage.getItem('rol')
  var dbRol = rol === 'mentor' ? 'stagementor' : rol === 'commissie' ? 'stagecommissie' : rol
  var links = sidebarConfig[dbRol]

  if (links) {
    var huidigePagina = window.location.pathname.split('/').pop() || 'dashboard.html'
    var html = ''

    for (var i = 0; i < links.length; i++) {
      var link = links[i]
      var actief = link.bestand === huidigePagina ? ' actief' : ''
      html += '<a href="' + link.bestand + '" class="nav-item' + actief + '">' + link.label + '</a>'
    }

    html += '<a href="../index.html" class="nav-item" id="uitlogBtn" style="margin-top:auto">' +
      logoutSVG + 'Uitloggen</a>'

    sidebar.innerHTML = html
  }
}

// --- Uitlog functionaliteit ---
var uitlogBtn = document.getElementById('uitlogBtn')
if (uitlogBtn) {
  uitlogBtn.addEventListener('click', function(e) {
    e.preventDefault()
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
