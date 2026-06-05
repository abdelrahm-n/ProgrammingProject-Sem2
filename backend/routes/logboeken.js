import { Router } from 'express'
import db from '../db.js'
import { controleerToken, alleenRol } from '../middleware/controleerToken.js'

const router = Router()

// GET /api/logboeken/mijn  — eigen logboeken van de student
router.get('/mijn', controleerToken, alleenRol('student'), async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM logboeken WHERE student_id = ? ORDER BY datum DESC',
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// GET /api/logboeken/:stageId  — logboeken van een stage (docent / mentor)
router.get('/:stageId', controleerToken, alleenRol('docent', 'mentor', 'admin'), async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM logboeken WHERE stage_id = ? ORDER BY datum DESC',
      [req.params.stageId]
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// POST /api/logboeken  — nieuw logboek (student)
router.post('/', controleerToken, alleenRol('student'), async (req, res) => {
  const { stageId, datum, taken, reflectie, problemen } = req.body
  try {
    await db.query(
      'INSERT INTO logboeken (stage_id, student_id, datum, taken, reflectie, problemen) VALUES (?, ?, ?, ?, ?, ?)',
      [stageId, req.gebruiker.id, datum, taken, reflectie || null, problemen || null]
    )
    res.json({ bericht: 'Logboek opgeslagen.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// PATCH /api/logboeken/:id/aftekenen  — wekelijks aftekenen (mentor)
router.patch('/:id/aftekenen', controleerToken, alleenRol('mentor'), async (req, res) => {
  const { opmerking } = req.body
  try {
    await db.query(
      'UPDATE logboeken SET mentor_getekend = 1, mentor_opmerking = ? WHERE id = ?',
      [opmerking || null, req.params.id]
    )
    res.json({ bericht: 'Logboek afgetekend.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

export default router
