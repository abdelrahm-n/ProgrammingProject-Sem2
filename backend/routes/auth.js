import { Router } from 'express'
import db from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, wachtwoord } = req.body
  try {
    const [rijen] = await db.query('SELECT * FROM gebruikers WHERE email = ?', [email])
    const gebruiker = rijen[0]

    if (!gebruiker) {
      return res.status(401).json({ fout: 'E-mailadres niet gevonden.' })
    }

    const klopt = await bcrypt.compare(wachtwoord, gebruiker.wachtwoord)
    if (!klopt) {
      return res.status(401).json({ fout: 'Verkeerd wachtwoord.' })
    }

    const token = jwt.sign(
      { id: gebruiker.id, rol: gebruiker.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      rol:      gebruiker.rol,
      voornaam: gebruiker.voornaam,
    })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

export default router
