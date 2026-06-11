import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

/* Zoek in welke roltabel de persoon zit en geef de rolnaam terug */
async function bepaalRol(persoonId) {
  const tabellen = [
    { tabel: 'student',            rol: 'student'    },
    { tabel: 'docent',             rol: 'docent'     },
    { tabel: 'stagementor',        rol: 'mentor'     },
    { tabel: 'stagecommissielid',  rol: 'commissie'  },
    { tabel: 'administratie',      rol: 'admin'      }
  ]

  for (const entry of tabellen) {
    const [rijen] = await db.query(
      `SELECT persoon_id FROM ${entry.tabel} WHERE persoon_id = ?`,
      [persoonId]
    )
    if (rijen.length > 0) return entry.rol
  }

  return null
}

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, wachtwoord } = req.body

  if (!email || !wachtwoord) {
    return res.status(400).json({ fout: 'E-mail en wachtwoord zijn verplicht' })
  }

  try {
    const [rijen] = await db.query(
      'SELECT * FROM persoon WHERE email = ? AND actief = TRUE',
      [email]
    )

    if (rijen.length === 0) {
      return res.status(401).json({ fout: 'Gebruiker niet gevonden' })
    }

    const persoon = rijen[0]
    const klopt = await bcrypt.compare(wachtwoord, persoon.wachtwoord_hash)

    if (!klopt) {
      return res.status(401).json({ fout: 'Verkeerd wachtwoord' })
    }

    const rol = await bepaalRol(persoon.id)

    if (!rol) {
      return res.status(403).json({ fout: 'Geen rol toegewezen aan dit account' })
    }

    const token = jwt.sign(
      { id: persoon.id, rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      rol,
      naam: persoon.voornaam + ' ' + persoon.achternaam
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/auth/registreren (alleen voor stagementoren) */
router.post('/registreren', async (req, res) => {
  const { voornaam, achternaam, wachtwoord } = req.body

  if (!voornaam || !achternaam || !wachtwoord) {
    return res.status(400).json({ fout: 'Alle velden zijn verplicht' })
  }

  if (wachtwoord.length < 6) {
    return res.status(400).json({ fout: 'Wachtwoord moet minstens 6 tekens lang zijn' })
  }

  /* Genereer het e-mailadres automatisch op basis van naam */
  const schoneVoornaam = voornaam.toLowerCase().replace(/[^a-z]/g, '')
  const schoneAchternaam = achternaam.toLowerCase().replace(/[^a-z]/g, '')
  const email = `${schoneVoornaam}.${schoneAchternaam}@mentor.ehb.be`

  try {
    const [bestaand] = await db.query('SELECT id FROM persoon WHERE email = ?', [email])

    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Dit e-mailadres is al in gebruik' })
    }

    const hash = await bcrypt.hash(wachtwoord, 10)

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES (?, ?, ?, ?, TRUE)',
      [voornaam, achternaam, email, hash]
    )

    await db.query(
      'INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, NULL, NULL)',
      [resultaat.insertId]
    )

    res.status(201).json({ bericht: 'Account aangemaakt', email })

  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
