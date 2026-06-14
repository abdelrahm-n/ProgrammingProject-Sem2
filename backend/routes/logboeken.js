import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/logboeken/mijn - haal logboekentries op van de ingelogde student */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM logboeken WHERE student_id = ? ORDER BY datum DESC',
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/logboeken/student/:id - logboek van specifieke student (voor mentor/docent) */
router.get('/student/:id', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM logboeken WHERE student_id = ? ORDER BY datum DESC',
      [req.params.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken - student voegt een nieuwe logboekentry toe */
router.post('/', controleerToken, async (req, res) => {
  const { datum, inhoud } = req.body

  if (!datum || !inhoud) {
    return res.status(400).json({ fout: 'Datum en inhoud zijn verplicht' })
  }

  try {
    const [resultaat] = await db.query(
      'INSERT INTO logboeken (student_id, datum, inhoud) VALUES (?, ?, ?)',
      [req.gebruiker.id, datum, inhoud]
    )
    res.status(201).json({ id: resultaat.insertId, bericht: 'Logboekentry opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
