import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/notificaties - haal notificaties op voor de ingelogde gebruiker */
router.get('/', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT * FROM notificatie
       WHERE ontvanger_id = ?
       ORDER BY aangemaakt_op DESC
       LIMIT 50`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/notificaties/ongelezen - haal aantal ongelezen notificaties op */
router.get('/ongelezen', controleerToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) AS aantal FROM notificatie WHERE ontvanger_id = ? AND gelezen = FALSE',
      [req.gebruiker.id]
    )
    res.json({ aantal: result[0].aantal })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/notificaties/:id/gelezen - markeer een notificatie als gelezen */
router.put('/:id/gelezen', controleerToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE notificatie SET gelezen = TRUE WHERE id = ? AND ontvanger_id = ?',
      [req.params.id, req.gebruiker.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ fout: 'Notificatie niet gevonden' })
    }

    res.json({ bericht: 'Notificatie gemarkeerd als gelezen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/notificaties/alle-gelezen - markeer alle notificaties als gelezen */
router.put('/alle-gelezen', controleerToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE notificatie SET gelezen = TRUE WHERE ontvanger_id = ? AND gelezen = FALSE',
      [req.gebruiker.id]
    )
    res.json({ bericht: 'Alle notificaties gemarkeerd als gelezen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/notificaties - maak een notificatie aan (admin only) */
router.post('/', controleerToken, async (req, res) => {
  if (req.gebruiker.rol !== 'admin') {
    return res.status(403).json({ fout: 'Geen toegang' })
  }

  const { ontvanger_id, titel, boodschap } = req.body

  if (!ontvanger_id || !titel || !boodschap) {
    return res.status(400).json({ fout: 'Ontvanger, titel en boodschap zijn verplicht' })
  }

  try {
    const [result] = await db.query(
      'INSERT INTO notificatie (ontvanger_id, titel, boodschap) VALUES (?, ?, ?)',
      [ontvanger_id, titel, boodschap]
    )
    res.status(201).json({ id: result.insertId, bericht: 'Notificatie aangemaakt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* DELETE /api/notificaties/:id - verwijder een notificatie */
router.delete('/:id', controleerToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM notificatie WHERE id = ? AND ontvanger_id = ?',
      [req.params.id, req.gebruiker.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ fout: 'Notificatie niet gevonden' })
    }

    res.json({ bericht: 'Notificatie verwijderd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
