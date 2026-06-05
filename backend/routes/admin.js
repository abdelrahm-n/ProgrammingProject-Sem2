import { Router } from 'express'
import db from '../db.js'
import bcrypt from 'bcryptjs'
import { controleerToken, alleenRol } from '../middleware/controleerToken.js'

const router = Router()

// GET /api/admin/gebruikers  — alle gebruikers
router.get('/gebruikers', controleerToken, alleenRol('admin'), async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT id, voornaam, achternaam, email, rol, aangemaakt FROM gebruikers ORDER BY achternaam'
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// POST /api/admin/gebruikers  — nieuwe gebruiker aanmaken
router.post('/gebruikers', controleerToken, alleenRol('admin'), async (req, res) => {
  const { voornaam, achternaam, email, wachtwoord, rol } = req.body
  try {
    const hash = await bcrypt.hash(wachtwoord, 10)
    await db.query(
      'INSERT INTO gebruikers (voornaam, achternaam, email, wachtwoord, rol) VALUES (?, ?, ?, ?, ?)',
      [voornaam, achternaam, email, hash, rol]
    )
    res.json({ bericht: 'Gebruiker aangemaakt.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// GET /api/admin/stages  — alle stages met namen
router.get('/stages', controleerToken, alleenRol('admin'), async (req, res) => {
  try {
    const [rijen] = await db.query(`
      SELECT s.*,
        g.voornaam AS student_voornaam, g.achternaam AS student_achternaam,
        d.voornaam AS docent_voornaam,  d.achternaam AS docent_achternaam
      FROM stages s
      LEFT JOIN gebruikers g ON s.student_id = g.id
      LEFT JOIN gebruikers d ON s.docent_id  = d.id
      ORDER BY s.aangemaakt DESC
    `)
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

export default router
