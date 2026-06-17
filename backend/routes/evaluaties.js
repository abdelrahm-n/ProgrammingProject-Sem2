import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/evaluaties/mijn - student haalt zijn eigen evaluaties op */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT em.*, et.naam AS type_naam
       FROM evaluatie_moment em
       JOIN stage s ON em.stage_id = s.id
       JOIN evaluatie_type et ON em.type_id = et.id
       WHERE s.student_id = ?
       ORDER BY em.datum DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/evaluaties/stage/:stageId - evaluaties van een specifieke stage */
router.get('/stage/:stageId', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT em.*, et.naam AS type_naam
       FROM evaluatie_moment em
       JOIN evaluatie_type et ON em.type_id = et.id
       WHERE em.stage_id = ?
       ORDER BY em.datum DESC`,
      [req.params.stageId]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/evaluaties/:id/beoordelingen - haal competentiebeoordelingen op */
router.get('/:id/beoordelingen', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT cb.*, c.naam AS competentie_naam, c.gewicht
       FROM competentie_beoordeling cb
       JOIN competentie c ON cb.competentie_id = c.id
       WHERE cb.evaluatie_moment_id = ?
       ORDER BY c.naam`,
      [req.params.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/evaluaties - maak een nieuw evaluatiemoment aan */
router.post('/', controleerToken, async (req, res) => {
  const { stage_id, type_id, datum } = req.body

  if (!stage_id || !type_id || !datum) {
    return res.status(400).json({ fout: 'Stage, type en datum zijn verplicht' })
  }

  try {
    /* Bepaal of de ingelogde persoon docent of mentor is */
    const docent_id = req.gebruiker.rol === 'docent' ? req.gebruiker.id : null
    const mentor_id = req.gebruiker.rol === 'mentor' ? req.gebruiker.id : null

    const [resultaat] = await db.query(
      `INSERT INTO evaluatie_moment (stage_id, docent_id, mentor_id, type_id, datum)
       VALUES (?, ?, ?, ?, ?)`,
      [stage_id, docent_id, mentor_id, type_id, datum]
    )

    /* Maak automatisch een beoordeling aan voor elke actieve competentie */
    const [competenties] = await db.query(
      'SELECT id FROM competentie WHERE actief = TRUE'
    )

    for (const c of competenties) {
      await db.query(
        'INSERT INTO competentie_beoordeling (evaluatie_moment_id, competentie_id) VALUES (?, ?)',
        [resultaat.insertId, c.id]
      )
    }

    res.status(201).json({ id: resultaat.insertId, bericht: 'Evaluatiemoment aangemaakt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/evaluaties/:id/reflectie - student vult reflectie in per competentie */
router.put('/:id/reflectie', controleerToken, async (req, res) => {
  const { competentie_id, student_reflectie } = req.body

  if (!competentie_id) {
    return res.status(400).json({ fout: 'Competentie is verplicht' })
  }

  try {
    await db.query(
      `UPDATE competentie_beoordeling
       SET student_reflectie = ?
       WHERE evaluatie_moment_id = ? AND competentie_id = ?`,
      [student_reflectie || null, req.params.id, competentie_id]
    )
    res.json({ bericht: 'Reflectie opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/evaluaties/:id/score - mentor geeft score per competentie */
router.put('/:id/score', controleerToken, async (req, res) => {
  const { competentie_id, mentor_score, mentor_feedback } = req.body

  if (!competentie_id || mentor_score === undefined) {
    return res.status(400).json({ fout: 'Competentie en score zijn verplicht' })
  }

  try {
    await db.query(
      `UPDATE competentie_beoordeling
       SET mentor_score = ?, mentor_feedback = ?
       WHERE evaluatie_moment_id = ? AND competentie_id = ?`,
      [mentor_score, mentor_feedback || null, req.params.id, competentie_id]
    )
    res.json({ bericht: 'Score opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/evaluaties/:id/docent-feedback - docent geeft feedback per competentie */
router.put('/:id/docent-feedback', controleerToken, async (req, res) => {
  const { competentie_id, docent_feedback } = req.body

  if (!competentie_id) {
    return res.status(400).json({ fout: 'Competentie is verplicht' })
  }

  try {
    await db.query(
      `UPDATE competentie_beoordeling
       SET docent_feedback = ?
       WHERE evaluatie_moment_id = ? AND competentie_id = ?`,
      [docent_feedback || null, req.params.id, competentie_id]
    )
    res.json({ bericht: 'Feedback opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/evaluaties/:id/afsluiten - docent sluit evaluatie af met eindscore */
router.put('/:id/afsluiten', controleerToken, async (req, res) => {
  const { eindresultaat_score, algemene_feedback } = req.body

  try {
    await db.query(
      `UPDATE evaluatie_moment
       SET eindresultaat_score = ?, algemene_feedback = ?
       WHERE id = ?`,
      [eindresultaat_score || null, algemene_feedback || null, req.params.id]
    )
    res.json({ bericht: 'Evaluatie afgesloten' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
