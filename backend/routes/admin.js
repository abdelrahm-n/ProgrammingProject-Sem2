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

/* GET /api/admin/gebruikers - haal alle personen op */
router.get('/gebruikers', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, actief FROM persoon ORDER BY achternaam'
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/admin/mentoren - haal alle stagementoren op */
router.get('/mentoren', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, p.actief, sm.functie
       FROM persoon p
       JOIN stagementor sm ON p.id = sm.persoon_id
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

  /* Genereer e-mailadres automatisch op basis van naam */
  const schoneVoornaam = voornaam.toLowerCase().replace(/[^a-z]/g, '')
  const schoneAchternaam = achternaam.toLowerCase().replace(/[^a-z]/g, '')
  const email = schoneVoornaam + '.' + schoneAchternaam + '@mentor.ehb.be'

  try {
    /* Controleer of het e-mailadres al in gebruik is */
    const [bestaand] = await db.query(
      'SELECT id FROM persoon WHERE email = ?',
      [email]
    )

    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik: ' + email })
    }

    const hash = await bcrypt.hash(wachtwoord, 10)

    /* Voeg de persoon toe */
    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES (?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash]
    )

    /* Voeg de mentor rij toe */
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

export default router
