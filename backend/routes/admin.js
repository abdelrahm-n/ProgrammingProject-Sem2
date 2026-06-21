import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

function isAdmin(req, res, next) {
  if (req.gebruiker.rol !== 'admin') {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  next()
}

/* Hulpfunctie: stuur een notificatie + log een "e-mail" */
async function stuurNotificatie(ontvangerId, titel, boodschap) {
  try {
    await db.query(
      'INSERT INTO notificatie (ontvanger_id, titel, boodschap) VALUES (?, ?, ?)',
      [ontvangerId, titel, boodschap]
    )
    console.log(`[EMAIL] Aan gebruiker ${ontvangerId}: ${titel} - ${boodschap}`)
  } catch (err) {
    console.error('Notificatie mislukt:', err)
  }
}

/* Hulpfunctie: haal gebruiker op via id */
async function haalGebruikerOp(id) {
  const [rijen] = await db.query('SELECT id, voornaam, achternaam, email, rol FROM persoon WHERE id = ?', [id])
  return rijen.length > 0 ? rijen[0] : null
}

/* ============================================================
   GEBRUIKERS - Overzicht
   ============================================================ */

router.get('/gebruikers', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, rol, actief FROM persoon ORDER BY achternaam'
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   GEBRUIKERS - Account aanmaken (alle rollen)
   ============================================================ */

router.post('/gebruiker-aanmaken', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, wachtwoord, rol, extra } = req.body

  if (!voornaam || !achternaam || !wachtwoord || !rol) {
    return res.status(400).json({ fout: 'Voornaam, achternaam, wachtwoord en rol zijn verplicht' })
  }

  if (wachtwoord.length < 6) {
    return res.status(400).json({ fout: 'Wachtwoord moet minstens 6 tekens hebben' })
  }

  const geldigeRollen = ['student', 'docent', 'stagementor', 'stagecommissie', 'admin']
  if (!geldigeRollen.includes(rol)) {
    return res.status(400).json({ fout: 'Ongeldige rol' })
  }

  const domeinen = {
    student: 'student.ehb.be',
    docent: 'docent.ehb.be',
    stagementor: 'mentor.ehb.be',
    stagecommissie: 'commissie.ehb.be',
    admin: 'admin.ehb.be'
  }

  const schoneVoornaam = voornaam.toLowerCase().replace(/[^a-z]/g, '')
  const schoneAchternaam = achternaam.toLowerCase().replace(/[^a-z]/g, '')
  const email = schoneVoornaam + '.' + schoneAchternaam + '@' + domeinen[rol]

  try {
    const [bestaand] = await db.query('SELECT id FROM persoon WHERE email = ?', [email])
    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik: ' + email })
    }

    const hash = await bcrypt.hash(wachtwoord, 10)

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES (?, ?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash, rol]
    )

    const nieuweGebruikerId = resultaat.insertId

    if (rol === 'student') {
      await db.query(
        'INSERT INTO student (persoon_id, studentnummer, opleiding_id) VALUES (?, ?, ?)',
        [nieuweGebruikerId, extra?.studentnummer || null, extra?.opleiding_id || 1]
      )
    } else if (rol === 'docent') {
      await db.query(
        'INSERT INTO docent (persoon_id, vakgroep) VALUES (?, ?)',
        [nieuweGebruikerId, extra?.vakgroep || null]
      )
    } else if (rol === 'stagementor') {
      await db.query(
        'INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, ?, ?)',
        [nieuweGebruikerId, extra?.functie || null, extra?.bedrijf_id || null]
      )
    } else if (rol === 'stagecommissie') {
      await db.query(
        'INSERT INTO stagecommissielid (persoon_id, commissie_rol) VALUES (?, ?)',
        [nieuweGebruikerId, extra?.commissie_rol || null]
      )
    } else if (rol === 'admin') {
      await db.query(
        'INSERT INTO administratie (persoon_id, dienst) VALUES (?, ?)',
        [nieuweGebruikerId, extra?.dienst || null]
      )
    }

    res.status(201).json({ bericht: 'Account aangemaakt', email, id: nieuweGebruikerId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   GEBRUIKERS - Bewerken
   ============================================================ */

router.put('/gebruikers/:id', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, email, actief } = req.body

  try {
    await db.query(
      'UPDATE persoon SET voornaam = ?, achternaam = ?, email = ?, actief = ? WHERE id = ?',
      [voornaam, achternaam, email, actief ? 1 : 0, req.params.id]
    )
    res.json({ bericht: 'Gebruiker bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   GEBRUIKERS - Rol wijzigen
   ============================================================ */

router.put('/gebruikers/:id/rol', controleerToken, isAdmin, async (req, res) => {
  const { nieuweRol } = req.body
  const gebruikerId = req.params.id

  const geldigeRollen = ['student', 'docent', 'stagementor', 'stagecommissie', 'admin']
  if (!geldigeRollen.includes(nieuweRol)) {
    return res.status(400).json({ fout: 'Ongeldige rol' })
  }

  try {
    const gebruiker = await haalGebruikerOp(gebruikerId)
    if (!gebruiker) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    const oudeRol = gebruiker.rol
    if (oudeRol === nieuweRol) {
      return res.status(400).json({ fout: 'Gebruiker heeft al deze rol' })
    }

    /* Verwijder uit huidige role-tabel (ignoreren als FK constraints falen) */
    if (oudeRol === 'student') {
      await db.query('DELETE FROM student WHERE persoon_id = ?', [gebruikerId]).catch(() => {})
    } else if (oudeRol === 'docent') {
      await db.query('DELETE FROM docent WHERE persoon_id = ?', [gebruikerId]).catch(() => {})
    } else if (oudeRol === 'stagementor') {
      await db.query('DELETE FROM stagementor WHERE persoon_id = ?', [gebruikerId]).catch(() => {})
    } else if (oudeRol === 'stagecommissie') {
      await db.query('DELETE FROM stagecommissielid WHERE persoon_id = ?', [gebruikerId]).catch(() => {})
    } else if (oudeRol === 'admin') {
      await db.query('DELETE FROM administratie WHERE persoon_id = ?', [gebruikerId]).catch(() => {})
    }

    /* Update de rol in persoon */
    await db.query('UPDATE persoon SET rol = ? WHERE id = ?', [nieuweRol, gebruikerId])

    /* Voeg toe aan nieuwe role-tabel (IGNORE als al bestaat) */
    if (nieuweRol === 'student') {
      await db.query('INSERT IGNORE INTO student (persoon_id, studentnummer, opleiding_id) VALUES (?, ?, ?)', [gebruikerId, null, 1])
    } else if (nieuweRol === 'docent') {
      await db.query('INSERT IGNORE INTO docent (persoon_id, vakgroep) VALUES (?, ?)', [gebruikerId, null])
    } else if (nieuweRol === 'stagementor') {
      await db.query('INSERT IGNORE INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, ?, ?)', [gebruikerId, null, null])
    } else if (nieuweRol === 'stagecommissie') {
      await db.query('INSERT IGNORE INTO stagecommissielid (persoon_id, commissie_rol) VALUES (?, ?)', [gebruikerId, null])
    } else if (nieuweRol === 'admin') {
      await db.query('INSERT IGNORE INTO administratie (persoon_id, dienst) VALUES (?, ?)', [gebruikerId, null])
    }

    /* Stuur notificatie naar de gebruiker */
    const rolLabels = { student: 'Student', docent: 'Docent', stagementor: 'Stagementor', stagecommissie: 'Stagecommissie', admin: 'Administratie' }
    await stuurNotificatie(
      gebruikerId,
      'Rol gewijzigd',
      `Je rol is gewijzigd van ${rolLabels[oudeRol]} naar ${rolLabels[nieuweRol]}.`
    )

    res.json({ bericht: 'Rol gewijzigd van ' + oudeRol + ' naar ' + nieuweRol })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   GEBRUIKERS - Wachtwoord wijzigen
   ============================================================ */

router.put('/gebruikers/:id/wachtwoord', controleerToken, isAdmin, async (req, res) => {
  const { nieuwWachtwoord } = req.body

  if (!nieuwWachtwoord || nieuwWachtwoord.length < 6) {
    return res.status(400).json({ fout: 'Wachtwoord moet minstens 6 tekens hebben' })
  }

  try {
    const gebruiker = await haalGebruikerOp(req.params.id)
    if (!gebruiker) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    const hash = await bcrypt.hash(nieuwWachtwoord, 10)
    await db.query('UPDATE persoon SET wachtwoord_hash = ? WHERE id = ?', [hash, req.params.id])

    await stuurNotificatie(
      req.params.id,
      'Wachtwoord gewijzigd',
      'Je wachtwoord is gewijzigd door de administrator.'
    )

    res.json({ bericht: 'Wachtwoord gewijzigd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   GEBRUIKERS - Account verwijderen (soft delete)
   ============================================================ */

router.delete('/gebruikers/:id', controleerToken, isAdmin, async (req, res) => {
  try {
    const gebruiker = await haalGebruikerOp(req.params.id)
    if (!gebruiker) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    if (gebruiker.rol === 'admin') {
      const [admins] = await db.query("SELECT COUNT(*) AS aantal FROM persoon WHERE rol = 'admin' AND actief = TRUE")
      if (admins[0].aantal <= 1) {
        return res.status(400).json({ fout: 'Kan de laatste admin niet verwijderen' })
      }
    }

    await db.query('UPDATE persoon SET actief = FALSE WHERE id = ?', [req.params.id])

    res.json({ bericht: 'Account gedeactiveerd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   DOCENTEN
   ============================================================ */

router.get('/docenten', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, p.actief, d.vakgroep
       FROM persoon p
       JOIN docent d ON p.id = d.persoon_id
       ORDER BY p.achternaam`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

router.put('/docenten/:id', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, email, actief, vakgroep } = req.body

  try {
    await db.query(
      'UPDATE persoon SET voornaam = ?, achternaam = ?, email = ?, actief = ? WHERE id = ?',
      [voornaam, achternaam, email, actief ? 1 : 0, req.params.id]
    )
    await db.query(
      'UPDATE docent SET vakgroep = ? WHERE persoon_id = ?',
      [vakgroep || null, req.params.id]
    )
    res.json({ bericht: 'Docent bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   STUDENTEN
   ============================================================ */

router.get('/studenten', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, p.actief,
              st.studentnummer, o.naam AS opleiding,
              sv.id AS voorstel_id, sv.functie,
              b.naam AS bedrijf_naam,
              dp.voornaam AS docent_voornaam, dp.achternaam AS docent_achternaam,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam,
              svs.naam AS status_stage
       FROM persoon p
       JOIN student st ON p.id = st.persoon_id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       LEFT JOIN stagevoorstel sv ON sv.student_id = p.id AND sv.status_id = (SELECT id FROM stagevoorstel_status WHERE naam = 'goedgekeurd')
       LEFT JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN stage s ON s.student_id = p.id
       LEFT JOIN docent d ON s.docent_id = d.persoon_id
       LEFT JOIN persoon dp ON d.persoon_id = dp.id
       LEFT JOIN stagementor sm ON s.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       LEFT JOIN stagevoorstel_status svs ON sv.status_id = svs.id
       WHERE p.rol = 'student'
       ORDER BY p.achternaam`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   BEDRIJVEN
   ============================================================ */

router.get('/bedrijven', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT b.id, b.naam, b.adres, b.email, b.telefoon, b.contactpersoon, b.actief,
              COUNT(sm.persoon_id) AS aantal_mentoren
       FROM bedrijf b
       LEFT JOIN stagementor sm ON b.id = sm.bedrijf_id
       GROUP BY b.id
       ORDER BY b.naam`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

router.post('/bedrijven', controleerToken, isAdmin, async (req, res) => {
  const { naam, adres, email, telefoon, contactpersoon } = req.body

  if (!naam) {
    return res.status(400).json({ fout: 'Bedrijfsnaam is verplicht' })
  }

  try {
    const [bestaand] = await db.query('SELECT id FROM bedrijf WHERE naam = ?', [naam])
    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit bedrijf bestaat al' })
    }

    const [resultaat] = await db.query(
      'INSERT INTO bedrijf (naam, adres, email, telefoon, contactpersoon, actief) VALUES (?, ?, ?, ?, ?, TRUE)',
      [naam, adres || null, email || null, telefoon || null, contactpersoon || null]
    )

    res.status(201).json({ bericht: 'Bedrijf aangemaakt', id: resultaat.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

router.put('/bedrijven/:id', controleerToken, isAdmin, async (req, res) => {
  const { naam, adres, email, telefoon, contactpersoon, actief } = req.body

  try {
    await db.query(
      'UPDATE bedrijf SET naam = ?, adres = ?, email = ?, telefoon = ?, contactpersoon = ?, actief = ? WHERE id = ?',
      [naam, adres || null, email || null, telefoon || null, contactpersoon || null, actief ? 1 : 0, req.params.id]
    )
    res.json({ bericht: 'Bedrijf bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   MENTOREN
   ============================================================ */

router.get('/mentoren', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, p.actief, sm.functie,
              b.naam AS bedrijf_naam, b.id AS bedrijf_id
       FROM persoon p
       JOIN stagementor sm ON p.id = sm.persoon_id
       LEFT JOIN bedrijf b ON sm.bedrijf_id = b.id
       ORDER BY p.achternaam`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

router.put('/mentoren/:id', controleerToken, isAdmin, async (req, res) => {
  const { functie, bedrijf_id } = req.body

  try {
    await db.query(
      'UPDATE stagementor SET functie = ?, bedrijf_id = ? WHERE persoon_id = ?',
      [functie || null, bedrijf_id || null, req.params.id]
    )
    res.json({ bericht: 'Mentor bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   STAGES - Overzicht
   ============================================================ */

router.get('/stages/overzicht', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT s.id, s.startdatum, s.einddatum, s.actief,
              p.voornaam, p.achternaam, st.studentnummer,
              b.naam AS bedrijf_naam,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam,
              dp.voornaam AS docent_voornaam, dp.achternaam AS docent_achternaam
       FROM stage s
       JOIN student st ON s.student_id = st.persoon_id
       JOIN persoon p ON st.persoon_id = p.id
       JOIN bedrijf b ON s.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON s.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       LEFT JOIN docent d ON s.docent_id = d.persoon_id
       LEFT JOIN persoon dp ON d.persoon_id = dp.id
       ORDER BY s.aangemaakt_op DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Statistieken voor dashboard */
router.get('/statistieken', controleerToken, isAdmin, async (req, res) => {
  try {
    const [studenten] = await db.query("SELECT COUNT(*) AS aantal FROM persoon WHERE rol = 'student' AND actief = TRUE")
    const [docenten] = await db.query("SELECT COUNT(*) AS aantal FROM persoon WHERE rol = 'docent' AND actief = TRUE")
    const [mentoren] = await db.query("SELECT COUNT(*) AS aantal FROM persoon WHERE rol = 'stagementor' AND actief = TRUE")
    const [stages] = await db.query('SELECT COUNT(*) AS aantal FROM stage WHERE actief = TRUE')
    const [voorstellen] = await db.query("SELECT COUNT(*) AS aantal FROM stagevoorstel WHERE status_id = (SELECT id FROM stagevoorstel_status WHERE naam = 'ingediend')")
    const [overeenkomsten] = await db.query("SELECT COUNT(*) AS aantal FROM stageovereenkomst WHERE status_id = (SELECT id FROM overeenkomst_status WHERE naam = 'wacht_op_handtekeningen')")

    res.json({
      studenten: studenten[0].aantal,
      docenten: docenten[0].aantal,
      mentoren: mentoren[0].aantal,
      actieve_stages: stages[0].aantal,
      wachtende_voorstellen: voorstellen[0].aantal,
      wachtende_overeenkomsten: overeenkomsten[0].aantal
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   STAGEVOORSTELLEN
   ============================================================ */

router.get('/stagevoorstellen', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT sv.id, sv.startdatum, sv.einddatum, sv.functie, sv.aangemaakt_op,
              sv.student_id, sv.mentor_id, sv.bedrijf_id,
              p.voornaam, p.achternaam,
              b.naam AS bedrijf_naam,
              svs.naam AS status,
              cb.feedback AS commissie_feedback
       FROM stagevoorstel sv
       JOIN persoon p ON sv.student_id = p.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       JOIN stagevoorstel_status svs ON sv.status_id = svs.id
       LEFT JOIN commissie_beoordeling cb ON cb.stagevoorstel_id = sv.id
       ORDER BY sv.aangemaakt_op DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   STAGEVOORSTEL - Koppel mentor en docent
   ============================================================ */

router.put('/stagevoorstellen/:id/koppel', controleerToken, isAdmin, async (req, res) => {
  const { mentor_id, docent_id } = req.body
  const voorstelId = req.params.id

  try {
    const [voorstel] = await db.query('SELECT * FROM stagevoorstel WHERE id = ?', [voorstelId])
    if (voorstel.length === 0) {
      return res.status(404).json({ fout: 'Voorstel niet gevonden' })
    }

    if (mentor_id) {
      await db.query('UPDATE stagevoorstel SET mentor_id = ? WHERE id = ?', [mentor_id, voorstelId])

      /* FIX: ook stage-record bijwerken als het bestaat */
      const [bestaandeStageMentor] = await db.query(
        `SELECT s.id FROM stage s
         JOIN stageovereenkomst so ON s.stageovereenkomst_id = so.id
         WHERE so.stagevoorstel_id = ?`,
        [voorstelId]
      )
      if (bestaandeStageMentor.length > 0) {
        await db.query('UPDATE stage SET mentor_id = ? WHERE id = ?', [mentor_id, bestaandeStageMentor[0].id])
      }
    }

    const studentId = voorstel[0].student_id

    if (docent_id) {
      /* Zoek of er al een stage is voor dit voorstel */
      const [bestaandeStage] = await db.query(
        `SELECT s.id FROM stage s
         JOIN stageovereenkomst so ON s.stageovereenkomst_id = so.id
         WHERE so.stagevoorstel_id = ?`,
        [voorstelId]
      )

      if (bestaandeStage.length > 0) {
        await db.query('UPDATE stage SET docent_id = ?, mentor_id = ? WHERE id = ?', [docent_id, mentor_id || voorstel[0].mentor_id, bestaandeStage[0].id])
      }
    }

    /* Haal namen op voor notificatie */
    const student = await haalGebruikerOp(studentId)
    let mentorNaam = '-'
    let docentNaam = '-'

    if (mentor_id) {
      const mentor = await haalGebruikerOp(mentor_id)
      if (mentor) mentorNaam = mentor.voornaam + ' ' + mentor.achternaam
    }
    if (docent_id) {
      const docent = await haalGebruikerOp(docent_id)
      if (docent) docentNaam = docent.voornaam + ' ' + docent.achternaam
    }

    /* Stuur notificatie naar de student */
    if (student) {
      await stuurNotificatie(
        studentId,
        'Stage toegewezen',
        `Je stagevoorstel is toegewezen. Mentor: ${mentorNaam}, Docent: ${docentNaam}.`
      )
    }

    /* Stuur notificatie naar de mentor */
    if (mentor_id) {
      await stuurNotificatie(
        mentor_id,
        'Nieuwe stagiair toegewezen',
        `Je hebt een nieuwe stagiair toegewezen gekregen: ${student ? student.voornaam + ' ' + student.achternaam : 'Onbekend'}.`
      )
    }

    /* Stuur notificatie naar de docent */
    if (docent_id) {
      await stuurNotificatie(
        docent_id,
        'Nieuwe student toegewezen',
        `Je hebt een nieuwe student toegewezen gekregen: ${student ? student.voornaam + ' ' + student.achternaam : 'Onbekend'}.`
      )
    }

    res.json({ bericht: 'Mentor en docent gekoppeld' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   STAGEOVEREENKOMSTEN
   ============================================================ */

router.get('/stageovereenkomsten', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT so.id, so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              os.naam AS status, so.gevalideerd_op,
              p.voornaam, p.achternaam,
              b.naam AS bedrijf_naam,
              sv.functie
       FROM stageovereenkomst so
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN student s ON sv.student_id = s.persoon_id
       JOIN persoon p ON s.persoon_id = p.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       ORDER BY so.aangemaakt_op DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

router.put('/stageovereenkomsten/:id/valideer', controleerToken, isAdmin, async (req, res) => {
  try {
    const [overeenkomst] = await db.query(
      'SELECT * FROM stageovereenkomst WHERE id = ?',
      [req.params.id]
    )

    if (overeenkomst.length === 0) {
      return res.status(404).json({ fout: 'Overeenkomst niet gevonden' })
    }

    const ow = overeenkomst[0]

    if (!ow.getekend_door_student || !ow.getekend_door_bedrijf || !ow.getekend_door_school) {
      return res.status(400).json({ fout: 'Niet alle partijen hebben ondertekend' })
    }

    await db.query(
      `UPDATE stageovereenkomst
       SET status_id = (SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'),
           gevalideerd_door_id = ?,
           gevalideerd_op = NOW()
       WHERE id = ?`,
      [req.gebruiker.id, req.params.id]
    )

    /* Maak stage record aan als het nog niet bestaat */
    const [bestaandeStage] = await db.query(
      'SELECT id FROM stage WHERE stageovereenkomst_id = ?',
      [ow.id]
    )

    if (bestaandeStage.length === 0) {
      const [sv] = await db.query(
        'SELECT student_id, bedrijf_id, mentor_id, startdatum, einddatum FROM stagevoorstel WHERE id = ?',
        [ow.stagevoorstel_id]
      )

      if (sv.length > 0) {
        const s = sv[0]
        const [docent] = await db.query('SELECT persoon_id FROM docent LIMIT 1')
        const docentId = docent.length > 0 ? docent[0].persoon_id : null

        await db.query(
          `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [ow.id, s.student_id, s.bedrijf_id, s.mentor_id, docentId, s.startdatum, s.einddatum]
        )
      }
    }

    /* Haal student op voor notificatie */
    const [sv] = await db.query(
      `SELECT sv.student_id FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       WHERE so.id = ?`,
      [req.params.id]
    )

    if (sv.length > 0) {
      await stuurNotificatie(
        sv[0].student_id,
        'Stageovereenkomst gevalideerd',
        'Je stageovereenkomst is gevalideerd door de administratie. Je stage is nu actief.'
      )
    }

    res.json({ bericht: 'Overeenkomst gevalideerd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   DOCUMENTEN
   ============================================================ */

router.get('/documenten', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT d.id, d.type, d.bestandsnaam, d.bestand_url, d.geupload_op,
              p.voornaam, p.achternaam
       FROM document d
       JOIN persoon p ON d.uploader_id = p.id
       ORDER BY d.geupload_op DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   OPLEIDINGEN (voor dropdowns)
   ============================================================ */

router.get('/opleidingen', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query('SELECT id, naam, afkorting FROM opleiding WHERE actief = TRUE ORDER BY naam')
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   ACADEMIEJAREN (voor dropdowns)
   ============================================================ */

router.get('/academiejaren', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query('SELECT id, naam FROM academiejaar WHERE actief = TRUE ORDER BY naam DESC')
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
