import { Router } from 'express'
import db from '../db.js'
import { controleerToken, alleenRol } from '../middleware/controleerToken.js'

const router = Router()

// GET /api/competenties  — alle actieve competenties (iedereen)
router.get('/', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM competenties WHERE actief = 1 ORDER BY volgorde'
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// POST /api/competenties  — nieuwe competentie (commissie / admin)
router.post('/', controleerToken, alleenRol('stagecommissie', 'admin'), async (req, res) => {
  const { naam, omschrijving, gewicht } = req.body
  try {
    await db.query(
      'INSERT INTO competenties (naam, omschrijving, gewicht) VALUES (?, ?, ?)',
      [naam, omschrijving || null, gewicht || 1]
    )
    res.json({ bericht: 'Competentie toegevoegd.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// PUT /api/competenties/:id  — competentie bewerken (commissie / admin)
router.put('/:id', controleerToken, alleenRol('stagecommissie', 'admin'), async (req, res) => {
  const { naam, omschrijving, gewicht } = req.body
  try {
    await db.query(
      'UPDATE competenties SET naam = ?, omschrijving = ?, gewicht = ? WHERE id = ?',
      [naam, omschrijving || null, gewicht, req.params.id]
    )
    res.json({ bericht: 'Competentie bijgewerkt.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// DELETE /api/competenties/:id  — deactiveren (commissie / admin)
router.delete('/:id', controleerToken, alleenRol('stagecommissie', 'admin'), async (req, res) => {
  try {
    await db.query('UPDATE competenties SET actief = 0 WHERE id = ?', [req.params.id])
    res.json({ bericht: 'Competentie verwijderd.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

export default router
