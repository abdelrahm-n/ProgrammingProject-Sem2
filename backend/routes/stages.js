import { Router } from 'express'
import db from '../db.js'
import { controleerToken, alleenRol } from '../middleware/controleerToken.js'

const router = Router()

// GET /api/stages/mijn  — eigen stage van de student
router.get('/mijn', controleerToken, alleenRol('student'), async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM stages WHERE student_id = ? ORDER BY aangemaakt DESC',
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// GET /api/stages  — alle stages (commissie / docent / admin)
router.get('/', controleerToken, alleenRol('stagecommissie', 'docent', 'admin'), async (req, res) => {
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

// POST /api/stages  — stage indienen (student)
router.post('/', controleerToken, alleenRol('student'), async (req, res) => {
  const { bedrijfNaam, bedrijfAdres, mentorNaam, mentorEmail, opdracht, startdatum, einddatum } = req.body
  try {
    await db.query(
      `INSERT INTO stages (student_id, bedrijf_naam, bedrijf_adres, mentor_naam, mentor_email, opdracht_omschrijving, start_datum, eind_datum)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.gebruiker.id, bedrijfNaam, bedrijfAdres, mentorNaam, mentorEmail, opdracht, startdatum, einddatum]
    )
    res.json({ bericht: 'Stage ingediend.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// PATCH /api/stages/:id/status  — beoordelen (stagecommissie)
router.patch('/:id/status', controleerToken, alleenRol('stagecommissie', 'admin'), async (req, res) => {
  const { status, feedback } = req.body
  try {
    await db.query(
      'UPDATE stages SET status = ?, commissie_feedback = ? WHERE id = ?',
      [status, feedback || null, req.params.id]
    )
    res.json({ bericht: 'Status bijgewerkt.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

export default router
