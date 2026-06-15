import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* Student dient een stagevoorstel in */
router.post('/', controleerToken, async (req, res) => {
  const a = req.body

  try {
    /* Maak eerst het bedrijf aan */
    const [bedrijf] = await db.query(
      'INSERT INTO bedrijf (naam, adres, email, telefoon) VALUES (?, ?, ?, ?)',
      [a.stagebedrijf, a.adresBedrijf, a.emailBedrijf, a.telefoonBedrijf]
    )

    /* Zoek de status "ingediend" op */
    const [status] = await db.query("SELECT id FROM stagevoorstel_status WHERE naam = 'ingediend'")

    /* Maak het stagevoorstel aan */
    const [voorstel] = await db.query(
      `INSERT INTO stagevoorstel (student_id, bedrijf_id, omschrijving_opdracht, startdatum, einddatum, status_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.gebruiker.id, bedrijf.insertId, a.stageopdracht, a.startDatum, a.eindDatum, status[0].id]
    )

    res.status(201).json({ id: voorstel.insertId, bericht: 'Stagevoorstel ingediend' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Voorstellen van de ingelogde student */
router.get('/mijn', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT sv.*, st.naam AS status
       FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
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

/* Alle voorstellen voor de stagecommissie */
router.get('/', controleerToken, async (req, res) => {
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

/* Eén voorstel met alle details */
router.get('/:id', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT sv.*, st.naam AS status,
              p.voornaam, p.achternaam, p.email AS student_email, s.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf, b.adres, b.email AS bedrijf_email, b.telefoon
       FROM stagevoorstel sv
       JOIN stagevoorstel_status st ON sv.status_id = st.id
       JOIN student s ON sv.student_id = s.persoon_id
       JOIN persoon p ON s.persoon_id = p.id
       LEFT JOIN opleiding o ON s.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       WHERE sv.id = ?`,
      [req.params.id]
    )

    if (rijen.length === 0) {
      return res.status(404).json({ fout: 'Voorstel niet gevonden' })
    }

    res.json(rijen[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* Stagecommissie beoordeelt een voorstel */
router.post('/:id/beoordeling', controleerToken, async (req, res) => {
  /* beslissing = goedgekeurd, afgekeurd of aanpassing_vereist */
  const { beslissing, feedback } = req.body

  try {
    /* De beslissing en de nieuwe status hebben dezelfde naam */
    const [b] = await db.query('SELECT id FROM beslissing WHERE naam = ?', [beslissing])
    const [st] = await db.query('SELECT id FROM stagevoorstel_status WHERE naam = ?', [beslissing])

    if (b.length === 0 || st.length === 0) {
      return res.status(400).json({ fout: 'Ongeldige beslissing' })
    }

    /* Bewaar de beoordeling van de commissie */
    await db.query(
      `INSERT INTO commissie_beoordeling (stagevoorstel_id, commissielid_id, beslissing_id, feedback, beoordeeld_op)
       VALUES (?, ?, ?, ?, NOW())`,
      [req.params.id, req.gebruiker.id, b[0].id, feedback || null]
    )

    /* Pas de status van het voorstel aan */
    await db.query('UPDATE stagevoorstel SET status_id = ? WHERE id = ?', [st[0].id, req.params.id])

    /* Bij goedkeuring meteen een lege overeenkomst aanmaken */
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
