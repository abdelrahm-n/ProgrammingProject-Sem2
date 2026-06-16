import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Zoek de actieve stage van de ingelogde student.
   Geeft null terug als er nog geen stage is. */
async function haalStageVanStudent(studentId) {
  const [rijen] = await db.query(
    `SELECT s.id, s.startdatum, s.einddatum, b.naam AS bedrijf
     FROM stage s
     JOIN bedrijf b ON s.bedrijf_id = b.id
     WHERE s.student_id = ? AND s.actief = TRUE
     ORDER BY s.aangemaakt_op DESC
     LIMIT 1`,
    [studentId]
  )
  return rijen.length > 0 ? rijen[0] : null
}

/* Bereken maandag en zondag van de week waarin een datum valt */
function weekGrenzen(datumString) {
  const datum = new Date(datumString)
  const dag = datum.getDay() === 0 ? 7 : datum.getDay() /* zondag = 7 */
  const maandag = new Date(datum)
  maandag.setDate(datum.getDate() - (dag - 1))
  const zondag = new Date(maandag)
  zondag.setDate(maandag.getDate() + 6)
  const naarSql = (d) => d.toISOString().slice(0, 10)
  return { start: naarSql(maandag), einde: naarSql(zondag) }
}

/* GET /api/logboeken/mijn - logboek van de ingelogde student (alleen eigen stage) */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const stage = await haalStageVanStudent(req.gebruiker.id)

    if (!stage) {
      return res.json({ stage: null, weken: [] })
    }

    /* Alle weken van deze stage */
    const [weken] = await db.query(
      `SELECT lw.id, lw.week_nummer, lw.week_start, lw.week_einde,
              lw.feedback_mentor, lw.afgecheckt_op,
              ls.naam AS status
       FROM logboek_week lw
       LEFT JOIN logboek_status ls ON lw.status_id = ls.id
       WHERE lw.stage_id = ?
       ORDER BY lw.week_nummer ASC`,
      [stage.id]
    )

    /* Alle dagitems van deze stage in één keer ophalen */
    const [items] = await db.query(
      `SELECT ldi.id, ldi.logboek_week_id, ldi.datum,
              ldi.uitgevoerde_taken, ldi.reflectie, ldi.problemen_leerpunten
       FROM logboek_dag_item ldi
       JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
       WHERE lw.stage_id = ?
       ORDER BY ldi.datum ASC`,
      [stage.id]
    )

    /* Dagitems onder hun week hangen */
    const wekenMetItems = weken.map(w => ({
      ...w,
      dagen: items.filter(i => i.logboek_week_id === w.id)
    }))

    res.json({ stage, weken: wekenMetItems })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken/dag - voeg een dagelijks logboekitem toe (dynamisch).
   De juiste week wordt automatisch gezocht of aangemaakt. */
router.post('/dag', controleerToken, async (req, res) => {
  const { datum, uitgevoerde_taken, reflectie, problemen_leerpunten } = req.body

  if (!datum || !uitgevoerde_taken) {
    return res.status(400).json({ fout: 'Datum en uitgevoerde taken zijn verplicht' })
  }

  try {
    const stage = await haalStageVanStudent(req.gebruiker.id)
    if (!stage) {
      return res.status(400).json({ fout: 'Je hebt nog geen actieve stage om in te loggen' })
    }

    /* Zoek de week waarin deze datum valt */
    const grenzen = weekGrenzen(datum)

    const [bestaand] = await db.query(
      'SELECT id FROM logboek_week WHERE stage_id = ? AND week_start = ?',
      [stage.id, grenzen.start]
    )

    let weekId
    if (bestaand.length > 0) {
      weekId = bestaand[0].id
    } else {
      /* Bepaal het volgende weeknummer voor deze stage */
      const [telling] = await db.query(
        'SELECT COUNT(*) AS aantal FROM logboek_week WHERE stage_id = ?',
        [stage.id]
      )
      const weekNummer = telling[0].aantal + 1

      const [open] = await db.query("SELECT id FROM logboek_status WHERE naam = 'open'")
      const statusId = open.length > 0 ? open[0].id : null

      const [nieuweWeek] = await db.query(
        `INSERT INTO logboek_week (stage_id, week_nummer, week_start, week_einde, status_id)
         VALUES (?, ?, ?, ?, ?)`,
        [stage.id, weekNummer, grenzen.start, grenzen.einde, statusId]
      )
      weekId = nieuweWeek.insertId
    }

    const [item] = await db.query(
      `INSERT INTO logboek_dag_item
         (logboek_week_id, datum, uitgevoerde_taken, reflectie, problemen_leerpunten)
       VALUES (?, ?, ?, ?, ?)`,
      [weekId, datum, uitgevoerde_taken, reflectie || null, problemen_leerpunten || null]
    )

    res.status(201).json({ id: item.insertId, logboek_week_id: weekId, bericht: 'Logboekitem toegevoegd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* DELETE /api/logboeken/dag/:id - verwijder een eigen logboekitem */
router.delete('/dag/:id', controleerToken, async (req, res) => {
  try {
    /* Controleer dat het item bij de stage van de ingelogde student hoort */
    const [rijen] = await db.query(
      `SELECT ldi.id
       FROM logboek_dag_item ldi
       JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
       JOIN stage s ON lw.stage_id = s.id
       WHERE ldi.id = ? AND s.student_id = ?`,
      [req.params.id, req.gebruiker.id]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Logboekitem niet gevonden' })
    }

    await db.query('DELETE FROM logboek_dag_item WHERE id = ?', [req.params.id])
    res.json({ bericht: 'Logboekitem verwijderd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
