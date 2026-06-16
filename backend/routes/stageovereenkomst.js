import express from "express"
import db from "../db.js"
import controleerToken from "../middleware/controleerToken.js"

const router = express.Router()

// Haal stageovereenkomst op op basis van stagevoorstel ID
router.get("/:stagevoorstelId", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [rows] = await db.query(
      `
      SELECT
        so.id AS overeenkomst_id,
        so.getekend_door_student,
        so.getekend_door_bedrijf,
        so.getekend_door_school,
        so.gevalideerd_op,
        so.aangemaakt_op,

        os.naam AS overeenkomst_status,

        sv.id AS stagevoorstel_id,
        sv.omschrijving_opdracht,
        sv.startdatum,
        sv.einddatum,

        student_p.id AS student_persoon_id,
        student_p.voornaam AS student_voornaam,
        student_p.achternaam AS student_achternaam,
        student_p.email AS email_student,
        s.studentnummer,

        o.naam AS opleiding,

        b.id AS bedrijf_id,
        b.naam AS bedrijf_naam,
        b.email AS email_bedrijf,
        b.telefoon AS telefoon_bedrijf,
        b.adres AS adres_bedrijf,

        sm.persoon_id AS mentor_persoon_id,
        mentor_p.voornaam AS mentor_voornaam,
        mentor_p.achternaam AS mentor_achternaam,
        mentor_p.email AS email_mentor,
        sm.functie AS mentor_functie

      FROM stageovereenkomst so

      JOIN stagevoorstel sv
        ON so.stagevoorstel_id = sv.id

      JOIN overeenkomst_status os
        ON so.status_id = os.id

      JOIN student s
        ON sv.student_id = s.persoon_id

      JOIN persoon student_p
        ON s.persoon_id = student_p.id

      JOIN opleiding o
        ON s.opleiding_id = o.id

      JOIN bedrijf b
        ON sv.bedrijf_id = b.id

      LEFT JOIN stagementor sm
        ON sv.mentor_id = sm.persoon_id

      LEFT JOIN persoon mentor_p
        ON sm.persoon_id = mentor_p.id

      WHERE sv.id = ?
      `,
      [stagevoorstelId]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Geen stageovereenkomst gevonden voor dit stagevoorstel."
      })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Serverfout bij ophalen van stageovereenkomst."
    })
  }
})

// Haal stageovereenkomst op via student persoon ID
router.get("/student/:persoonId", async (req, res) => {
  try {
    const { persoonId } = req.params

    const [rows] = await db.query(
      `
      SELECT
        so.id AS overeenkomst_id,
        so.getekend_door_student,
        so.getekend_door_bedrijf,
        so.getekend_door_school,
        so.gevalideerd_op,
        so.aangemaakt_op,

        os.naam AS overeenkomst_status,
        os.id AS status_id,

        sv.id AS stagevoorstel_id,
        sv.omschrijving_opdracht,
        sv.functie,
        sv.startdatum,
        sv.einddatum,
        sv.status_id AS voorstel_status_id,

        vs.naam AS voorstel_status,

        student_p.id AS student_persoon_id,
        student_p.voornaam AS student_voornaam,
        student_p.achternaam AS student_achternaam,
        student_p.email AS email_student,
        s.studentnummer,

        o.naam AS opleiding,

        b.id AS bedrijf_id,
        b.naam AS bedrijf_naam,
        b.email AS email_bedrijf,
        b.telefoon AS telefoon_bedrijf,
        b.adres AS adres_bedrijf,
        b.contactpersoon AS contactpersoon_bedrijf,

        sm.persoon_id AS mentor_persoon_id,
        mentor_p.voornaam AS mentor_voornaam,
        mentor_p.achternaam AS mentor_achternaam,
        mentor_p.email AS email_mentor,
        sm.functie AS mentor_functie

      FROM stageovereenkomst so

      JOIN stagevoorstel sv
        ON so.stagevoorstel_id = sv.id

      JOIN overeenkomst_status os
        ON so.status_id = os.id

      JOIN stagevoorstel_status vs
        ON sv.status_id = vs.id

      JOIN student s
        ON sv.student_id = s.persoon_id

      JOIN persoon student_p
        ON s.persoon_id = student_p.id

      JOIN opleiding o
        ON s.opleiding_id = o.id

      JOIN bedrijf b
        ON sv.bedrijf_id = b.id

      LEFT JOIN stagementor sm
        ON sv.mentor_id = sm.persoon_id

      LEFT JOIN persoon mentor_p
        ON sm.persoon_id = mentor_p.id

      WHERE s.persoon_id = ?

      ORDER BY so.aangemaakt_op DESC
      LIMIT 1
      `,
      [persoonId]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Geen stageovereenkomst gevonden voor deze student."
      })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Serverfout bij ophalen van stageovereenkomst."
    })
  }
})

