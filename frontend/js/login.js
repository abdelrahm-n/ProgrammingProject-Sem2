(function () {
  const wrapper     = document.getElementById('rolDropdownWrapper')
  const btn         = document.getElementById('rolDropdownBtn')
  const menu        = document.getElementById('rolDropdownMenu')
  const rolLabel    = document.getElementById('rolLabel')
  const rolHidden   = document.getElementById('rolHidden')
  const rolDisplay  = document.getElementById('rolDisplay')
  const rolDispText = document.getElementById('rolDisplayText')
  const form        = document.getElementById('loginForm')
  const foutEl      = document.getElementById('foutmelding')
  const togglePw    = document.getElementById('togglePw')
  const pwInput     = document.getElementById('wachtwoord')

  const rolLabels = {
    student:        'Student',
    docent:         'Docent',
    stagecommissie: 'Stagecommissie',
    mentor:         'Stagementor',
    admin:          'Admin',
  }

  /* ── Dropdown openen/sluiten ── */
  btn.addEventListener('click', function (e) {
    e.stopPropagation()
    wrapper.classList.toggle('open')
  })

  document.addEventListener('click', function () {
    wrapper.classList.remove('open')
  })

  menu.addEventListener('click', function (e) {
    const li = e.target.closest('li[data-rol]')
    if (!li) return

    const gekozenRol = li.dataset.rol

    menu.querySelectorAll('li').forEach(function (el) { el.classList.remove('selected') })
    li.classList.add('selected')

    rolLabel.textContent   = rolLabels[gekozenRol]
    rolHidden.value        = gekozenRol
    rolDispText.textContent = rolLabels[gekozenRol]
    rolDisplay.classList.add('rol-geselecteerd')

    wrapper.classList.remove('open')
    foutEl.textContent = ''
  })

  /* ── Wachtwoord tonen / verbergen ── */
  togglePw.addEventListener('click', function () {
    const zichtbaar = pwInput.type === 'text'
    pwInput.type = zichtbaar ? 'password' : 'text'
    togglePw.setAttribute('aria-label', zichtbaar ? 'Wachtwoord tonen' : 'Wachtwoord verbergen')
  })

  /* ── Formulier indienen ── */
  form.addEventListener('submit', async function (e) {
    e.preventDefault()
    foutEl.textContent = ''

    const rol       = rolHidden.value
    const email     = document.getElementById('email').value.trim()
    const wachtwoord = pwInput.value

    if (!rol) {
      foutEl.textContent = 'Kies eerst je rol via de knop rechtsboven.'
      return
    }
    if (!email) {
      foutEl.textContent = 'Vul je e-mailadres in.'
      return
    }
    if (!wachtwoord) {
      foutEl.textContent = 'Vul je wachtwoord in.'
      return
    }

    const btnLogin = document.getElementById('btnLogin')
    btnLogin.disabled = true
    btnLogin.textContent = 'Bezig…'

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, wachtwoord, rol }),
      })
      const data = await res.json()

      if (!res.ok) {
        foutEl.textContent = data.fout || 'Inloggen mislukt. Controleer je gegevens.'
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('rol',   data.rol)

      const dashboards = {
        student:        '/pages/student/dashboard.html',
        docent:         '/pages/docent/dashboard.html',
        stagecommissie: '/pages/stagecommissie/dashboard.html',
        mentor:         '/pages/mentor/dashboard.html',
        admin:          '/pages/admin/dashboard.html',
      }

      window.location.href = dashboards[data.rol] || '/login.html'

    } catch (_err) {
      foutEl.textContent = 'Kan de server niet bereiken. Probeer opnieuw.'
    } finally {
      btnLogin.disabled = false
      btnLogin.textContent = 'Inloggen'
    }
  })
})()
