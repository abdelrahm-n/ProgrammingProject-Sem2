import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/documenten/stage/:stageId - haal documenten op voor een stage */
router.get('/stage/:stageId', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT d.*, p.voornaam, p.achternaam
       FROM document d
       JOIN persoon p ON d.uploader_id = p.id
       WHERE d.stagevoorstel_id IN (
         SELECT sv.id FROM stagevoorstel sv
         JOIN stage s ON sv.student_id = s.student_id
         WHERE s.id = ?
       )
       OR d.stageovereenkomst_id IN (
         SELECT so.id FROM stageovereenkomst so
         JOIN stage s ON so.id = s.stageovereenkomst_id
         WHERE s.id = ?
       )
       ORDER BY d.geupload_op DESC`,
      [req.params.stageId, req.params.stageId]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/documenten/voorstel/:voorstelId - haal documenten op voor een stagevoorstel */
router.get('/voorstel/:voorstelId', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT d.*, p.voornaam, p.achternaam
       FROM document d
       JOIN persoon p ON d.uploader_id = p.id
       WHERE d.stagevoorstel_id = ?
       ORDER BY d.geupload_op DESC`,
      [req.params.voorstelId]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/documenten/overeenkomst/:overeenkomstId - haal documenten op voor een stageovereenkomst */
router.get('/overeenkomst/:overeenkomstId', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT d.*, p.voornaam, p.achternaam
       FROM document d
       JOIN persoon p ON d.uploader_id = p.id
       WHERE d.stageovereenkomst_id = ?
       ORDER BY d.geupload_op DESC`,
      [req.params.overeenkomstId]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/documenten - voeg een document toe */
router.post('/', controleerToken, async (req, res) => {
  const { stagevoorstel_id, stageovereenkomst_id, type, bestandsnaam, bestand_url } = req.body

  if (!type || !bestandsnaam) {
    return res.status(400).json({ fout: 'Type en bestandsnaam zijn verplicht' })
  }

  try {
    const [result] = await db.query(
      `INSERT INTO document (stagevoorstel_id, stageovereenkomst_id, uploader_id, type, bestandsnaam, bestand_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [stagevoorstel_id || null, stageovereenkomst_id || null, req.gebruiker.id, type, bestandsnaam, bestand_url || null]
    )

    res.status(201).json({ id: result.insertId, bericht: 'Document geüpload' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* DELETE /api/documenten/:id - verwijder een document */
router.delete('/:id', controleerToken, async (req, res) => {
  try {
    const [doc] = await db.query(
      'SELECT uploader_id FROM document WHERE id = ?',
      [req.params.id]
    )

    if (doc.length === 0) {
      return res.status(404).json({ fout: 'Document niet gevonden' })
    }

    if (doc[0].uploader_id !== req.gebruiker.id && req.gebruiker.rol !== 'admin') {
      return res.status(403).json({ fout: 'Geen toegang' })
    }

    await db.query('DELETE FROM document WHERE id = ?', [req.params.id])
    res.json({ bericht: 'Document verwijderd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
