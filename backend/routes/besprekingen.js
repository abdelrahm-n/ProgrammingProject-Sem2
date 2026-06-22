import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* POST /api/besprekingen - student vraagt een tussentijdse bespreking aan bij zijn mentor */
router.post('/', controleerToken, async (req, res) => {
  if (req.gebruiker.rol !== 'student') {
    return res.status(403).json({ fout: 'Alleen studenten kunnen een bespreking aanvragen' })
  }
  const { bericht, voorkeur_datum } = req.body
  try {
    const [stages] = await db.query(
      'SELECT id, mentor_id FROM stage WHERE student_id = ? AND actief = TRUE ORDER BY aangemaakt_op DESC LIMIT 1',
      [req.gebruiker.id]
    )
    if (stages.length === 0) {
      return res.status(400).json({ fout: 'Je hebt nog geen actieve stage' })
    }
    const stage = stages[0]
    const [r] = await db.query(
      `INSERT INTO bespreking (stage_id, student_id, mentor_id, bericht, voorkeur_datum, status)
       VALUES (?, ?, ?, ?, ?, 'aangevraagd')`,
      [stage.id, req.gebruiker.id, stage.mentor_id, bericht || null, voorkeur_datum || null]
    )
    res.status(201).json({ id: r.insertId, bericht: 'Bespreking aangevraagd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/besprekingen/mijn - student ziet zijn eigen aanvragen */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT b.*, mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam
       FROM bespreking b
       LEFT JOIN persoon mp ON b.mentor_id = mp.id
       WHERE b.student_id = ?
       ORDER BY b.aangemaakt_op DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/besprekingen/mentor - mentor ziet de aanvragen van zijn stagiairs */
router.get('/mentor', controleerToken, async (req, res) => {
  if (req.gebruiker.rol !== 'stagementor') {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  try {
    const [rijen] = await db.query(
      `SELECT b.*, sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam,
              o.naam AS opleiding
       FROM bespreking b
       JOIN persoon sp ON b.student_id = sp.id
       LEFT JOIN student st ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       WHERE b.mentor_id = ?
       ORDER BY b.aangemaakt_op DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/besprekingen/:id - mentor bevestigt of weigert + optioneel antwoord */
router.put('/:id', controleerToken, async (req, res) => {
  if (req.gebruiker.rol !== 'stagementor') {
    return res.status(403).json({ fout: 'Alleen de mentor kan een bespreking beantwoorden' })
  }
  const { status, mentor_antwoord } = req.body
  if (!['bevestigd', 'geweigerd', 'aangevraagd'].includes(status)) {
    return res.status(400).json({ fout: 'Ongeldige status' })
  }
  try {
    const [rijen] = await db.query('SELECT mentor_id FROM bespreking WHERE id = ?', [req.params.id])
    if (rijen.length === 0) return res.status(404).json({ fout: 'Bespreking niet gevonden' })
    if (rijen[0].mentor_id !== req.gebruiker.id) {
      return res.status(403).json({ fout: 'Geen toegang tot deze bespreking' })
    }
    await db.query(
      'UPDATE bespreking SET status = ?, mentor_antwoord = ? WHERE id = ?',
      [status, mentor_antwoord || null, req.params.id]
    )
    res.json({ bericht: 'Bespreking bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
