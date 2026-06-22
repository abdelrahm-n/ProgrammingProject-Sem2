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

/* Haal per dagitem de gekoppelde competenties op voor een hele stage */
async function haalCompetentieKoppelingen(stageId) {
  const [rijen] = await db.query(
    `SELECT ldc.logboek_dag_item_id, c.id AS competentie_id, c.naam
     FROM logboek_dag_competentie ldc
     JOIN logboek_dag_item ldi ON ldc.logboek_dag_item_id = ldi.id
     JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
     JOIN competentie c ON ldc.competentie_id = c.id
     WHERE lw.stage_id = ?
     ORDER BY c.id`,
    [stageId]
  )
  return rijen
}

/* Haal de actieve competenties op van de opleiding van een student */
async function haalCompetentiesVanStudent(studentId) {
  const [rijen] = await db.query(
    `SELECT c.id, c.naam
     FROM competentie c
     JOIN student st ON st.opleiding_id = c.opleiding_id
     WHERE st.persoon_id = ? AND c.actief = TRUE
     ORDER BY c.id`,
    [studentId]
  )
  return rijen
}

/* Koppel een lijst competenties aan een dagitem (vervangt bestaande koppelingen) */
async function koppelCompetenties(dagItemId, competentieIds) {
  await db.query('DELETE FROM logboek_dag_competentie WHERE logboek_dag_item_id = ?', [dagItemId])
  if (!Array.isArray(competentieIds)) return
  for (const cid of competentieIds) {
    const id = Number(cid)
    if (!id) continue
    await db.query(
      'INSERT IGNORE INTO logboek_dag_competentie (logboek_dag_item_id, competentie_id) VALUES (?, ?)',
      [dagItemId, id]
    )
  }
}

/* Bereken maandag en vrijdag van de week waarin een datum valt (ma-vr = 5 dagen) */
function weekGrenzen(datumString) {
  const datum = new Date(datumString)
  const dag = datum.getDay() === 0 ? 7 : datum.getDay() /* zondag = 7 */
  const maandag = new Date(datum)
  maandag.setDate(datum.getDate() - (dag - 1))
  const vrijdag = new Date(maandag)
  vrijdag.setDate(maandag.getDate() + 4)
  const naarSql = (d) => d.toISOString().slice(0, 10)
  return { start: naarSql(maandag), einde: naarSql(vrijdag) }
}

/* Bereken de eerste maandag op of na een gegeven datum */
function eersteMaandagNa(datumString) {
  const datum = new Date(datumString)
  const dag = datum.getDay()
  if (dag === 1) return datum /* maandag */
  if (dag === 0) { datum.setDate(datum.getDate() + 1); return datum }
  datum.setDate(datum.getDate() + (8 - dag))
  return datum
}

