import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM stages WHERE student_id = ?',
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: 'Serverfout' })
  }
})

router.post('/', controleerToken, async (req, res) => {
  const { bedrijf, omschrijving } = req.body
  try {
    const [result] = await db.query(
      'INSERT INTO stages (student_id, bedrijf, omschrijving) VALUES (?, ?, ?)',
      [req.gebruiker.id, bedrijf, omschrijving]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router