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

/* ========== GEBRUIKERS ========== */

/* GET /api/admin/gebruikers - haal alle personen op */
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

/* GET /api/admin/gebruikers/:id - haal een specifieke gebruiker op */
router.get('/gebruikers/:id', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, rol, actief FROM persoon WHERE id = ?',
      [req.params.id]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    res.json(rijen[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/admin/gebruikers/:id - pas een gebruiker aan */
router.put('/gebruikers/:id', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, email, actief } = req.body

  try {
    const [result] = await db.query(
      'UPDATE persoon SET voornaam = ?, achternaam = ?, email = ?, actief = ? WHERE id = ?',
      [voornaam, achternaam, email, actief !== false, req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    res.json({ bericht: 'Gebruiker bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* DELETE /api/admin/gebruikers/:id - deactiveer een gebruiker */
router.delete('/gebruikers/:id', controleerToken, isAdmin, async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE persoon SET actief = FALSE WHERE id = ?',
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    res.json({ bericht: 'Gebruiker gedeactiveerd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ========== MENTOREN ========== */

/* GET /api/admin/mentoren - haal alle stagementoren op */
router.get('/mentoren', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, p.actief, sm.functie, b.naam AS bedrijf_naam
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

/* POST /api/admin/mentor-aanmaken - admin maakt een stagementor account aan */
router.post('/mentor-aanmaken', controleerToken, isAdmin, async (req, res) => {
  const { voornaam, achternaam, wachtwoord, functie } = req.body

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
    const [bestaand] = await db.query(
      'SELECT id FROM persoon WHERE email = ?',
      [email]
    )

    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik: ' + email })
    }

    const hash = await bcrypt.hash(wachtwoord, 10)

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES (?, ?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash, 'stagementor']
    )

    await db.query(
      'INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, ?, NULL)',
      [resultaat.insertId, functie || null]
    )

    res.status(201).json({ bericht: 'Stagementor aangemaakt', email })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ========== STAGES OVERZICHT ========== */

/* GET /api/admin/stages - haal alle stages op */
router.get('/stages', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT s.id, s.startdatum, s.einddatum, s.actief,
              sv.omschrijving_opdracht,
              sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam,
              st.studentnummer,
              b.naam AS bedrijf_naam,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam,
              dp.voornaam AS docent_voornaam, dp.achternaam AS docent_achternaam
       FROM stage s
       JOIN stageovereenkomst so ON s.stageovereenkomst_id = so.id
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN student st ON s.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
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

/* ========== OPLEIDINGEN ========== */

/* GET /api/admin/opleidingen - haal alle opleidingen op */
router.get('/opleidingen', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM opleiding WHERE actief = TRUE ORDER BY naam'
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/admin/opleidingen - voeg een opleiding toe */
router.post('/opleidingen', controleerToken, isAdmin, async (req, res) => {
  const { naam, afkorting } = req.body

  if (!naam) {
    return res.status(400).json({ fout: 'Naam is verplicht' })
  }

  try {
    const [result] = await db.query(
      'INSERT INTO opleiding (naam, afkorting, actief) VALUES (?, ?, TRUE)',
      [naam, afkorting || null]
    )
    res.status(201).json({ id: result.insertId, bericht: 'Opleiding aangemaakt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ========== BEDRIJVEN ========== */

/* GET /api/admin/bedrijven - haal alle bedrijven op */
router.get('/bedrijven', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM bedrijf WHERE actief = TRUE ORDER BY naam'
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ========== ACADEMIEJAAR ========== */

/* GET /api/admin/academiejaren - haal alle academiejaren op */
router.get('/academiejaren', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM academiejaar ORDER BY startdatum DESC'
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* ========== STATISTIEKEN ========== */

/* GET /api/admin/statistieken - haal dashboard statistieken op */
router.get('/statistieken', controleerToken, isAdmin, async (req, res) => {
  try {
    const [studenten] = await db.query(
      "SELECT COUNT(*) AS aantal FROM persoon WHERE rol = 'student' AND actief = TRUE"
    )
    const [docenten] = await db.query(
      "SELECT COUNT(*) AS aantal FROM persoon WHERE rol = 'docent' AND actief = TRUE"
    )
    const [mentoren] = await db.query(
      "SELECT COUNT(*) AS aantal FROM persoon WHERE rol = 'stagementor' AND actief = TRUE"
    )
    const [bedrijven] = await db.query(
      'SELECT COUNT(*) AS aantal FROM bedrijf WHERE actief = TRUE'
    )
    const [stages] = await db.query(
      'SELECT COUNT(*) AS aantal FROM stage WHERE actief = TRUE'
    )
    const [openstaand] = await db.query(
      `SELECT COUNT(*) AS aantal FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
       WHERE st.naam = 'ingediend'`
    )

    res.json({
      studenten: studenten[0].aantal,
      docenten: docenten[0].aantal,
      mentoren: mentoren[0].aantal,
      bedrijven: bedrijven[0].aantal,
      actieve_stages: stages[0].aantal,
      openstaande_aanvragen: openstaand[0].aantal
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
