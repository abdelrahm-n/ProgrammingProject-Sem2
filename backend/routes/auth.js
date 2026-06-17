import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/auth/me - huidige ingelogde gebruiker ophalen */
router.get('/me', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, rol FROM persoon WHERE id = ?',
      [req.gebruiker.id]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    const gebruiker = rijen[0]

    /* Haal extra info op afhankelijk van rol */
    if (gebruiker.rol === 'student') {
      const [student] = await db.query(
        'SELECT studentnummer, opleiding_id FROM student WHERE persoon_id = ?',
        [gebruiker.id]
      )
      if (student.length > 0) {
        gebruiker.studentnummer = student[0].studentnummer
        const [opleiding] = await db.query(
          'SELECT naam FROM opleiding WHERE id = ?',
          [student[0].opleiding_id]
        )
        gebruiker.opleiding = opleiding.length > 0 ? opleiding[0].naam : null
      }
    }

    if (gebruiker.rol === 'stagementor') {
      const [mentor] = await db.query(
        'SELECT functie, bedrijf_id FROM stagementor WHERE persoon_id = ?',
        [gebruiker.id]
      )
      if (mentor.length > 0) {
        gebruiker.functie = mentor[0].functie
        if (mentor[0].bedrijf_id) {
          const [bedrijf] = await db.query(
            'SELECT naam, adres, email, telefoon FROM bedrijf WHERE id = ?',
            [mentor[0].bedrijf_id]
          )
          if (bedrijf.length > 0) {
            gebruiker.bedrijf = bedrijf[0]
          }
        }
      }
    }

    if (gebruiker.rol === 'stagecommissie') {
      const [commissie] = await db.query(
        'SELECT commissie_rol FROM stagecommissielid WHERE persoon_id = ?',
        [gebruiker.id]
      )
      if (commissie.length > 0) {
        gebruiker.commissie_rol = commissie[0].commissie_rol
      }
    }

    if (gebruiker.rol === 'docent') {
      const [docent] = await db.query(
        'SELECT vakgroep FROM docent WHERE persoon_id = ?',
        [gebruiker.id]
      )
      if (docent.length > 0) {
        gebruiker.vakgroep = docent[0].vakgroep
      }
    }

    res.json(gebruiker)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/auth/login - gebruiker inloggen */
router.post('/login', async (req, res) => {
  const { email, wachtwoord } = req.body

  if (!email || !wachtwoord) {
    return res.status(400).json({ fout: 'E-mail en wachtwoord zijn verplicht' })
  }

  try {
    const [rijen] = await db.query(
      'SELECT * FROM persoon WHERE email = ?',
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

    const token = jwt.sign(
      { id: persoon.id, rol: persoon.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      rol: persoon.rol,
      naam: persoon.voornaam + ' ' + persoon.achternaam
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/auth/registreren - stagementor account aanmaken */
router.post('/registreren', async (req, res) => {
  const { voornaam, achternaam, wachtwoord } = req.body

  if (!voornaam || !achternaam || !wachtwoord) {
    return res.status(400).json({ fout: 'Voornaam, achternaam en wachtwoord zijn verplicht' })
  }

  if (wachtwoord.length < 6) {
    return res.status(400).json({ fout: 'Wachtwoord moet minstens 6 tekens lang zijn' })
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
      'INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, NULL, NULL)',
      [resultaat.insertId]
    )

    res.status(201).json({ bericht: 'Account aangemaakt', email })

  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Dev-login mapping: frontend rol → database rol */
const rolMapping = {
  student: 'student',
  docent: 'docent',
  mentor: 'stagementor',
  commissie: 'stagecommissie',
  admin: 'admin'
}

/* Inverse mapping: database rol → frontend rol */
const rolOmgekeerd = {
  student: 'student',
  docent: 'docent',
  stagementor: 'mentor',
  stagecommissie: 'commissie',
  admin: 'admin'
}

/* POST /api/auth/dev-login - direct inloggen zonder wachtwoord (alleen voor ontwikkeling) */
router.post('/dev-login', async (req, res) => {
  const { rol } = req.body

  const dbRol = rolMapping[rol]
  if (!dbRol) {
    return res.status(400).json({ fout: 'Ongeldige rol' })
  }

  try {
    const [rijen] = await db.query(
      'SELECT * FROM persoon WHERE rol = ? LIMIT 1',
      [dbRol]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Geen gebruiker gevonden voor deze rol. Draai eerst node seed.js' })
    }

    const persoon = rijen[0]

    const token = jwt.sign(
      { id: persoon.id, rol: persoon.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      rol: rolOmgekeerd[persoon.rol] || persoon.rol,
      naam: persoon.voornaam + ' ' + persoon.achternaam
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
