import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/evaluaties/mijn - haal evaluaties op van de ingelogde student */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT e.*, g.naam AS beoordelaar_naam
       FROM evaluaties e
       JOIN gebruikers g ON e.beoordelaar = g.id
       WHERE e.student_id = ?
       ORDER BY e.datum DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/evaluaties/student/:id - evaluaties van een specifieke student */
router.get('/student/:id', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT e.*, g.naam AS beoordelaar_naam
       FROM evaluaties e
       JOIN gebruikers g ON e.beoordelaar = g.id
       WHERE e.student_id = ?
       ORDER BY e.datum DESC`,
      [req.params.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/evaluaties - mentor of docent voegt een evaluatie toe */
router.post('/', controleerToken, async (req, res) => {
  const { student_id, score, opmerking } = req.body

  if (!student_id || !score) {
    return res.status(400).json({ fout: 'Student en score zijn verplicht' })
  }

  try {
    const [resultaat] = await db.query(
      'INSERT INTO evaluaties (student_id, beoordelaar, score, opmerking) VALUES (?, ?, ?, ?)',
      [student_id, req.gebruiker.id, score, opmerking || null]
    )
    res.status(201).json({ id: resultaat.insertId, bericht: 'Evaluatie opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
