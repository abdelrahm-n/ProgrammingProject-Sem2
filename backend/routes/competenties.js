import express from 'express'
import db from '../db.js'
import controleerToken from '../middleware/controleerToken.js'

const router = express.Router()

/* GET /api/competenties - actieve competenties, optioneel per opleiding (?opleiding_id=) */
router.get('/', controleerToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM competentie WHERE actief = TRUE'
    const params = []
    if (req.query.opleiding_id) {
      sql += ' AND opleiding_id = ?'
      params.push(req.query.opleiding_id)
    }
    sql += ' ORDER BY naam'
    const [rijen] = await db.query(sql, params)
    res.json(rijen)
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* POST /api/competenties - voeg een nieuwe competentie toe (gewicht 1 t/m 5) */
router.post('/', controleerToken, async (req, res) => {
  const { naam, beschrijving, gewicht, opleiding_id, rubric_volledig, rubric_goed, rubric_onvoldoende } = req.body

  if (!naam || !opleiding_id) {
    return res.status(400).json({ fout: 'Naam en opleiding zijn verplicht' })
  }

  const g = Number(gewicht) || 1
  if (g < 1 || g > 5) {
    return res.status(400).json({ fout: 'Gewicht moet tussen 1 en 5 liggen' })
  }

  try {
    const [resultaat] = await db.query(
      `INSERT INTO competentie (naam, beschrijving, gewicht, opleiding_id, rubric_volledig, rubric_goed, rubric_onvoldoende, actief)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [naam, beschrijving || null, g, opleiding_id, rubric_volledig || null, rubric_goed || null, rubric_onvoldoende || null]
    )
    res.status(201).json({ id: resultaat.insertId, bericht: 'Competentie aangemaakt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* PUT /api/competenties/:id - pas een competentie aan.
   Enkel meegestuurde velden worden gewijzigd (COALESCE houdt de rest) */
router.put('/:id', controleerToken, async (req, res) => {
  const { naam, beschrijving, gewicht, actief, rubric_volledig, rubric_goed, rubric_onvoldoende } = req.body

  try {
    await db.query(
      `UPDATE competentie SET
         naam = COALESCE(?, naam),
         beschrijving = COALESCE(?, beschrijving),
         gewicht = COALESCE(?, gewicht),
         actief = COALESCE(?, actief),
         rubric_volledig = COALESCE(?, rubric_volledig),
         rubric_goed = COALESCE(?, rubric_goed),
         rubric_onvoldoende = COALESCE(?, rubric_onvoldoende)
       WHERE id = ?`,
      [
        naam ?? null,
        beschrijving ?? null,
        gewicht ?? null,
        actief === undefined ? null : actief,
        rubric_volledig ?? null,
        rubric_goed ?? null,
        rubric_onvoldoende ?? null,
        req.params.id
      ]
    )
    res.json({ bericht: 'Competentie bijgewerkt' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

/* DELETE /api/competenties/:id - competentie deactiveren (soft delete) */
router.delete('/:id', controleerToken, async (req, res) => {
  try {
    await db.query('UPDATE competentie SET actief = FALSE WHERE id = ?', [req.params.id])
    res.json({ bericht: 'Competentie verwijderd' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ fout: 'Serverfout' })
  }
})

export default router
