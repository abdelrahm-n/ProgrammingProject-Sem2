const DEMO = [
  { naam: 'Yasmine El Amrani',  email: 'yasmine@student.ehb.be',    rol: 'student',        actief: true  },
  { naam: 'Lars Vandenberghe',  email: 'lars@student.ehb.be',       rol: 'student',        actief: true  },
  { naam: 'Prof. De Smedt',     email: 'de.smedt@ehb.be',           rol: 'docent',         actief: true  },
  { naam: 'Commissie EhB',      email: 'commissie@ehb.be',          rol: 'stagecommissie', actief: true  },
  { naam: 'Jan Claes',          email: 'jan.claes@proximus.be',      rol: 'mentor',         actief: true  },
  { naam: 'Admin EhB',          email: 'admin@ehb.be',              rol: 'admin',          actief: true  },
  { naam: 'Fatima Nzinga',      email: 'fatima@student.ehb.be',     rol: 'student',        actief: false },
];

const ROL_BADGE = {
  student:        'badge--actief',
  docent:         'badge--info',
  stagecommissie: 'badge--waarschuwing',
  mentor:         'badge--mentor',
  admin:          'badge--gevaar',
};

export function render() {
  const rijen = DEMO.map((u, i) => `
    <tr>
      <td>${u.naam}</td>
      <td>${u.email}</td>
      <td><span class="badge ${ROL_BADGE[u.rol] ?? ''}">${u.rol}</span></td>
      <td>
        <span class="badge badge--${u.actief ? 'goedgekeurd' : 'afgekeurd'}">
          ${u.actief ? 'Actief' : 'Inactief'}
        </span>
      </td>
      <td>
        <button class="btn btn--xs btn--secundair" onclick="alert('Bewerken (demo) — ${u.naam}')">Bewerken</button>
        <button class="btn btn--xs btn--gevaar"    onclick="this.closest('tr').remove()">Verwijderen</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="view-header">
      <h1 class="view-titel">Gebruikersbeheer</h1>
      <p class="view-subtitel">Beheer alle gebruikers van het stageplatform.</p>
    </div>
    <div class="kaart">
      <div class="kaart-toolbar">
        <input class="zoek-input" type="search" placeholder="Zoeken op naam of e-mail…" id="zoekGebruikers" />
        <button class="btn btn--primair btn--sm">+ Gebruiker toevoegen</button>
      </div>
      <div class="tabel-wrapper">
        <table id="gebruikersTabel">
          <thead><tr><th>Naam</th><th>E-mail</th><th>Rol</th><th>Status</th><th>Acties</th></tr></thead>
          <tbody>${rijen}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function init() {
  document.getElementById('zoekGebruikers')?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#gebruikersTabel tbody tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
