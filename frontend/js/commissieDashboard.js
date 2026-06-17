const API_URL = 'http://localhost:3000';
const token = localStorage.getItem('token');
if (!token) window.location.href = '../index.html';

async function laadOverzicht() {
  const container = document.getElementById('commissieOverzicht');
  const statsContainer = document.getElementById('commissieStats');

  try {
    const resp = await fetch(API_URL + '/api/stages/overzicht', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resp.status === 401) { window.location.href = '../index.html'; return; }
    const data = await resp.json();

    if (!data || data.length === 0) {
      container.innerHTML = '<p>Geen stageaanvragen gevonden.</p>';
      return;
    }

    var ingediend = 0, goedgekeurd = 0, afgekeurd = 0, wachtHandtekeningen = 0, alleGetekend = 0;

    data.forEach(function(r) {
      if (r.voorstel_status === 'ingediend') ingediend++;
      else if (r.voorstel_status === 'goedgekeurd') goedgekeurd++;
      else if (r.voorstel_status === 'afgekeurd') afgekeurd++;

      if (r.overeenkomst_status === 'wacht_op_handtekeningen') wachtHandtekeningen++;
      else if (r.overeenkomst_status === 'volledig_getekend' || r.overeenkomst_status === 'gevalideerd') alleGetekend++;
    });

    statsContainer.innerHTML =
      '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-getal">' + data.length + '</div><div class="stat-label">Totaal</div></div>' +
      '<div class="stat-card"><div class="stat-getal">' + ingediend + '</div><div class="stat-label">Nieuw ingediend</div></div>' +
      '<div class="stat-card"><div class="stat-getal">' + goedgekeurd + '</div><div class="stat-label">Goedgekeurd</div></div>' +
      '<div class="stat-card"><div class="stat-getal">' + wachtHandtekeningen + '</div><div class="stat-label">Wacht handtekeningen</div></div>' +
      '<div class="stat-card"><div class="stat-getal">' + alleGetekend + '</div><div class="stat-label">Alle handtekeningen</div></div>' +
      '</div>';

    var html = '<table><thead><tr>';
    html += '<th>Student</th><th>Bedrijf</th><th>Periode</th><th>Voorstel</th><th>Overeenkomst</th><th>Actie</th>';
    html += '</tr></thead><tbody>';

    data.forEach(function(r) {
      var naam = r.student_voornaam + ' ' + r.student_achternaam;
      var periode = '';
      if (r.startdatum && r.einddatum) {
        periode = new Date(r.startdatum).toLocaleDateString('nl-BE') + ' - ' + new Date(r.einddatum).toLocaleDateString('nl-BE');
      }

      var voorstelBadge = '';
      if (r.voorstel_status === 'ingediend') voorstelBadge = '<span class="badge badge--ingediend">Ingediend</span>';
      else if (r.voorstel_status === 'goedgekeurd') voorstelBadge = '<span class="badge badge--goedgekeurd">Goedgekeurd</span>';
      else if (r.voorstel_status === 'afgekeurd') voorstelBadge = '<span class="badge badge--afgekeurd">Afgekeurd</span>';
      else if (r.voorstel_status === 'aanpassing_vereist') voorstelBadge = '<span class="badge badge--waarschuwing">Aanpassing</span>';
      else voorstelBadge = '<span class="badge">' + r.voorstel_status + '</span>';

      var overeenkomstInfo = '-';
      var actieLink = '';

      if (r.overeenkomst_id) {
        var osBadge = '';
        if (r.overeenkomst_status === 'wacht_op_handtekeningen') osBadge = '<span class="badge badge--ingediend">Wachtend</span>';
        else if (r.overeenkomst_status === 'volledig_getekend') osBadge = '<span class="badge badge--goedgekeurd">Getekend</span>';
        else if (r.overeenkomst_status === 'gevalideerd') osBadge = '<span class="badge badge--actief">Gevalideerd</span>';
        else osBadge = '<span class="badge">' + r.overeenkomst_status + '</span>';

        overeenkomstInfo = osBadge;

        actieLink = '<a href="stageovereenkomst.html?id=' + r.overeenkomst_id + '" class="btn btn--primair btn--sm">Bekijk</a>';
      } else {
        if (r.voorstel_status === 'ingediend') {
          actieLink = '<a href="aanvragen.html?sv_id=' + r.stagevoorstel_id + '" class="btn btn--primair btn--sm">Bekijk</a>';
        } else if (r.voorstel_status === 'goedgekeurd') {
          actieLink = '<span class="text-muted">Wacht op ondertekening</span>';
        }
      }

      html += '<tr>';
      html += '<td><strong>' + naam + '</strong><br><small>' + (r.studentnummer || '') + '</small></td>';
      html += '<td>' + (r.bedrijf_naam || '-') + '</td>';
      html += '<td>' + periode + '</td>';
      html += '<td>' + voorstelBadge + '</td>';
      html += '<td>' + overeenkomstInfo + '</td>';
      html += '<td>' + actieLink + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Fout bij laden van overzicht.</p>';
  }
}

laadOverzicht();