// Haal stagevoorstel status op via student persoon ID
router.get("/voorstel/:persoonId", async (req, res) => {
  try {
    const { persoonId } = req.params

    const [rows] = await db.query(
      `
      SELECT
        sv.id AS stagevoorstel_id,
        sv.status_id,
        sv.omschrijving_opdracht,
        sv.startdatum,
        sv.einddatum,
        vs.naam AS status_naam,
        b.naam AS bedrijf_naam
      FROM stagevoorstel sv
      JOIN stagevoorstel_status vs ON sv.status_id = vs.id
      JOIN bedrijf b ON sv.bedrijf_id = b.id
      WHERE sv.student_id = ?
      ORDER BY sv.aangemaakt_op DESC
      LIMIT 1
      `,
      [persoonId]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Geen stagevoorstel gevonden voor deze student."
      })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Serverfout bij ophalen van stagevoorstel."
    })
  }
})

// Student ondertekent stageovereenkomst
router.put("/:stagevoorstelId/onderteken-student", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [check] = await db.query(
      "SELECT getekend_door_student FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (check.length === 0) {
      return res.status(404).json({ message: "Stageovereenkomst niet gevonden." })
    }

    if (check[0].getekend_door_student) {
      return res.status(400).json({ message: "Je hebt deze overeenkomst al ondertekend." })
    }

    await db.query(
      "UPDATE stageovereenkomst SET getekend_door_student = TRUE WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    res.json({
      message: "Stageovereenkomst succesvol ondertekend door student.",
      getekend_door_student: true
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Serverfout bij ondertekenen." })
  }
})

// Bedrijf ondertekent stageovereenkomst
router.put("/:stagevoorstelId/onderteken-bedrijf", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [check] = await db.query(
      "SELECT getekend_door_bedrijf FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (check.length === 0) {
      return res.status(404).json({ message: "Stageovereenkomst niet gevonden." })
    }

    if (check[0].getekend_door_bedrijf) {
      return res.status(400).json({ message: "Deze overeenkomst is al ondertekend door het bedrijf." })
    }

    await db.query(
      "UPDATE stageovereenkomst SET getekend_door_bedrijf = TRUE WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    res.json({
      message: "Stageovereenkomst succesvol ondertekend door bedrijf.",
      getekend_door_bedrijf: true
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Serverfout bij ondertekenen." })
  }
})

