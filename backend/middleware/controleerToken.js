import jwt from 'jsonwebtoken'

function controleerToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ fout: 'Geen token opgegeven' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, gebruiker) => {
    if (err) {
      return res.status(403).json({ fout: 'Ongeldig token' })
    }
    req.gebruiker = gebruiker
    next()
  })
}

export default controleerToken