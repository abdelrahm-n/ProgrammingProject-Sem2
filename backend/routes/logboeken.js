import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/logboeken/mijn - haal alle logboek weken op voor de ingelogde student */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT lw.*, ls.naam AS status_naam, s.id AS stage_id
       FROM logboek_week lw
       JOIN stage s ON lw.stage_id = s.id
       JOIN logboek_status ls ON lw.status_id = ls.id
       WHERE s.student_id = ?
       ORDER BY lw.week_nummer DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/logboeken/stage/:stageId - haal logboek weken op voor een specifieke stage */
router.get('/stage/:stageId', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT lw.*, ls.naam AS status_naam
       FROM logboek_week lw
       JOIN logboek_status ls ON lw.status_id = ls.id
       WHERE lw.stage_id = ?
       ORDER BY lw.week_nummer ASC`,
      [req.params.stageId]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/logboeken/:weekId - haal een specifieke week op met dag items */
router.get('/:weekId', controleerToken, async (req, res) => {
  try {
    const [week] = await db.query(
      `SELECT lw.*, ls.naam AS status_naam
       FROM logboek_week lw
       JOIN logboek_status ls ON lw.status_id = ls.id
       WHERE lw.id = ?`,
      [req.params.weekId]
    )

    if (week.length === 0) {
      return res.status(404).json({ fout: 'Logboek week niet gevonden' })
    }

    const [dagen] = await db.query(
      `SELECT ldi.*
       FROM logboek_dag_item ldi
       WHERE ldi.logboek_week_id = ?
       ORDER BY ldi.datum ASC`,
      [req.params.weekId]
    )

    /* Haal feedback op voor elke dag */
    for (const dag of dagen) {
      const [feedback] = await db.query(
        `SELECT lf.*, p.voornaam, p.achternaam
         FROM logboek_feedback lf
         JOIN persoon p ON lf.afzender_id = p.id
         WHERE lf.logboek_dag_item_id = ?
         ORDER BY lf.gegeven_op ASC`,
        [dag.id]
      )
      dag.feedback = feedback
    }

    res.json({ ...week[0], dagen })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken - maak een nieuwe logboek week aan */
router.post('/', controleerToken, async (req, res) => {
  const { stage_id, week_nummer, week_start, week_einde } = req.body

  if (!stage_id || !week_nummer || !week_start || !week_einde) {
    return res.status(400).json({ fout: 'Stage, week nummer, start en einde zijn verplicht' })
  }

  try {
    /* Controleer of de student eigenaar is van de stage */
    const [stage] = await db.query(
      'SELECT id FROM stage WHERE id = ? AND student_id = ?',
      [stage_id, req.gebruiker.id]
    )

    if (stage.length === 0) {
      return res.status(403).json({ fout: 'Geen toegang tot deze stage' })
    }

    /* Controleer of deze week al bestaat */
    const [bestaand] = await db.query(
      'SELECT id FROM logboek_week WHERE stage_id = ? AND week_nummer = ?',
      [stage_id, week_nummer]
    )

    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Deze week bestaat al' })
    }

    /* Haal de standaard "open" status op */
    const [status] = await db.query("SELECT id FROM logboek_status WHERE naam = 'open'")

    if (status.length === 0) {
      return res.status(500).json({ fout: 'Status open niet gevonden in de database' })
    }

    const [result] = await db.query(
      'INSERT INTO logboek_week (stage_id, week_nummer, week_start, week_einde, status_id) VALUES (?, ?, ?, ?, ?)',
      [stage_id, week_nummer, week_start, week_einde, status[0].id]
    )

    res.status(201).json({ id: result.insertId, bericht: 'Logboek week aangemaakt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken/:weekId/dagen - voeg een dag item toe aan een week */
router.post('/:weekId/dagen', controleerToken, async (req, res) => {
  const { datum, uitgevoerde_taken, reflectie, problemen_leerpunten } = req.body

  if (!datum) {
    return res.status(400).json({ fout: 'Datum is verplicht' })
  }

  try {
    /* Controleer of de week bestaat en de student eigenaar is */
    const [week] = await db.query(
      `SELECT lw.id
       FROM logboek_week lw
       JOIN stage s ON lw.stage_id = s.id
       WHERE lw.id = ? AND s.student_id = ?`,
      [req.params.weekId, req.gebruiker.id]
    )

    if (week.length === 0) {
      return res.status(404).json({ fout: 'Logboek week niet gevonden' })
    }

    /* Controleer of er al een dag item is met deze datum */
    const [bestaand] = await db.query(
      'SELECT id FROM logboek_dag_item WHERE logboek_week_id = ? AND datum = ?',
      [req.params.weekId, datum]
    )

    if (bestaand.length > 0) {
      return res.status(409).json({ fout: 'Er bestaat al een dag item voor deze datum' })
    }

    const [result] = await db.query(
      'INSERT INTO logboek_dag_item (logboek_week_id, datum, uitgevoerde_taken, reflectie, problemen_leerpunten) VALUES (?, ?, ?, ?, ?)',
      [req.params.weekId, datum, uitgevoerde_taken || null, reflectie || null, problemen_leerpunten || null]
    )

    res.status(201).json({ id: result.insertId, bericht: 'Dag item toegevoegd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/logboeken/dag/:dagId - pas een dag item aan */
router.put('/dag/:dagId', controleerToken, async (req, res) => {
  const { uitgevoerde_taken, reflectie, problemen_leerpunten } = req.body

  try {
    /* Controleer of de dag bestaat en de student eigenaar is */
    const [dag] = await db.query(
      `SELECT ldi.id
       FROM logboek_dag_item ldi
       JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
       JOIN stage s ON lw.stage_id = s.id
       WHERE ldi.id = ? AND s.student_id = ?`,
      [req.params.dagId, req.gebruiker.id]
    )

    if (dag.length === 0) {
      return res.status(404).json({ fout: 'Dag item niet gevonden' })
    }

    await db.query(
      'UPDATE logboek_dag_item SET uitgevoerde_taken = ?, reflectie = ?, problemen_leerpunten = ? WHERE id = ?',
      [uitgevoerde_taken || null, reflectie || null, problemen_leerpunten || null, req.params.dagId]
    )

    res.json({ bericht: 'Dag item bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken/dag/:dagId/feedback - voeg feedback toe aan een dag item */
router.post('/dag/:dagId/feedback', controleerToken, async (req, res) => {
  const { feedback } = req.body

  if (!feedback) {
    return res.status(400).json({ fout: 'Feedback is verplicht' })
  }

  try {
    /* Controleer of het dag item bestaat */
    const [dag] = await db.query(
      'SELECT id FROM logboek_dag_item WHERE id = ?',
      [req.params.dagId]
    )

    if (dag.length === 0) {
      return res.status(404).json({ fout: 'Dag item niet gevonden' })
    }

    const [result] = await db.query(
      'INSERT INTO logboek_feedback (logboek_dag_item_id, afzender_id, feedback) VALUES (?, ?, ?)',
      [req.params.dagId, req.gebruiker.id, feedback]
    )

    res.status(201).json({ id: result.insertId, bericht: 'Feedback toegevoegd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/logboeken/:weekId/feedback - mentor geeft algemene feedback op een week */
router.put('/:weekId/feedback', controleerToken, async (req, res) => {
  const { feedback_mentor } = req.body

  try {
    /* Controleer of de week bestaat */
    const [week] = await db.query(
      'SELECT id FROM logboek_week WHERE id = ?',
      [req.params.weekId]
    )

    if (week.length === 0) {
      return res.status(404).json({ fout: 'Logboek week niet gevonden' })
    }

    await db.query(
      'UPDATE logboek_week SET feedback_mentor = ? WHERE id = ?',
      [feedback_mentor || null, req.params.weekId]
    )

    res.json({ bericht: 'Feedback opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/logboeken/:weekId/afchecken - mentor checkt een week af */
router.put('/:weekId/afchecken', controleerToken, async (req, res) => {
  try {
    /* Haal de "afgecheckt" status op */
    const [status] = await db.query("SELECT id FROM logboek_status WHERE naam = 'afgecheckt'")

    if (status.length === 0) {
      return res.status(500).json({ fout: 'Status afgecheckt niet gevonden' })
    }

    const [result] = await db.query(
      'UPDATE logboek_week SET status_id = ?, afgecheckt_op = NOW() WHERE id = ?',
      [status[0].id, req.params.weekId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ fout: 'Logboek week niet gevonden' })
    }

    res.json({ bericht: 'Week afgecheckt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
