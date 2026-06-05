import jwt from 'jsonwebtoken'

// Gebruik op routes die inloggen vereisen:
// router.get('/iets', controleerToken, (req, res) => { ... })
//
// De ingelogde gebruiker zit dan in req.gebruiker
// req.gebruiker.id  → gebruiker id
// req.gebruiker.rol → student / docent / stagecommissie / mentor / admin

export function controleerToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ fout: 'Niet ingelogd.' })
  }
  const token = header.split(' ')[1]
  try {
    req.gebruiker = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ fout: 'Token ongeldig of verlopen.' })
  }
}

// Gebruik op routes die een specifieke rol vereisen:
// router.patch('/iets', controleerToken, alleenRol('stagecommissie', 'admin'), handler)

export function alleenRol(...rollen) {
  return (req, res, next) => {
    if (!rollen.includes(req.gebruiker.rol)) {
      return res.status(403).json({ fout: 'Geen toegang voor jouw rol.' })
    }
    next()
  }
}
