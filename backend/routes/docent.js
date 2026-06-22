import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Controleer of de ingelogde gebruiker een docent is */
function isDocent(req, res, next) {
  if (req.gebruiker.rol !== 'docent') {
    return res.status(403).json({ fout: 'Geen toegang' })
  }
  next()
}

/* GET /api/docent/mijn-studenten - haal studenten op die aan deze docent toegewezen zijn */
router.get('/mijn-studenten', controleerToken, isDocent, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT s.id AS stage_id, st.persoon_id AS student_id, s.startdatum, s.einddatum,
              sp.voornaam, sp.achternaam, sp.email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam,
              (SELECT SUM(cb.mentor_score)
                 FROM competentie_beoordeling cb
                 JOIN evaluatie_moment em ON cb.evaluatie_moment_id = em.id
                 WHERE em.stage_id = s.id) AS totaalscore
       FROM stage s
       JOIN student st ON s.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON s.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON s.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       WHERE s.docent_id = ? AND s.actief = TRUE
       ORDER BY sp.achternaam`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/docent/overeenkomsten - alleen-lezen overzicht van de stageovereenkomsten
   van de studenten van deze docent. De docent tekent NIET; hij kan enkel inspecteren
   of de aanvraag gelukt is (mentor + commissie tekenen). */
router.get('/overeenkomsten', controleerToken, isDocent, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT so.id AS overeenkomst_id,
              so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              so.gevalideerd_op,
              os.naam AS status,
              sv.startdatum, sv.einddatum, sv.omschrijving_opdracht,
              sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam,
              b.naam AS bedrijf_naam,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN student st ON sv.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       WHERE sv.docent_id = ?
          OR EXISTS (SELECT 1 FROM stage s WHERE s.stageovereenkomst_id = so.id AND s.docent_id = ?)
       ORDER BY so.aangemaakt_op DESC`,
      [req.gebruiker.id, req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/docent/student/:studentId/stages - haal alle stages op voor een specifieke student */
router.get('/student/:studentId/stages', controleerToken, isDocent, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT s.id, s.startdatum, s.einddatum, s.actief,
              sv.omschrijving_opdracht,
              b.naam AS bedrijf,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam
       FROM stage s
       JOIN stageovereenkomst so ON s.stageovereenkomst_id = so.id
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN bedrijf b ON s.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON s.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       WHERE s.student_id = ?
       ORDER BY s.aangemaakt_op DESC`,
      [req.params.studentId]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* GET /api/docent/logboeken/:stageId - haal logboeken op voor een stage (docent view) */
router.get('/logboeken/:stageId', controleerToken, isDocent, async (req, res) => {
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

/* GET /api/docent/logboek/:weekId - haal een specifieke logboek week op met dag items */
router.get('/logboek/:weekId', controleerToken, isDocent, async (req, res) => {
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

/* PUT /api/docent/logboek/:weekId/feedback - docent geeft feedback op een logboek week */
router.put('/logboek/:weekId/feedback', controleerToken, isDocent, async (req, res) => {
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

/* GET /api/docent/evaluaties/:stageId - haal evaluaties op voor een stage (docent view) */
router.get('/evaluaties/:stageId', controleerToken, isDocent, async (req, res) => {
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

export default router
