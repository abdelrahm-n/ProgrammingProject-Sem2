import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM evaluaties WHERE student_id = ?',
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router