// Hogeschool ondertekent stageovereenkomst
router.put("/:stagevoorstelId/onderteken-school", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [check] = await db.query(
      "SELECT getekend_door_school FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (check.length === 0) {
      return res.status(404).json({ message: "Stageovereenkomst niet gevonden." })
    }

    if (check[0].getekend_door_school) {
      return res.status(400).json({ message: "Deze overeenkomst is al ondertekend door de hogeschool." })
    }

    await db.query(
      "UPDATE stageovereenkomst SET getekend_door_school = TRUE WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    // Controleer of alle partijen hebben ondertekend
    const [overeenkomst] = await db.query(
      "SELECT getekend_door_student, getekend_door_bedrijf, getekend_door_school FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (overeenkomst.length > 0) {
      const o = overeenkomst[0]
      if (o.getekend_door_student && o.getekend_door_bedrijf && o.getekend_door_school) {
        // Alle partijen hebben ondertekend -> status wijzigen naar volledig_getekend
        const [status] = await db.query(
          "SELECT id FROM overeenkomst_status WHERE naam = 'volledig_getekend'"
        )
        if (status.length > 0) {
          await db.query(
            "UPDATE stageovereenkomst SET status_id = ? WHERE stagevoorstel_id = ?",
            [status[0].id, stagevoorstelId]
          )
        }
      }
    }

    res.json({
      message: "Stageovereenkomst succesvol ondertekend door hogeschool.",
      getekend_door_school: true
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Serverfout bij ondertekenen." })
  }
})

// Activeer stage (wanneer alle handtekeningen aanwezig en startdatum bereikt)
router.put("/:stagevoorstelId/activeer", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [overeenkomst] = await db.query(
      `
      SELECT
        so.getekend_door_student,
        so.getekend_door_bedrijf,
        so.getekend_door_school,
        sv.startdatum
      FROM stageovereenkomst so
      JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
      WHERE sv.id = ?
      `,
      [stagevoorstelId]
    )

    if (overeenkomst.length === 0) {
      return res.status(404).json({ message: "Stageovereenkomst niet gevonden." })
    }

    const o = overeenkomst[0]

    if (!o.getekend_door_student || !o.getekend_door_bedrijf || !o.getekend_door_school) {
      return res.status(400).json({
        message: "Niet alle partijen hebben nog ondertekend."
      })
    }

    const vandaag = new Date()
    const startdatum = new Date(o.startdatum)

    if (vandaag < startdatum) {
      return res.status(400).json({
        message: `De stage kan pas geactiveerd worden op ${startdatum.toLocaleDateString("nl-BE")}.`
      })
    }

    // Update status naar gevalideerd
    const [status] = await db.query(
      "SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'"
    )
    if (status.length > 0) {
      await db.query(
        "UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE stagevoorstel_id = ?",
        [status[0].id, stagevoorstelId]
      )
    }

    // Maak de stage aan
    const [sv] = await db.query(
      "SELECT student_id, bedrijf_id, mentor_id FROM stagevoorstel WHERE id = ?",
      [stagevoorstelId]
    )

    if (sv.length > 0) {
      const s = sv[0]
      // Zoek een docent op (voorlopig de eerste beschikbare)
      const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
      const docentId = docent.length > 0 ? docent[0].persoon_id : null

      await db.query(
        `
        INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
        SELECT so.id, sv.student_id, sv.bedrijf_id, sv.mentor_id, ?, sv.startdatum, sv.einddatum, TRUE
        FROM stageovereenkomst so
        JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
        WHERE sv.id = ?
        `,
        [docentId, stagevoorstelId]
      )
    }

    res.json({
      message: "Stage succesvol geactiveerd!",
      gevalideerd: true
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Serverfout bij activeren." })
  }
})

// Check of stage geactiveerd kan worden
router.get("/:stagevoorstelId/activeer-status", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [rows] = await db.query(
      `
      SELECT
        so.getekend_door_student,
        so.getekend_door_bedrijf,
        so.getekend_door_school,
        so.gevalideerd_op,
        os.naam AS status,
        sv.startdatum
      FROM stageovereenkomst so
      JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
      JOIN overeenkomst_status os ON so.status_id = os.id
      WHERE sv.id = ?
      `,
      [stagevoorstelId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Stageovereenkomst niet gevonden." })
    }

    const o = rows[0]
    const alleGetekend = o.getekend_door_student && o.getekend_door_bedrijf && o.getekend_door_school
    const vandaag = new Date()
    const startdatum = new Date(o.startdatum)
    const startBereikt = vandaag >= startdatum

    res.json({
      alle_getekend: alleGetekend,
      startdatum: o.startdatum,
      start_bereikt: startBereikt,
      kan_activeren: alleGetekend && startBereikt,
      gevalideerd: o.gevalideerd_op !== null,
      status: o.status
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Serverfout bij ophalen activeringsstatus." })
  }
})

export default router
