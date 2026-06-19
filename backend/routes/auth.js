import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Haal extra studentgegevens (studentnummer + opleiding) op voor een persoon.
   Geeft een leeg object terug als de persoon geen student is. */
async function haalStudentgegevens(persoonId) {
  const [rijen] = await db.query(
    `SELECT s.studentnummer, o.naam AS opleiding, o.id AS opleiding_id
     FROM student s
     LEFT JOIN opleiding o ON s.opleiding_id = o.id
     WHERE s.persoon_id = ?`,
    [persoonId]
  )
  return rijen.length > 0 ? rijen[0] : {}
}

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

    const studentgegevens = await haalStudentgegevens(persoon.id)

    res.json({
      token,
      id: persoon.id,
      rol: persoon.rol,
      naam: persoon.voornaam + ' ' + persoon.achternaam,
      email: persoon.email,
      studentnummer: studentgegevens.studentnummer || null,
      opleiding: studentgegevens.opleiding || null
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/auth/me - huidige gebruiker ophalen op basis van JWT token */
router.get('/me', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, rol FROM persoon WHERE id = ?',
      [req.gebruiker.id]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Gebruiker niet gevonden' })
    }

    const persoon = rijen[0]
    const antwoord = {
      id: persoon.id,
      voornaam: persoon.voornaam,
      achternaam: persoon.achternaam,
      email: persoon.email,
      rol: persoon.rol
    }

    switch (persoon.rol) {
      case 'student': {
        const [studentRijen] = await db.query(
          `SELECT s.studentnummer, o.naam AS opleiding
           FROM student s
           LEFT JOIN opleiding o ON s.opleiding_id = o.id
           WHERE s.persoon_id = ?`,
          [persoon.id]
        )
        if (studentRijen.length > 0) {
          antwoord.studentnummer = studentRijen[0].studentnummer
          antwoord.opleiding = studentRijen[0].opleiding
        }
        break
      }
      case 'docent': {
        const [docentRijen] = await db.query(
          'SELECT vakgroep FROM docent WHERE persoon_id = ?',
          [persoon.id]
        )
        if (docentRijen.length > 0) {
          antwoord.vakgroep = docentRijen[0].vakgroep
        }
        break
      }
      case 'stagementor': {
        const [mentorRijen] = await db.query(
          `SELECT sm.functie, b.naam AS bedrijf_naam, b.adres AS bedrijf_adres,
                  b.email AS bedrijf_email, b.telefoon AS bedrijf_telefoon
           FROM stagementor sm
           LEFT JOIN bedrijf b ON sm.bedrijf_id = b.id
           WHERE sm.persoon_id = ?`,
          [persoon.id]
        )
        if (mentorRijen.length > 0) {
          antwoord.functie = mentorRijen[0].functie
          if (mentorRijen[0].bedrijf_naam) {
            antwoord.bedrijf = {
              naam: mentorRijen[0].bedrijf_naam,
              adres: mentorRijen[0].bedrijf_adres,
              email: mentorRijen[0].bedrijf_email,
              telefoon: mentorRijen[0].bedrijf_telefoon
            }
          }
        }
        break
      }
      case 'stagecommissie': {
        const [commissieRijen] = await db.query(
          'SELECT commissie_rol FROM stagecommissielid WHERE persoon_id = ?',
          [persoon.id]
        )
        if (commissieRijen.length > 0) {
          antwoord.commissie_rol = commissieRijen[0].commissie_rol
        }
        break
      }
      case 'admin': {
        const [adminRijen] = await db.query(
          'SELECT dienst FROM administratie WHERE persoon_id = ?',
          [persoon.id]
        )
        if (adminRijen.length > 0) {
          antwoord.dienst = adminRijen[0].dienst
        }
        break
      }
    }

    res.json(antwoord)

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

    const studentgegevens = await haalStudentgegevens(persoon.id)

    res.json({
      token,
      id: persoon.id,
      rol: rolOmgekeerd[persoon.rol] || persoon.rol,
      naam: persoon.voornaam + ' ' + persoon.achternaam,
      email: persoon.email,
      studentnummer: studentgegevens.studentnummer || null,
      opleiding: studentgegevens.opleiding || null
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
