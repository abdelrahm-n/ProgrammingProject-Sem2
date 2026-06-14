import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/stages/mijn - haal stages op van de ingelogde student */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      'SELECT * FROM stages WHERE student_id = ? ORDER BY ingediend DESC',
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/stages - haal alle stages op (voor commissie/admin) */
router.get('/', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT s.*, CONCAT(p.voornaam, ' ', p.achternaam) AS student_naam
       FROM stages s
       JOIN persoon p ON s.student_id = p.id
       ORDER BY s.ingediend DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/stages - student dient een stage in */
router.post('/', controleerToken, async (req, res) => {
  const { bedrijf, omschrijving } = req.body

  if (!bedrijf || !omschrijving) {
    return res.status(400).json({ fout: 'Bedrijf en omschrijving zijn verplicht' })
  }

  try {
    const [resultaat] = await db.query(
      'INSERT INTO stages (student_id, bedrijf, omschrijving) VALUES (?, ?, ?)',
      [req.gebruiker.id, bedrijf, omschrijving]
    )
    res.status(201).json({ id: resultaat.insertId, bericht: 'Stage ingediend' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/stages/:id/status - update de status van een stage */
router.put('/:id/status', controleerToken, async (req, res) => {
  const { status } = req.body

  try {
    await db.query(
      'UPDATE stages SET status = ? WHERE id = ?',
      [status, req.params.id]
    )
    res.json({ bericht: 'Status bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
