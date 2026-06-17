import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Controleer of de ingelogde gebruiker een admin is */
function isAdmin(req, res, next) {
  if (req.gebruiker.rol !== 'admin') {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  next()
}

/* ============================================================
   GEBRUIKERS
   ============================================================ */

/* Haal alle personen op */
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

/* Bewerk een gebruiker */
router.put('/gebruikers/:id', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, email, rol, actief } = req.body

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
   DOCENTEN
   ============================================================ */

/* Haal alle docenten op */
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

/* Maak een nieuwe docent aan */
router.post('/docent-aanmaken', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, wachtwoord, vakgroep } = req.body

  if (!voornaam || !achternaam || !wachtwoord) {
    return res.status(400).json({ fout: 'Voornaam, achternaam en wachtwoord zijn verplicht' })
  }

  if (wachtwoord.length < 6) {
    return res.status(400).json({ fout: 'Wachtwoord moet minstens 6 tekens hebben' })
  }

  const schoneVoornaam = voornaam.toLowerCase().replace(/[^a-z]/g, '')
  const schoneAchternaam = achternaam.toLowerCase().replace(/[^a-z]/g, '')
  const email = schoneVoornaam + '.' + schoneAchternaam + '@docent.ehb.be'

  try {
    const [bestaand] = await db.query('SELECT id FROM persoon WHERE email = ?', [email])
    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik: ' + email })
    }

    const hash = await bcrypt.hash(wachtwoord, 10)

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES (?, ?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash, 'docent']
    )

    await db.query(
      'INSERT INTO docent (persoon_id, vakgroep) VALUES (?, ?)',
      [resultaat.insertId, vakgroep || null]
    )

    res.status(201).json({ bericht: 'Docent aangemaakt', email })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   STUDENTEN
   ============================================================ */

/* Haal alle studenten op met stage-informatie */
router.get('/studenten', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, p.actief,
              st.studentnummer, o.naam AS opleiding,
              sv.id AS voorstel_id, sv.functie,
              b.naam AS bedrijf_naam,
              dp.voornaam AS docent_voornaam, dp.achternaam AS docent_achternaam,
              svs.naam AS status_stage
       FROM persoon p
       JOIN student st ON p.id = st.persoon_id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       LEFT JOIN stagevoorstel sv ON sv.student_id = p.id AND sv.status_id = (SELECT id FROM stagevoorstel_status WHERE naam = 'goedgekeurd')
       LEFT JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN stage s ON s.student_id = p.id
       LEFT JOIN docent d ON s.docent_id = d.persoon_id
       LEFT JOIN persoon dp ON d.persoon_id = dp.id
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

/* Maak een nieuwe student aan */
router.post('/student-aanmaken', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, wachtwoord, studentnummer, opleiding_id } = req.body

  if (!voornaam || !achternaam || !wachtwoord || !studentnummer) {
    return res.status(400).json({ fout: 'Voornaam, achternaam, wachtwoord en studentnummer zijn verplicht' })
  }

  if (wachtwoord.length < 6) {
    return res.status(400).json({ fout: 'Wachtwoord moet minstens 6 tekens hebben' })
  }

  const schoneVoornaam = voornaam.toLowerCase().replace(/[^a-z]/g, '')
  const schoneAchternaam = achternaam.toLowerCase().replace(/[^a-z]/g, '')
  const email = schoneVoornaam + '.' + schoneAchternaam + '@student.ehb.be'

  try {
    const [bestaand] = await db.query('SELECT id FROM persoon WHERE email = ?', [email])
    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik: ' + email })
    }

    const hash = await bcrypt.hash(wachtwoord, 10)

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES (?, ?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash, 'student']
    )

    await db.query(
      'INSERT INTO student (persoon_id, studentnummer, opleiding_id) VALUES (?, ?, ?)',
      [resultaat.insertId, studentnummer, opleiding_id || 1]
    )

    res.status(201).json({ bericht: 'Student aangemaakt', email })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   BEDRIJVEN
   ============================================================ */

/* Haal alle bedrijven op */
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

/* Maak een nieuw bedrijf aan */
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

/* Bewerk een bedrijf */
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

/* Haal alle stagementoren op */
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

/* Maak een stagementor aan */
router.post('/mentor-aanmaken', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, wachtwoord, functie, bedrijf_id } = req.body

  if (!voornaam || !achternaam || !wachtwoord) {
    return res.status(400).json({ fout: 'Voornaam, achternaam en wachtwoord zijn verplicht' })
  }

  if (wachtwoord.length < 6) {
    return res.status(400).json({ fout: 'Wachtwoord moet minstens 6 tekens hebben' })
  }

  const schoneVoornaam = voornaam.toLowerCase().replace(/[^a-z]/g, '')
  const schoneAchternaam = achternaam.toLowerCase().replace(/[^a-z]/g, '')
  const email = schoneVoornaam + '.' + schoneAchternaam + '@mentor.ehb.be'

  try {
    const [bestaand] = await db.query('SELECT id FROM persoon WHERE email = ?', [email])
    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik: ' + email })
    }

    const hash = await bcrypt.hash(wachtwoord, 10)

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES (?, ?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash, 'stagementor']
    )

    await db.query(
      'INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, ?, ?)',
      [resultaat.insertId, functie || null, bedrijf_id || null]
    )

    res.status(201).json({ bericht: 'Stagementor aangemaakt', email })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Bewerk een mentor */
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
   STAGES
   ============================================================ */

/* Overzicht van alle actieve stages */
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

/* Haal alle stagevoorstellen op */
router.get('/stagevoorstellen', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT sv.id, sv.startdatum, sv.einddatum, sv.functie, sv.aangemaakt_op,
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
   STAGEOVEREENKOMSTEN
   ============================================================ */

/* Haal alle stageovereenkomsten op */
router.get('/stageovereenkomsten', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT so.id, so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              os.naam AS status, so.gevalideerd_op,
              p.voornaam, p.achternaam,
              b.naam AS bedrijf_naam
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

/* Valideer een ondertekende stageovereenkomst */
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

    res.json({ bericht: 'Overeenkomst gevalideerd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ============================================================
   DOCUMENTEN
   ============================================================ */

/* Haal alle documenten op */
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

export default router
