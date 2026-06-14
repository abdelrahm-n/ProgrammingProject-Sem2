import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/competenties - haal alle actieve competenties op */
router.get('/', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM competentie WHERE actief = TRUE ORDER BY naam'
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/competenties - voeg een nieuwe competentie toe */
router.post('/', controleerToken, async (req, res) => {
  const { naam, beschrijving, gewicht, opleiding_id } = req.body

  if (!naam || !opleiding_id) {
    return res.status(400).json({ fout: 'Naam en opleiding zijn verplicht' })
  }

  try {
    const [resultaat] = await db.query(
      'INSERT INTO competentie (naam, beschrijving, gewicht, opleiding_id, actief) VALUES (?, ?, ?, ?, TRUE)',
      [naam, beschrijving || null, gewicht || 1, opleiding_id]
    )
    res.status(201).json({ id: resultaat.insertId, bericht: 'Competentie aangemaakt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/competenties/:id - pas een competentie aan */
router.put('/:id', controleerToken, async (req, res) => {
  const { naam, beschrijving, gewicht, actief } = req.body

  try {
    await db.query(
      'UPDATE competentie SET naam = ?, beschrijving = ?, gewicht = ?, actief = ? WHERE id = ?',
      [naam, beschrijving || null, gewicht || 1, actief !== false, req.params.id]
    )
    res.json({ bericht: 'Competentie bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
