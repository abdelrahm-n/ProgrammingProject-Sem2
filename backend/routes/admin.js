import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

function isAdmin(req, res, next) {
  if (req.gebruiker.rol !== 'admin') {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  next()
}

router.get('/gebruikers', controleerToken, isAdmin, async (req, res) => {
  try {
    const [rijen] = await db.query('SELECT id, naam, email, rol FROM gebruikers')
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router