/* Bereken het weeknummer op basis van de eerste maandag van de stage */
function berekenWeekNummer(weekStart, eersteMaandag) {
  const ws = new Date(weekStart)
  return Math.round((ws - eersteMaandag) / (1000 * 60 * 60 * 24 * 7)) + 1
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

    /* Gekoppelde competenties per dagitem ophalen */
    const koppelingen = await haalCompetentieKoppelingen(stage.id)

    /* Dagitems onder hun week hangen, inclusief gekoppelde competenties */
    const wekenMetItems = weken.map(w => ({
      ...w,
      dagen: items
        .filter(i => i.logboek_week_id === w.id)
        .map(i => ({ ...i, competenties: koppelingen.filter(k => k.logboek_dag_item_id === i.id) }))
    }))

    /* Competentielijst van de opleiding van de student (voor de keuzeknoppen) */
    const competenties = await haalCompetentiesVanStudent(req.gebruiker.id)

    res.json({ stage, weken: wekenMetItems, competenties })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken/dag - voeg een dagelijks logboekitem toe (dynamisch).
   De juiste week wordt automatisch gezocht of aangemaakt. */
router.post('/dag', controleerToken, async (req, res) => {
  const { datum, uitgevoerde_taken, reflectie, problemen_leerpunten, competenties } = req.body

  if (!datum || !uitgevoerde_taken) {
    return res.status(400).json({ fout: 'Datum en uitgevoerde taken zijn verplicht' })
  }

  try {
    const stage = await haalStageVanStudent(req.gebruiker.id)
    if (!stage) {
      return res.status(400).json({ fout: 'Je hebt nog geen actieve stage om in te loggen' })
    }

    /* Valideer dat de datum binnen de stageperiode valt (string-vergelijking op YYYY-MM-DD) */
    if (datum < stage.startdatum || datum > stage.einddatum) {
      return res.status(400).json({
        fout: `De datum valt buiten je stageperiode (${stage.startdatum} t.e.m. ${stage.einddatum})`
      })
    }

    /* Valideer dat de datum een weekdag is (ma-vr) */
    const dagVanDeWeek = new Date(datum).getDay()
    if (dagVanDeWeek === 0 || dagVanDeWeek === 6) {
      return res.status(400).json({ fout: 'Je kunt alleen doordeweeks (ma-vr) logboekitems invullen.' })
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
      /* Bereken weeknummer op basis van eerste maandag van de stage */
      const eersteMaandag = eersteMaandagNa(stage.startdatum)
      const weekNummer = berekenWeekNummer(grenzen.start, eersteMaandag)

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

/* ============================================================
   MENTOR / DOCENT: logboeken van studenten bekijken + feedback
   ============================================================ */

const ROL_MENTOR = 'stagementor'
const ROL_DOCENT = 'docent'
const ROL_ADMIN  = 'admin'

/* Weken + dagitems van een stage ophalen (herbruikbaar) */
async function haalWekenVanStage(stageId) {
  const [weken] = await db.query(
    `SELECT lw.id, lw.week_nummer, lw.week_start, lw.week_einde,
            lw.feedback_mentor, lw.afgecheckt_op, ls.naam AS status
     FROM logboek_week lw
     LEFT JOIN logboek_status ls ON lw.status_id = ls.id
     WHERE lw.stage_id = ?
     ORDER BY lw.week_nummer ASC`,
    [stageId]
  )
  const [items] = await db.query(
    `SELECT ldi.id, ldi.logboek_week_id, ldi.datum,
            ldi.uitgevoerde_taken, ldi.reflectie, ldi.problemen_leerpunten
     FROM logboek_dag_item ldi
     JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
     WHERE lw.stage_id = ?
     ORDER BY ldi.datum ASC`,
    [stageId]
  )

  /* Feedback per dagitem ophalen (mentor en docent samen) */
  const [feedback] = await db.query(
    `SELECT lf.logboek_dag_item_id, lf.feedback, lf.gegeven_op,
            p.voornaam, p.achternaam, p.rol
     FROM logboek_feedback lf
     JOIN logboek_dag_item ldi ON lf.logboek_dag_item_id = ldi.id
     JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
     JOIN persoon p ON lf.afzender_id = p.id
     WHERE lw.stage_id = ?
     ORDER BY lf.gegeven_op ASC`,
    [stageId]
  )

  const dagen = items.map(i => ({
    ...i,
    feedback: feedback.filter(f => f.logboek_dag_item_id === i.id)
  }))
  return weken.map(w => ({ ...w, dagen: dagen.filter(d => d.logboek_week_id === w.id) }))
}

/* Geeft de actieve stage van een student terug als de ingelogde
   mentor/docent/admin er toegang toe heeft, anders null. */
async function haalToegankelijkeStage(studentId, gebruiker) {
  const [rijen] = await db.query(
    `SELECT s.id, s.startdatum, s.einddatum, s.mentor_id, s.docent_id, b.naam AS bedrijf,
            p.voornaam, p.achternaam, o.naam AS opleiding
     FROM stage s
     JOIN bedrijf b ON s.bedrijf_id = b.id
     JOIN persoon p ON s.student_id = p.id
     LEFT JOIN student st ON st.persoon_id = p.id
     LEFT JOIN opleiding o ON st.opleiding_id = o.id
     WHERE s.student_id = ? AND s.actief = TRUE
     ORDER BY s.aangemaakt_op DESC
     LIMIT 1`,
    [studentId]
  )
  if (rijen.length === 0) return null
  const stage = rijen[0]
  if (gebruiker.rol === ROL_ADMIN) return stage
  if (gebruiker.rol === ROL_MENTOR && stage.mentor_id === gebruiker.id) return stage
  if (gebruiker.rol === ROL_DOCENT && stage.docent_id === gebruiker.id) return stage
  return null
}

/* GET /api/logboeken/studenten - studenten die deze mentor/docent opvolgt */
router.get('/studenten', controleerToken, async (req, res) => {
  const { id, rol } = req.gebruiker
  if (![ROL_MENTOR, ROL_DOCENT, ROL_ADMIN].includes(rol)) {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  try {
    let waar = 's.actief = TRUE'
    const params = []
    if (rol === ROL_MENTOR) { waar += ' AND s.mentor_id = ?'; params.push(id) }
    else if (rol === ROL_DOCENT) { waar += ' AND s.docent_id = ?'; params.push(id) }

    const [rijen] = await db.query(
      `SELECT p.id AS student_id, p.voornaam, p.achternaam,
              o.naam AS opleiding, b.naam AS bedrijf, s.id AS stage_id,
              s.startdatum, s.einddatum,
              (SELECT COUNT(DISTINCT ldi.datum) FROM logboek_dag_item ldi
                 JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
                 WHERE lw.stage_id = s.id) AS aantal_dagen_ingevuld
       FROM stage s
       JOIN persoon p ON s.student_id = p.id
       LEFT JOIN student st ON st.persoon_id = p.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON s.bedrijf_id = b.id
       WHERE ${waar}
       ORDER BY p.achternaam, p.voornaam`,
      params
    )

    for (const rij of rijen) {
      const start = new Date(rij.startdatum)
      const eind = new Date(rij.einddatum)
      let werkdagen = 0
      const d = new Date(start)
      while (d <= eind) {
        const dag = d.getDay()
        if (dag >= 1 && dag <= 5) werkdagen++
        d.setDate(d.getDate() + 1)
      }
      rij.totaal_weken = Math.max(1, Math.round(werkdagen / 5))
      delete rij.startdatum
      delete rij.einddatum
    }
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/logboeken/student/:studentId - logboek van één student (mentor/docent/admin) */
router.get('/student/:studentId', controleerToken, async (req, res) => {
  const { rol } = req.gebruiker
  if (![ROL_MENTOR, ROL_DOCENT, ROL_ADMIN].includes(rol)) {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  try {
    const stage = await haalToegankelijkeStage(req.params.studentId, req.gebruiker)
    if (!stage) return res.status(404).json({ fout: 'Geen toegankelijke stage gevonden' })
    const weken = await haalWekenVanStage(stage.id)
    res.json({
      student: { voornaam: stage.voornaam, achternaam: stage.achternaam, opleiding: stage.opleiding },
      stage: { id: stage.id, bedrijf: stage.bedrijf, startdatum: stage.startdatum, einddatum: stage.einddatum },
      weken
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken/week/:weekId/feedback - mentor geeft feedback + zet status */
router.post('/week/:weekId/feedback', controleerToken, async (req, res) => {
  const { rol, id } = req.gebruiker
  if (![ROL_MENTOR, ROL_ADMIN].includes(rol)) {
    return res.status(403).json({ fout: 'Alleen de stagementor kan feedback geven' })
  }
  const { feedback, status } = req.body
  try {
    const [rijen] = await db.query(
      `SELECT lw.id, s.mentor_id
       FROM logboek_week lw JOIN stage s ON lw.stage_id = s.id
       WHERE lw.id = ?`,
      [req.params.weekId]
    )
    if (rijen.length === 0) return res.status(404).json({ fout: 'Logboekweek niet gevonden' })
    if (rol === ROL_MENTOR && rijen[0].mentor_id !== id) {
      return res.status(403).json({ fout: 'Geen toegang tot deze logboekweek' })
    }

    /* status-naam (open/ingediend/goedgekeurd) -> id */
    let statusId = null
    if (status) {
      const [s] = await db.query('SELECT id FROM logboek_status WHERE naam = ?', [status])
      if (s.length > 0) statusId = s[0].id
    }

    await db.query(
      `UPDATE logboek_week
         SET feedback_mentor = ?,
             status_id = COALESCE(?, status_id),
             afgecheckt_op = ?
       WHERE id = ?`,
      [feedback ?? null, statusId, status === 'goedgekeurd' ? new Date() : null, req.params.weekId]
    )
    res.json({ bericht: 'Feedback opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/logboeken/dag/:itemId/feedback - docent of mentor geeft feedback op een dag */
router.post('/dag/:itemId/feedback', controleerToken, async (req, res) => {
  const { rol, id } = req.gebruiker
  if (![ROL_MENTOR, ROL_DOCENT, ROL_ADMIN].includes(rol)) {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  const { feedback } = req.body
  if (!feedback || !feedback.trim()) {
    return res.status(400).json({ fout: 'Feedback mag niet leeg zijn' })
  }
  try {
    /* Controleer dat het dagitem bij een stage van deze gebruiker hoort */
    const [rijen] = await db.query(
      `SELECT s.mentor_id, s.docent_id
       FROM logboek_dag_item ldi
       JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
       JOIN stage s ON lw.stage_id = s.id
       WHERE ldi.id = ?`,
      [req.params.itemId]
    )
    if (rijen.length === 0) return res.status(404).json({ fout: 'Logboekdag niet gevonden' })

    const stage = rijen[0]
    const magWel = rol === ROL_ADMIN ||
      (rol === ROL_MENTOR && stage.mentor_id === id) ||
      (rol === ROL_DOCENT && stage.docent_id === id)
    if (!magWel) return res.status(403).json({ fout: 'Geen toegang tot deze logboekdag' })

    await db.query(
      'INSERT INTO logboek_feedback (logboek_dag_item_id, afzender_id, feedback) VALUES (?, ?, ?)',
      [req.params.itemId, id, feedback.trim()]
    )
    res.status(201).json({ bericht: 'Feedback opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
