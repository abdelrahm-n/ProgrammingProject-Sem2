import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Haal een evaluatie op en controleer of de gebruiker het mag zien.
   Studenten: alleen eigen evaluaties. Mentoren/docenten: alleen hun eigen stages. */
async function haalEvaluatieOpMetToegang(req, res, evaluatieId) {
  const [rijen] = await db.query(
    `SELECT em.*, et.naam AS type_naam, s.student_id
     FROM evaluatie_moment em
     JOIN evaluatie_type et ON em.type_id = et.id
     JOIN stage s ON em.stage_id = s.id
     WHERE em.id = ?`,
    [evaluatieId]
  )

  if (rijen.length === 0) {
    res.status(404).json({ fout: 'Evaluatiemoment niet gevonden' })
    return null
  }

  const evaluatie = rijen[0]

  if (req.gebruiker.rol === 'student' && evaluatie.student_id !== req.gebruiker.id) {
    res.status(403).json({ fout: 'Je mag alleen je eigen evaluaties bekijken' })
    return null
  }

  if (req.gebruiker.rol === 'stagementor' && evaluatie.mentor_id !== req.gebruiker.id) {
    res.status(403).json({ fout: 'Je mag alleen evaluaties van je eigen stagiairs bekijken' })
    return null
  }

  if (req.gebruiker.rol === 'docent' && evaluatie.docent_id !== req.gebruiker.id) {
    res.status(403).json({ fout: 'Je mag alleen evaluaties van je eigen studenten bekijken' })
    return null
  }

  return evaluatie
}

/* Haal eigen evaluaties op (student) */
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

/* Haal evaluaties op voor een specifieke stage */
router.get('/stage/:stageId', controleerToken, async (req, res) => {
  try {
    const [stage] = await db.query('SELECT student_id FROM stage WHERE id = ?', [req.params.stageId])

    if (stage.length === 0) {
      return res.status(404).json({ fout: 'Stage niet gevonden' })
    }

    if (req.gebruiker.rol === 'student' && stage[0].student_id !== req.gebruiker.id) {
      return res.status(403).json({ fout: 'Je mag alleen je eigen stage evalueren' })
    }

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

/* Haal competentiebeoordelingen op voor een evaluatie */
router.get('/:id/beoordelingen', controleerToken, async (req, res) => {
  try {
    const evaluatie = await haalEvaluatieOpMetToegang(req, res, req.params.id)
    if (!evaluatie) return

    const [rijen] = await db.query(
      `SELECT cb.*, c.naam AS competentie_naam, c.gewicht,
              c.rubric_volledig, c.rubric_goed, c.rubric_onvoldoende
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

/* Maak een nieuw evaluatiemoment aan (docent of mentor) */
router.post('/', controleerToken, async (req, res) => {
  const { stage_id, type_id, datum } = req.body

  if (!stage_id || !type_id || !datum) {
    return res.status(400).json({ fout: 'Stage, type en datum zijn verplicht' })
  }

  if (!['docent', 'stagementor'].includes(req.gebruiker.rol)) {
    return res.status(403).json({ fout: 'Alleen docenten en mentoren mogen evaluaties aanmaken' })
  }

  try {
    /* Mentor én docent van de stage koppelen, zodat beiden toegang hebben
       tot dit evaluatiemoment (ongeacht wie het aanmaakt). */
    const [stageRij] = await db.query('SELECT mentor_id, docent_id FROM stage WHERE id = ?', [stage_id])
    const mentor_id = stageRij.length ? stageRij[0].mentor_id : null
    const docent_id = stageRij.length ? stageRij[0].docent_id : null

    const [resultaat] = await db.query(
      `INSERT INTO evaluatie_moment (stage_id, docent_id, mentor_id, type_id, datum)
       VALUES (?, ?, ?, ?, ?)`,
      [stage_id, docent_id, mentor_id, type_id, datum]
    )

    const [studentRij] = await db.query(
      `SELECT st.opleiding_id FROM stage s
       JOIN student st ON s.student_id = st.persoon_id
       WHERE s.id = ?`, [stage_id]
    )

    if (studentRij.length === 0) {
      return res.status(404).json({ fout: 'Student niet gevonden' })
    }

    const opleidingId = studentRij[0].opleiding_id

    const [competenties] = await db.query(
      'SELECT id FROM competentie WHERE opleiding_id = ? AND actief = TRUE',
      [opleidingId]
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

/* Student vult reflectie + zelfscore in per competentie */
router.put('/:id/reflectie', controleerToken, async (req, res) => {
  const { competentie_id, student_reflectie, student_score } = req.body

  if (!competentie_id) {
    return res.status(400).json({ fout: 'Competentie is verplicht' })
  }

  try {
    const evaluatie = await haalEvaluatieOpMetToegang(req, res, req.params.id)
    if (!evaluatie) return

    if (req.gebruiker.rol !== 'student') {
      return res.status(403).json({ fout: 'Alleen studenten mogen reflecties invullen' })
    }

    await db.query(
      `UPDATE competentie_beoordeling
       SET student_reflectie = ?, student_score = ?
       WHERE evaluatie_moment_id = ? AND competentie_id = ?`,
      [student_reflectie || null, (student_score ?? null), req.params.id, competentie_id]
    )
    res.json({ bericht: 'Reflectie opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Mentor geeft score per competentie */
router.put('/:id/score', controleerToken, async (req, res) => {
  const { competentie_id, mentor_score, mentor_feedback } = req.body

  if (!competentie_id || mentor_score === undefined) {
    return res.status(400).json({ fout: 'Competentie en score zijn verplicht' })
  }

  try {
    const evaluatie = await haalEvaluatieOpMetToegang(req, res, req.params.id)
    if (!evaluatie) return

    if (req.gebruiker.rol !== 'stagementor') {
      return res.status(403).json({ fout: 'Alleen mentoren mogen scores geven' })
    }

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

/* Docent geeft feedback per competentie */
router.put('/:id/docent-feedback', controleerToken, async (req, res) => {
  const { competentie_id, docent_feedback } = req.body

  if (!competentie_id) {
    return res.status(400).json({ fout: 'Competentie is verplicht' })
  }

  try {
    const evaluatie = await haalEvaluatieOpMetToegang(req, res, req.params.id)
    if (!evaluatie) return

    if (req.gebruiker.rol !== 'docent') {
      return res.status(403).json({ fout: 'Alleen docenten mogen feedback geven' })
    }

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

/* Docent sluit evaluatie af met eindscore */
router.put('/:id/afsluiten', controleerToken, async (req, res) => {
  const { eindresultaat_score, algemene_feedback } = req.body

  try {
    const evaluatie = await haalEvaluatieOpMetToegang(req, res, req.params.id)
    if (!evaluatie) return

    if (req.gebruiker.rol !== 'docent') {
      return res.status(403).json({ fout: 'Alleen docenten mogen evaluaties afsluiten' })
    }

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
