import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Hulpfunctie: controleer of de gebruiker een van de toegestane rollen heeft */
function controleerRol(req, res, volgende, toegestaneRollen) {
  if (!toegestaneRollen.includes(req.gebruiker.rol)) {
    res.status(403).json({ fout: 'Geen toegang voor deze rol' })
    return false
  }
  return true
}

/* Haal een stagevoorstel op en controleer of de gebruiker het mag zien.
   Studenten mogen alleen hun eigen voorstel bekijken. */
async function haalVoorstelOpMetToegang(req, res, voorstelId) {
  const [rijen] = await db.query(
    `SELECT sv.*, st.naam AS status,
            p.voornaam, p.achternaam, p.email AS student_email, s.studentnummer,
            o.naam AS opleiding,
            b.naam AS bedrijf, b.adres, b.email AS bedrijf_email, b.telefoon, b.contactpersoon,
            cb.feedback AS commissie_feedback, cb.beoordeeld_op
     FROM stagevoorstel sv
     JOIN stagevoorstel_status st ON sv.status_id = st.id
     JOIN student s ON sv.student_id = s.persoon_id
     JOIN persoon p ON s.persoon_id = p.id
     LEFT JOIN opleiding o ON s.opleiding_id = o.id
     JOIN bedrijf b ON sv.bedrijf_id = b.id
     LEFT JOIN commissie_beoordeling cb
            ON cb.id = (SELECT id FROM commissie_beoordeling
                        WHERE stagevoorstel_id = sv.id
                        ORDER BY beoordeeld_op DESC LIMIT 1)
     WHERE sv.id = ?`,
    [voorstelId]
  )

  if (rijen.length === 0) {
    res.status(404).json({ fout: 'Voorstel niet gevonden' })
    return null
  }

  const voorstel = rijen[0]

  if (req.gebruiker.rol === 'student' && voorstel.student_id !== req.gebruiker.id) {
    res.status(403).json({ fout: 'Je mag alleen je eigen stagevoorstel bekijken' })
    return null
  }

  return voorstel
}

