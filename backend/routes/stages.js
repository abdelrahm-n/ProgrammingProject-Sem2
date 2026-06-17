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

  try {
    const [bedrijf] = await db.query(
      'INSERT INTO bedrijf (naam, adres, email, telefoon, contactpersoon) VALUES (?, ?, ?, ?, ?)',
      [a.stagebedrijf, a.adresBedrijf, a.emailBedrijf, a.telefoonBedrijf, a.contactPersoon || null]
    )

    const [status] = await db.query("SELECT id FROM stagevoorstel_status WHERE naam = 'ingediend'")

    const [jaar] = await db.query("SELECT id FROM academiejaar WHERE actief = TRUE ORDER BY id DESC LIMIT 1")
    const academiejaarId = jaar.length > 0 ? jaar[0].id : null

    const [voorstel] = await db.query(
      `INSERT INTO stagevoorstel (student_id, bedrijf_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.gebruiker.id, bedrijf.insertId, academiejaarId, a.stageopdracht, a.functie || null, a.startDatum, a.eindDatum, status[0].id]
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
              b.naam AS bedrijf, b.adres, b.email AS bedrijf_email, b.telefoon, b.contactpersoon,
              cb.feedback AS commissie_feedback,
              cb.beoordeeld_op
       FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN commissie_beoordeling cb
              ON cb.id = (SELECT id FROM commissie_beoordeling
                          WHERE stagevoorstel_id = sv.id
                          ORDER BY beoordeeld_op DESC LIMIT 1)
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
              p.voornaam, p.achternaam, s.studentnummer,
              b.naam AS bedrijf
       FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
       JOIN student s ON sv.student_id = s.persoon_id
       JOIN persoon p ON s.persoon_id = p.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       ORDER BY sv.aangemaakt_op DESC`
    )
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Eén voorstel met alle details (student ziet alleen eigen voorstel) */
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
  if (!controleerRol(req, res, null, ['stagecommissie'])) return

  const { beslissing, feedback } = req.body

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

    await db.query('UPDATE stagevoorstel SET status_id = ? WHERE id = ?', [st[0].id, req.params.id])

    if (beslissing === 'goedgekeurd') {
      const [os] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'wacht_op_handtekeningen'")
      await db.query(
        'INSERT INTO stageovereenkomst (stagevoorstel_id, status_id) VALUES (?, ?)',
        [req.params.id, os[0].id]
      )
    }

    res.json({ bericht: 'Beoordeling opgeslagen' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
