import { Router } from 'express'
import db from '../db.js'
import { controleerToken, alleenRol } from '../middleware/controleerToken.js'

const router = Router()

// GET /api/evaluaties/:stageId  — scores van een stage ophalen
router.get('/:stageId', controleerToken, async (req, res) => {
  try {
    const [rijen] = await db.query(
      `SELECT e.*, c.naam AS competentie_naam, c.gewicht
       FROM evaluatie_scores e
       JOIN competenties c ON e.competentie_id = c.id
       WHERE e.stage_id = ?
       ORDER BY c.volgorde`,
      [req.params.stageId]
    )
    res.json(rijen)
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

// POST /api/evaluaties  — score opslaan (docent of mentor)
router.post('/', controleerToken, alleenRol('docent', 'mentor'), async (req, res) => {
  const { stageId, competentieId, type, score, opmerking } = req.body
  try {
    // Als er al een score bestaat voor deze combinatie: bijwerken, anders nieuw aanmaken
    await db.query(
      `INSERT INTO evaluatie_scores (stage_id, competentie_id, type, score, opmerking)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score), opmerking = VALUES(opmerking)`,
      [stageId, competentieId, type, score, opmerking || null]
    )
    res.json({ bericht: 'Score opgeslagen.' })
  } catch (err) {
    res.status(500).json({ fout: err.message })
  }
})

export default router
