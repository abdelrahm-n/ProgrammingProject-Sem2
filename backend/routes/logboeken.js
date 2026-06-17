import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM logboeken WHERE student_id = ? ORDER BY datum DESC',
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: 'Serverfout' })
  }
})

router.post('/', controleerToken, async (req, res) => {
  const { datum, inhoud } = req.body
  try {
    const [result] = await db.query(
      'INSERT INTO logboeken (student_id, datum, inhoud) VALUES (?, ?, ?)',
      [req.gebruiker.id, datum, inhoud]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
