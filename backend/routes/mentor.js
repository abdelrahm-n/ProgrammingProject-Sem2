import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Controleer of de ingelogde gebruiker een stagementor is */
function isMentor(req, res, next) {
  if (req.gebruiker.rol !== 'stagementor') {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  next()
}

/* GET /api/mentor/mijn-stagiairs - haal alle stagiairs op van deze mentor */
router.get('/mijn-stagiairs', controleerToken, isMentor, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT s.id AS stage_id, s.startdatum, s.einddatum,
              sp.voornaam, sp.achternaam, sp.email,
              st.studentnummer,
              o.naam AS opleiding,
              dp.voornaam AS docent_voornaam, dp.achternaam AS docent_achternaam
       FROM stage s
       JOIN student st ON s.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       LEFT JOIN docent d ON s.docent_id = d.persoon_id
       LEFT JOIN persoon dp ON d.persoon_id = dp.id
       WHERE s.mentor_id = ? AND s.actief = TRUE
       ORDER BY sp.achternaam`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/mentor/stagiair/:studentId - haal details op van een specifieke stagiair */
router.get('/stagiair/:studentId', controleerToken, isMentor, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT s.id AS stage_id, s.startdatum, s.einddatum,
              sv.omschrijving_opdracht,
              sp.voornaam, sp.achternaam, sp.email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf_naam, b.adres, b.email AS bedrijf_email, b.telefoon
       FROM stage s
       JOIN stageovereenkomst so ON s.stageovereenkomst_id = so.id
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN student st ON s.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON s.bedrijf_id = b.id
       WHERE s.student_id = ? AND s.mentor_id = ? AND s.actief = TRUE`,
      [req.params.studentId, req.gebruiker.id]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Stagiair niet gevonden' })
    }

    res.json(rijen[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/mentor/logboeken/:stageId - haal logboeken op voor een stage (mentor view) */
router.get('/logboeken/:stageId', controleerToken, isMentor, async (req, res) => {
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

/* GET /api/mentor/logboek/:weekId - haal een specifieke logboek week op met dag items */
router.get('/logboek/:weekId', controleerToken, isMentor, async (req, res) => {
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

/* PUT /api/mentor/logboek/:weekId/feedback - mentor geeft feedback op een logboek week */
router.put('/logboek/:weekId/feedback', controleerToken, isMentor, async (req, res) => {
  const { feedback_mentor } = req.body

  try {
    const [result] = await db.query(
      'UPDATE logboek_week SET feedback_mentor = ? WHERE id = ?',
      [feedback_mentor || null, req.params.weekId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ fout: 'Logboek week niet gevonden' })
    }

    res.json({ bericht: 'Feedback opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/mentor/logboek/:weekId/afchecken - mentor checkt een week af */
router.put('/logboek/:weekId/afchecken', controleerToken, isMentor, async (req, res) => {
  try {
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

/* GET /api/mentor/evaluaties/:stageId - haal evaluaties op voor een stage (mentor view) */
router.get('/evaluaties/:stageId', controleerToken, isMentor, async (req, res) => {
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

/* ===== STAGEOVEREENKOMST MENTOR ===== */

/* GET /api/mentor/alle-stagiairs - alle overeenkomsten van deze mentor */
router.get('/alle-stagiairs', controleerToken, isMentor, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT so.id AS overeenkomst_id, so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              os.naam AS overeenkomst_status,
              sv.id AS stagevoorstel_id, sv.startdatum, sv.einddatum, sv.omschrijving_opdracht, sv.aangemaakt_op,
              svs.naam AS voorstel_status,
              sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam, sp.email AS student_email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf_naam
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN stagevoorstel_status svs ON sv.status_id = svs.id
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN student st ON sv.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       WHERE sm.persoon_id = ?
       ORDER BY sv.aangemaakt_op DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/mentor/overeenkomsten - overeenkomsten die wachten op handtekening van mentor */
router.get('/overeenkomsten', controleerToken, isMentor, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT so.id AS overeenkomst_id, so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              os.naam AS status,
              sv.id AS stagevoorstel_id, sv.startdatum, sv.einddatum, sv.omschrijving_opdracht,
              sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam, sp.email AS student_email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf_naam
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN student st ON sv.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       WHERE sm.persoon_id = ? AND so.getekend_door_student = TRUE AND so.getekend_door_bedrijf = FALSE
       ORDER BY so.aangemaakt_op DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/mentor/overeenkomst/:id - detail van een specifieke overeenkomst */
router.get('/overeenkomst/:id', controleerToken, isMentor, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT so.*, os.naam AS overeenkomst_status,
              sv.omschrijving_opdracht, sv.startdatum, sv.einddatum,
              sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam, sp.email AS student_email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf_naam, b.email AS bedrijf_email, b.telefoon AS telefoon_bedrijf, b.adres AS adres_bedrijf,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam, sm.functie AS mentor_functie
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN student st ON sv.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       JOIN persoon mp ON sm.persoon_id = mp.id
       WHERE so.id = ? AND sm.persoon_id = ?`,
      [req.params.id, req.gebruiker.id]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Overeenkomst niet gevonden' })
    }

    res.json(rijen[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/mentor/overeenkomst/:id/onderteken - mentor ondertekent als bedrijf */
router.put('/overeenkomst/:id/onderteken', controleerToken, isMentor, async (req, res) => {
  try {
    const [check] = await db.query(
      `SELECT so.getekend_door_bedrijf
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       WHERE so.id = ? AND sm.persoon_id = ?`,
      [req.params.id, req.gebruiker.id]
    )

    if (check.length === 0) {
      return res.status(404).json({ fout: 'Overeenkomst niet gevonden' })
    }

    if (check[0].getekend_door_bedrijf) {
      return res.status(400).json({ fout: 'Deze overeenkomst is al ondertekend door het bedrijf' })
    }

    await db.query(
      'UPDATE stageovereenkomst SET getekend_door_bedrijf = TRUE WHERE id = ?',
      [req.params.id]
    )

    /* Controleer of alle partijen hebben getekend en activeer de stage */
    const [alle] = await db.query(
      "SELECT getekend_door_student, getekend_door_bedrijf, getekend_door_school FROM stageovereenkomst WHERE id = ?",
      [req.params.id]
    )
    if (alle.length > 0 && alle[0].getekend_door_student && alle[0].getekend_door_bedrijf && alle[0].getekend_door_school) {
      const [status] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'volledig_getekend'")
      if (status.length > 0) {
        await db.query("UPDATE stageovereenkomst SET status_id = ? WHERE id = ?", [status[0].id, req.params.id])
      }

      const [sv] = await db.query(
        "SELECT sv.student_id, sv.bedrijf_id, sv.mentor_id, sv.startdatum, sv.einddatum FROM stageovereenkomst so JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id WHERE so.id = ?",
        [req.params.id]
      )
      const [bestaandeStage] = await db.query("SELECT id FROM stage WHERE stageovereenkomst_id = ?", [req.params.id])
      if (sv.length > 0 && bestaandeStage.length === 0) {
        const s = sv[0]
        const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
        const docentId = docent.length > 0 ? docent[0].persoon_id : null

        await db.query(
          `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [req.params.id, s.student_id, s.bedrijf_id, s.mentor_id, docentId, s.startdatum, s.einddatum]
        )

        const [gs] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'")
        if (gs.length > 0) {
          await db.query("UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE id = ?", [gs[0].id, req.params.id])
        }
      }
    }

    res.json({ bericht: 'Stageovereenkomst succesvol ondertekend door bedrijf', getekend_door_bedrijf: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout bij ondertekenen' })
  }
})

/* PUT /api/mentor/evaluatie/:evaluatieId/score - mentor geeft score per competentie */
router.put('/evaluatie/:evaluatieId/score', controleerToken, isMentor, async (req, res) => {
  const { competentie_id, mentor_score, mentor_feedback } = req.body

  if (!competentie_id || mentor_score === undefined) {
    return res.status(400).json({ fout: 'Competentie en score zijn verplicht' })
  }

  try {
    const [result] = await db.query(
      `UPDATE competentie_beoordeling
       SET mentor_score = ?, mentor_feedback = ?
       WHERE evaluatie_moment_id = ? AND competentie_id = ?`,
      [mentor_score, mentor_feedback || null, req.params.evaluatieId, competentie_id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ fout: 'Beoordeling niet gevonden' })
    }

    res.json({ bericht: 'Score opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