/* Student dient een stagevoorstel in */
router.post('/', controleerToken, async (req, res) => {
  const a = req.body

  if (!a.stagebedrijf || !a.startDatum || !a.eindDatum || !a.stageopdracht) {
    return res.status(400).json({ fout: 'Bedrijf, data en opdracht zijn verplicht' })
  }

  /* Valideer dat start- en einddatum geen weekend zijn */
  const startDag = new Date(a.startDatum).getDay()
  const eindDag = new Date(a.eindDatum).getDay()
  if (startDag === 0 || startDag === 6) {
    return res.status(400).json({ fout: 'Startdatum mag geen weekenddag zijn' })
  }
  if (eindDag === 0 || eindDag === 6) {
    return res.status(400).json({ fout: 'Einddatum mag geen weekenddag zijn' })
  }

  /* Valideer dat einddatum na startdatum ligt */
  if (new Date(a.eindDatum) <= new Date(a.startDatum)) {
    return res.status(400).json({ fout: 'Einddatum moet na de startdatum liggen' })
  }

  try {
    const [bedrijf] = await db.query(
      'INSERT INTO bedrijf (naam, adres, email, telefoon) VALUES (?, ?, ?, ?)',
      [a.stagebedrijf, a.adresBedrijf || null, a.emailBedrijf || null, a.telefoonBedrijf || null]
    )

    const [status] = await db.query("SELECT id FROM stagevoorstel_status WHERE naam = 'ingediend'")

    if (status.length === 0) {
      return res.status(500).json({ fout: 'Status ingediend niet gevonden' })
    }

    const [academiejaar] = await db.query(
      'SELECT id FROM academiejaar WHERE CURDATE() BETWEEN startdatum AND einddatum LIMIT 1'
    )

    const [voorstel] = await db.query(
      `INSERT INTO stagevoorstel (student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, startdatum, einddatum, status_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.gebruiker.id,
        bedrijf.insertId,
        a.mentor_id || null,
        academiejaar.length > 0 ? academiejaar[0].id : null,
        a.stageopdracht,
        a.startDatum,
        a.eindDatum,
        status[0].id
      ]
    )

    res.status(201).json({ id: voorstel.insertId, bericht: 'Stagevoorstel ingediend' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Haal alle voorstellen van de ingelogde student op (geschiedenis) */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT sv.*, st.naam AS status,
              b.naam AS bedrijf, b.adres, b.email AS bedrijf_email, b.telefoon,
              cb.feedback
       FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN commissie_beoordeling cb ON cb.stagevoorstel_id = sv.id
         AND cb.id = (
           SELECT cb2.id FROM commissie_beoordeling cb2
           WHERE cb2.stagevoorstel_id = sv.id
           ORDER BY cb2.beoordeeld_op DESC LIMIT 1
         )
       WHERE sv.student_id = ?
       ORDER BY sv.aangemaakt_op DESC`,
      [req.gebruiker.id]
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Statistieken voor de stagecommissie: aantallen per status */
router.get('/statistieken', controleerToken, async (req, res) => {
  if (!controleerRol(req, res, null, ['stagecommissie'])) return

  try {
    const [aantallen] = await db.query(
      `SELECT st.naam AS status, COUNT(*) AS aantal
       FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
       GROUP BY st.naam`
    )

    const [totaal] = await db.query('SELECT COUNT(*) AS aantal FROM stagevoorstel')

    res.json({ aantallen, totaal: totaal[0].aantal })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Alle voorstellen (alleen stagecommissie) */
router.get('/', controleerToken, async (req, res) => {
  if (!controleerRol(req, res, null, ['stagecommissie'])) return

  try {
    const [rijen] = await db.query(
      `SELECT sv.*, st.naam AS status,
              p.voornaam, p.achternaam, p.email AS student_email, s.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf, b.adres, b.email AS bedrijf_email, b.telefoon,
              sm.functie AS mentor_functie,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam,
              aj.naam AS academiejaar
       FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
       JOIN student s ON sv.student_id = s.persoon_id
       JOIN persoon p ON s.persoon_id = p.id
       LEFT JOIN opleiding o ON s.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       LEFT JOIN academiejaar aj ON sv.academiejaar_id = aj.id
       ORDER BY sv.aangemaakt_op DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Commissie overzicht */
router.get('/overzicht', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT sv.id AS stagevoorstel_id, sv.omschrijving_opdracht, sv.startdatum, sv.einddatum, sv.aangemaakt_op,
              svs.naam AS voorstel_status,
              p.voornaam AS student_voornaam, p.achternaam AS student_achternaam, p.email AS student_email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf_naam,
              so.id AS overeenkomst_id,
              so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              os.naam AS overeenkomst_status
       FROM stagevoorstel sv
       JOIN stagevoorstel_status svs ON sv.status_id = svs.id
       JOIN student st ON sv.student_id = st.persoon_id
       JOIN persoon p ON st.persoon_id = p.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN stageovereenkomst so ON sv.id = so.stagevoorstel_id
       LEFT JOIN overeenkomst_status os ON so.status_id = os.id
       ORDER BY sv.aangemaakt_op DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Haal de actieve stage op voor de ingelogde student (dashboard) - MOET voor /:id komen */
router.get('/mijn/actief', controleerToken, async (req, res) => {
  try {
    const [stages] = await db.query(
      `SELECT stg.id AS stage_id, stg.startdatum, stg.einddatum, stg.actief,
              b.naam AS bedrijf_naam, b.adres AS bedrijf_adres, b.email AS bedrijf_email, b.telefoon AS bedrijf_telefoon,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam, sm.functie AS mentor_functie,
              dp.voornaam AS docent_voornaam, dp.achternaam AS docent_achternaam,
              so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              so.gevalideerd_op,
              os.naam AS overeenkomst_status
       FROM stage stg
       JOIN stageovereenkomst so ON stg.stageovereenkomst_id = so.id
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN bedrijf b ON stg.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON stg.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       LEFT JOIN docent d ON stg.docent_id = d.persoon_id
       LEFT JOIN persoon dp ON d.persoon_id = dp.id
       WHERE stg.student_id = ? AND stg.actief = TRUE
       ORDER BY stg.aangemaakt_op DESC
       LIMIT 1`,
      [req.gebruiker.id]
    )

    if (stages.length === 0) {
      return res.status(404).json({ fout: 'Geen actieve stage gevonden' })
    }

    const stage = stages[0]

    const vandaag = new Date()
    const startdatum = new Date(stage.startdatum)
    const einddatum = new Date(stage.einddatum)

    /* Eerste maandag op of na startdatum */
    const startDag = startdatum.getDay()
    const eersteMaandagOffset = startDag === 0 ? 1 : startDag === 1 ? 0 : (8 - startDag)
    const eersteMaandag = new Date(startdatum)
    eersteMaandag.setDate(startdatum.getDate() + eersteMaandagOffset)

    /* Laatste maandag op of vóór einddatum */
    const eindDag = einddatum.getDay()
    const laatsteMaandagOffset = eindDag === 0 ? -6 : eindDag === 1 ? 0 : -(eindDag - 1)
    const laatsteMaandag = new Date(einddatum)
    laatsteMaandag.setDate(einddatum.getDate() + laatsteMaandagOffset)

    const totaalWeken = Math.max(1, Math.round((laatsteMaandag - eersteMaandag) / (1000 * 60 * 60 * 24 * 7)) + 1)

    /* Huidig week nummer — gebaseerd op de laatste logboek_week in de DB */
    const [laatsteLogboekWeek] = await db.query(
      `SELECT lw.week_nummer, ls.naam AS status
       FROM logboek_week lw
       JOIN logboek_status ls ON lw.status_id = ls.id
       WHERE lw.stage_id = ?
       ORDER BY lw.week_nummer DESC
       LIMIT 1`,
      [stage.stage_id]
    )

    let huidigWeek = 1
    if (laatsteLogboekWeek.length > 0) {
      const laatsteWeek = laatsteLogboekWeek[0]
      if (laatsteWeek.status === 'goedgekeurd') {
        huidigWeek = Math.min(laatsteWeek.week_nummer + 1, totaalWeken)
      } else {
        huidigWeek = laatsteWeek.week_nummer
      }
    }

    const [logboekStats] = await db.query(
      `SELECT COUNT(DISTINCT lw.id) AS totaal_weken,
              SUM(CASE WHEN ls.naam = 'goedgekeurd' THEN 1 ELSE 0 END) AS ingevulde_weken
       FROM logboek_week lw
       JOIN logboek_status ls ON lw.status_id = ls.id
       WHERE lw.stage_id = ?`,
      [stage.stage_id]
    )

    const [dagItems] = await db.query(
      `SELECT COUNT(DISTINCT ldi.datum) AS totaal_dagen
       FROM logboek_dag_item ldi
       JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
       WHERE lw.stage_id = ?`,
      [stage.stage_id]
    )

    const [dagenDezeWeek] = await db.query(
      `SELECT COUNT(DISTINCT ldi.datum) AS dagen
       FROM logboek_dag_item ldi
       JOIN logboek_week lw ON ldi.logboek_week_id = lw.id
       WHERE lw.stage_id = ? AND lw.week_nummer = ?`,
      [stage.stage_id, huidigWeek]
    )

    const [evaluaties] = await db.query(
      `SELECT et.naam AS type_naam, em.datum
       FROM evaluatie_moment em
       JOIN evaluatie_type et ON em.type_id = et.id
       WHERE em.stage_id = ?
       ORDER BY em.datum`,
      [stage.stage_id]
    )

    const [feedbackWeken] = await db.query(
      `SELECT lw.week_nummer, lw.feedback_mentor
       FROM logboek_week lw
       WHERE lw.stage_id = ? AND lw.feedback_mentor IS NOT NULL AND lw.feedback_mentor != ''
       ORDER BY lw.week_nummer`,
      [stage.stage_id]
    )

    const [zelfreflectieIngediend] = await db.query(
      `SELECT COUNT(*) AS aantal
       FROM evaluatie_moment em
       JOIN evaluatie_type et ON em.type_id = et.id
       JOIN competentie_beoordeling cb ON cb.evaluatie_moment_id = em.id
       WHERE em.stage_id = ? AND et.naam = 'zelfevaluatie' AND cb.student_score IS NOT NULL AND cb.student_reflectie IS NOT NULL`,
      [stage.stage_id]
    )

    const [tussenEval] = await db.query(
      `SELECT em.datum
       FROM evaluatie_moment em
       JOIN evaluatie_type et ON em.type_id = et.id
       WHERE em.stage_id = ? AND et.naam = 'tussentijdse_evaluatie'
       LIMIT 1`,
      [stage.stage_id]
    )

    var zelfevalDatum = null
    if (tussenEval.length > 0 && tussenEval[0].datum) {
      zelfevalDatum = tussenEval[0].datum
    } else {
      var startD = new Date(stage.startdatum)
      var eindD = new Date(stage.einddatum)
      var mD = new Date(startD.getTime() + (eindD.getTime() - startD.getTime()) / 2)
      var dag = mD.getDate()
      var maand = mD.getMonth() + 1
      var jaar = mD.getFullYear()
      zelfevalDatum = jaar + '-' + String(maand).padStart(2, '0') + '-' + String(dag).padStart(2, '0')
    }
    var zelfevalDatumObj = new Date(zelfevalDatum)
    var zelfevaluatieBeschikbaar = vandaag >= zelfevalDatumObj && !zelfreflectieIngediend[0]?.aantal

    res.json({
      stage: {
        id: stage.stage_id,
        startdatum: stage.startdatum,
        einddatum: stage.einddatum,
        actief: stage.actief
      },
      bedrijf: {
        naam: stage.bedrijf_naam,
        adres: stage.bedrijf_adres,
        email: stage.bedrijf_email,
        telefoon: stage.bedrijf_telefoon
      },
      mentor: stage.mentor_voornaam ? {
        voornaam: stage.mentor_voornaam,
        achternaam: stage.mentor_achternaam,
        functie: stage.mentor_functie
      } : null,
      docent: stage.docent_voornaam ? {
        voornaam: stage.docent_voornaam,
        achternaam: stage.docent_achternaam
      } : null,
      voortgang: {
        huidig_week: huidigWeek,
        totaal_weken: totaalWeken
      },
      logboeken: {
        ingevulde_weken: logboekStats[0]?.ingevulde_weken || 0,
        totaal_dagen: dagItems[0]?.totaal_dagen || 0,
        dagen_deze_week: dagenDezeWeek[0]?.dagen || 0
      },
      evaluaties: evaluaties.map(e => ({
        type: e.type_naam,
        datum: e.datum
      })),
      feedback_weken: feedbackWeken.map(fw => ({
        week_nummer: fw.week_nummer,
        feedback: fw.feedback_mentor
      })),
      zelfevaluatie: {
        beschikbaar: !!zelfevaluatieBeschikbaar,
        deadline: zelfevalDatum
      },
      overeenkomst: {
        getekend_door_student: stage.getekend_door_student,
        getekend_door_bedrijf: stage.getekend_door_bedrijf,
        getekend_door_school: stage.getekend_door_school,
        gevalideerd_op: stage.gevalideerd_op,
        status: stage.overeenkomst_status
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Eén voorstel met alle details */
router.get('/:id', controleerToken, async (req, res) => {
  try {
    const voorstel = await haalVoorstelOpMetToegang(req, res, req.params.id)
    if (!voorstel) return
    res.json(voorstel)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Stagecommissie beoordeelt een voorstel (alleen stagecommissie) */
router.post('/:id/beoordeling', controleerToken, async (req, res) => {
  const { beslissing, feedback } = req.body

  if (!beslissing) {
    return res.status(400).json({ fout: 'Beslissing is verplicht' })
  }

  if ((beslissing === 'afgekeurd' || beslissing === 'aanpassing_vereist') && (!feedback || feedback.trim() === '')) {
    return res.status(400).json({ fout: 'Feedback is verplicht bij afkeuren of aanpassing' })
  }

  try {
    const [b] = await db.query('SELECT id FROM beslissing WHERE naam = ?', [beslissing])
    const [st] = await db.query('SELECT id FROM stagevoorstel_status WHERE naam = ?', [beslissing])

    if (b.length === 0 || st.length === 0) {
      return res.status(400).json({ fout: 'Ongeldige beslissing' })
    }

    await db.query(
      `INSERT INTO commissie_beoordeling (stagevoorstel_id, commissielid_id, beslissing_id, feedback, beoordeeld_op)
       VALUES (?, ?, ?, ?, NOW())`,
      [req.params.id, req.gebruiker.id, b[0].id, feedback || null]
    )

    await db.query('UPDATE stagevoorstel SET status_id = ?, aangepast_op = NOW() WHERE id = ?', [st[0].id, req.params.id])

    if (beslissing === 'goedgekeurd') {
      const [os] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'wacht_op_handtekeningen'")
      if (os.length > 0) {
        await db.query(
          'INSERT INTO stageovereenkomst (stagevoorstel_id, status_id) VALUES (?, ?)',
          [req.params.id, os[0].id]
        )
      }
    }

    res.json({ bericht: 'Beoordeling opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Haal alle docenten op (voor toewijzing) */
router.get('/docenten/list', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, d.vakgroep
       FROM persoon p
       JOIN docent d ON p.id = d.persoon_id
       WHERE p.actief = TRUE
       ORDER BY p.achternaam`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Haal alle mentoren op (voor toewijzing) */
router.get('/mentoren/list', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT p.id, p.voornaam, p.achternaam, p.email, sm.functie, b.naam AS bedrijf_naam
       FROM persoon p
       JOIN stagementor sm ON p.id = sm.persoon_id
       LEFT JOIN bedrijf b ON sm.bedrijf_id = b.id
       WHERE p.actief = TRUE
       ORDER BY p.achternaam`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
