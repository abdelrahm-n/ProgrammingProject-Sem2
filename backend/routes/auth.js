import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  const { email, wachtwoord } = req.body
  try {
    const [rijen] = await db.query('SELECT * FROM gebruikers WHERE email = ?', [email])
    if (rijen.length === 0) {
      return res.status(401).json({ fout: 'Gebruiker niet gevonden' })
    }
    const gebruiker = rijen[0]
    const klopt = await bcrypt.compare(wachtwoord, gebruiker.wachtwoord)
    if (!klopt) {
      return res.status(401).json({ fout: 'Verkeerd wachtwoord' })
    }
    const token = jwt.sign(
      { id: gebruiker.id, rol: gebruiker.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, rol: gebruiker.rol, naam: gebruiker.naam })
  } catch (err) {
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router