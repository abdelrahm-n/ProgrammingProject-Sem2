import express from "express"
import db from "../db.js"
import controleerToken from "../middleware/controleerToken.js"

const router = express.Router()

/* GET /api/stageovereenkomst/mijn - haal stageovereenkomst op voor ingelogde student */
router.get("/mijn", controleerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
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
        sv.startdatum,
        sv.einddatum,
        sv.status_id AS voorstel_status_id,
        vs.naam AS voorstel_status,
        sp.id AS student_persoon_id,
        sp.voornaam AS student_voornaam,
        sp.achternaam AS student_achternaam,
        sp.email AS email_student,
        s.studentnummer,
        o.naam AS opleiding,
        b.id AS bedrijf_id,
        b.naam AS bedrijf_naam,
        b.email AS email_bedrijf,
        b.telefoon AS telefoon_bedrijf,
        b.adres AS adres_bedrijf,
        sm.persoon_id AS mentor_persoon_id,
        mp.voornaam AS mentor_voornaam,
        mp.achternaam AS mentor_achternaam,
        mp.email AS email_mentor,
        sm.functie AS mentor_functie
      FROM stageovereenkomst so
      JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
      JOIN overeenkomst_status os ON so.status_id = os.id
      JOIN stagevoorstel_status vs ON sv.status_id = vs.id
      JOIN student s ON sv.student_id = s.persoon_id
      JOIN persoon sp ON s.persoon_id = sp.id
      LEFT JOIN opleiding o ON s.opleiding_id = o.id
      JOIN bedrijf b ON sv.bedrijf_id = b.id
      LEFT JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
      LEFT JOIN persoon mp ON sm.persoon_id = mp.id
      WHERE s.persoon_id = ?
      ORDER BY so.aangemaakt_op DESC
      LIMIT 1`,
      [req.gebruiker.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ fout: "Geen stageovereenkomst gevonden" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij ophalen van stageovereenkomst" })
  }
})

/* GET /api/stageovereenkomst/commissie/wachtend - overeenkomsten wachtend op handtekening hogeschool */
router.get("/commissie/wachtend", controleerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT so.id AS overeenkomst_id, so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              os.naam AS status,
              sv.id AS stagevoorstel_id, sv.startdatum, sv.einddatum, sv.omschrijving_opdracht,
              sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam, sp.email AS student_email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf_naam,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN student st ON sv.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       WHERE so.getekend_door_student = TRUE AND so.getekend_door_bedrijf = TRUE AND so.getekend_door_school = FALSE
       ORDER BY so.aangemaakt_op DESC`
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout" })
  }
})

/* GET /api/stageovereenkomst/commissie/:id - detail overeenkomst voor commissie */
router.get("/commissie/:id", controleerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT so.*, os.naam AS overeenkomst_status,
              sv.omschrijving_opdracht, sv.startdatum, sv.einddatum,
              sp.voornaam AS student_voornaam, sp.achternaam AS student_achternaam, sp.email AS student_email,
              st.studentnummer,
              o.naam AS opleiding,
              b.naam AS bedrijf_naam, b.email AS bedrijf_email, b.telefoon AS telefoon_bedrijf,
              mp.voornaam AS mentor_voornaam, mp.achternaam AS mentor_achternaam, sm.functie AS mentor_functie
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN overeenkomst_status os ON so.status_id = os.id
       JOIN student st ON sv.student_id = st.persoon_id
       JOIN persoon sp ON st.persoon_id = sp.id
       LEFT JOIN opleiding o ON st.opleiding_id = o.id
       JOIN bedrijf b ON sv.bedrijf_id = b.id
       LEFT JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
       LEFT JOIN persoon mp ON sm.persoon_id = mp.id
       WHERE so.id = ?`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ fout: "Niet gevonden" })
    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout" })
  }
})

/* PUT /api/stageovereenkomst/commissie/:id/onderteken - commissie ondertekent als school */
router.put("/commissie/:id/onderteken", controleerToken, async (req, res) => {
  try {
    const [check] = await db.query(
      "SELECT getekend_door_school FROM stageovereenkomst WHERE id = ?",
      [req.params.id]
    )

    if (check.length === 0) return res.status(404).json({ fout: "Overeenkomst niet gevonden" })
    if (check[0].getekend_door_school) return res.status(400).json({ fout: "Al ondertekend door hogeschool" })

    await db.query("UPDATE stageovereenkomst SET getekend_door_school = TRUE WHERE id = ?", [req.params.id])

    const [overeenkomst] = await db.query(
      "SELECT getekend_door_student, getekend_door_bedrijf, getekend_door_school FROM stageovereenkomst WHERE id = ?",
      [req.params.id]
    )

    if (overeenkomst.length > 0) {
      const o = overeenkomst[0]
      if (o.getekend_door_student && o.getekend_door_bedrijf && o.getekend_door_school) {
        const [status] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'volledig_getekend'")
        if (status.length > 0) {
          await db.query("UPDATE stageovereenkomst SET status_id = ? WHERE id = ?", [status[0].id, req.params.id])
        }

        /* Activeer de stage automatisch als alle partijen hebben getekend */
        const [soData] = await db.query(
          "SELECT so.id AS so_id, sv.student_id, sv.bedrijf_id, sv.mentor_id, sv.startdatum, sv.einddatum FROM stageovereenkomst so JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id WHERE so.id = ?",
          [req.params.id]
        )
        const [bestaandeStage] = await db.query("SELECT id FROM stage WHERE stageovereenkomst_id = ?", [req.params.id])
        if (soData.length > 0 && bestaandeStage.length === 0) {
          const s = soData[0]
          const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
          const docentId = docent.length > 0 ? docent[0].persoon_id : null

          await db.query(
            `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [s.so_id, s.student_id, s.bedrijf_id, s.mentor_id, docentId, s.startdatum, s.einddatum]
          )

          const [gs] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'")
          if (gs.length > 0) {
            await db.query("UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE id = ?", [gs[0].id, req.params.id])
          }
        }
      }
    }

    res.json({ bericht: "Ondertekend door hogeschool", getekend_door_school: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout" })
  }
})

/* GET /api/stageovereenkomst/mijn/activateer - check + activeer als alle voorwaarden voldaan */
router.get("/mijn/activateer", controleerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT so.id, so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school,
              so.gevalideerd_op, sv.startdatum, sv.student_id, sv.bedrijf_id, sv.mentor_id
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       JOIN student st ON sv.student_id = st.persoon_id
       WHERE st.persoon_id = ?
       ORDER BY so.aangemaakt_op DESC LIMIT 1`,
      [req.gebruiker.id]
    )

    if (rows.length === 0) return res.status(404).json({ fout: "Geen overeenkomst gevonden" })

    const o = rows[0]
    const alleGetekend = o.getekend_door_student && o.getekend_door_bedrijf && o.getekend_door_school
    const vandaag = new Date()
    const startdatum = new Date(o.startdatum)
    const startBereikt = vandaag >= startdatum

    if (o.gevalideerd_op) {
      return res.json({ status: "actief", bericht: "Je stage is geactiveerd!" })
    }

    if (!alleGetekend) {
      return res.json({ status: "wacht_handtekeningen", bericht: "Niet alle partijen hebben nog ondertekend." })
    }

    if (!startBereikt) {
      return res.json({ status: "wacht_startdatum", bericht: "Alle partijen hebben getekend. Wacht op startdatum " + o.startdatum.toLocaleDateString("nl-BE") + "." })
    }

    /* Alle voorwaarden voldaan → activeer */
    const [status] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'")
    if (status.length > 0) {
      await db.query("UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE id = ?", [status[0].id, o.id])
    }

    const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
    const docentId = docent.length > 0 ? docent[0].persoon_id : null

    await db.query(
      `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [o.id, o.student_id, o.bedrijf_id, o.mentor_id, docentId, o.startdatum, o.startdatum]
    )

    res.json({ status: "actief", bericht: "Je stage is geactiveerd!" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout" })
  }
})

/* GET /api/stageovereenkomst/:stagevoorstelId - haal stageovereenkomst op */
router.get("/:stagevoorstelId", controleerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
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
        sp.id AS student_persoon_id,
        sp.voornaam AS student_voornaam,
        sp.achternaam AS student_achternaam,
        sp.email AS email_student,
        s.studentnummer,
        o.naam AS opleiding,
        b.id AS bedrijf_id,
        b.naam AS bedrijf_naam,
        b.email AS email_bedrijf,
        b.telefoon AS telefoon_bedrijf,
        b.adres AS adres_bedrijf,
        sm.persoon_id AS mentor_persoon_id,
        mp.voornaam AS mentor_voornaam,
        mp.achternaam AS mentor_achternaam,
        mp.email AS email_mentor,
        sm.functie AS mentor_functie
      FROM stageovereenkomst so
      JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
      JOIN overeenkomst_status os ON so.status_id = os.id
      JOIN student s ON sv.student_id = s.persoon_id
      JOIN persoon sp ON s.persoon_id = sp.id
      LEFT JOIN opleiding o ON s.opleiding_id = o.id
      JOIN bedrijf b ON sv.bedrijf_id = b.id
      LEFT JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
      LEFT JOIN persoon mp ON sm.persoon_id = mp.id
      WHERE sv.id = ?`,
      [req.params.stagevoorstelId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ fout: "Geen stageovereenkomst gevonden voor dit stagevoorstel" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij ophalen van stageovereenkomst" })
  }
})

/* GET /api/stageovereenkomst/student/:persoonId - haal stageovereenkomst op via student */
router.get("/student/:persoonId", controleerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
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
        sv.startdatum,
        sv.einddatum,
        sv.status_id AS voorstel_status_id,
        vs.naam AS voorstel_status,
        sp.id AS student_persoon_id,
        sp.voornaam AS student_voornaam,
        sp.achternaam AS student_achternaam,
        sp.email AS email_student,
        s.studentnummer,
        o.naam AS opleiding,
        b.id AS bedrijf_id,
        b.naam AS bedrijf_naam,
        b.email AS email_bedrijf,
        b.telefoon AS telefoon_bedrijf,
        b.adres AS adres_bedrijf,
        sm.persoon_id AS mentor_persoon_id,
        mp.voornaam AS mentor_voornaam,
        mp.achternaam AS mentor_achternaam,
        mp.email AS email_mentor,
        sm.functie AS mentor_functie
      FROM stageovereenkomst so
      JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
      JOIN overeenkomst_status os ON so.status_id = os.id
      JOIN stagevoorstel_status vs ON sv.status_id = vs.id
      JOIN student s ON sv.student_id = s.persoon_id
      JOIN persoon sp ON s.persoon_id = sp.id
      LEFT JOIN opleiding o ON s.opleiding_id = o.id
      JOIN bedrijf b ON sv.bedrijf_id = b.id
      LEFT JOIN stagementor sm ON sv.mentor_id = sm.persoon_id
      LEFT JOIN persoon mp ON sm.persoon_id = mp.id
      WHERE s.persoon_id = ?
      ORDER BY so.aangemaakt_op DESC
      LIMIT 1`,
      [req.params.persoonId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ fout: "Geen stageovereenkomst gevonden voor deze student" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij ophalen van stageovereenkomst" })
  }
})

/* GET /api/stageovereenkomst/voorstel/:persoonId - haal stagevoorstel status op */
router.get("/voorstel/:persoonId", controleerToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
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
      LIMIT 1`,
      [req.params.persoonId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ fout: "Geen stagevoorstel gevonden voor deze student" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij ophalen van stagevoorstel" })
  }
})

/* PUT /api/stageovereenkomst/:stagevoorstelId/onderteken-student */
router.put("/:stagevoorstelId/onderteken-student", controleerToken, async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [check] = await db.query(
      "SELECT getekend_door_student FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (check.length === 0) {
      return res.status(404).json({ fout: "Stageovereenkomst niet gevonden" })
    }

    if (check[0].getekend_door_student) {
      return res.status(400).json({ fout: "Je hebt deze overeenkomst al ondertekend" })
    }

    await db.query(
      "UPDATE stageovereenkomst SET getekend_door_student = TRUE WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    /* Controleer of alle partijen hebben getekend en activeer de stage */
    const [alle] = await db.query(
      "SELECT getekend_door_student, getekend_door_bedrijf, getekend_door_school FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )
    if (alle.length > 0 && alle[0].getekend_door_student && alle[0].getekend_door_bedrijf && alle[0].getekend_door_school) {
      const [status] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'volledig_getekend'")
      if (status.length > 0) {
        await db.query("UPDATE stageovereenkomst SET status_id = ? WHERE stagevoorstel_id = ?", [status[0].id, stagevoorstelId])
      }

      const [sv] = await db.query(
        "SELECT student_id, bedrijf_id, mentor_id, startdatum, einddatum FROM stagevoorstel WHERE id = ?",
        [stagevoorstelId]
      )
      const [bestaandeStage] = await db.query(
        "SELECT id FROM stage WHERE stageovereenkomst_id = (SELECT id FROM stageovereenkomst WHERE stagevoorstel_id = ?)",
        [stagevoorstelId]
      )
      if (sv.length > 0 && bestaandeStage.length === 0) {
        const s = sv[0]
        const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
        const docentId = docent.length > 0 ? docent[0].persoon_id : null
        const [so] = await db.query("SELECT id FROM stageovereenkomst WHERE stagevoorstel_id = ?", [stagevoorstelId])

        await db.query(
          `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [so[0].id, s.student_id, s.bedrijf_id, s.mentor_id, docentId, s.startdatum, s.einddatum]
        )

        const [gs] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'")
        if (gs.length > 0) {
          await db.query("UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE stagevoorstel_id = ?", [gs[0].id, stagevoorstelId])
        }
      }
    }

    res.json({ bericht: "Stageovereenkomst succesvol ondertekend door student", getekend_door_student: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij ondertekenen" })
  }
})

/* PUT /api/stageovereenkomst/:stagevoorstelId/onderteken-bedrijf */
router.put("/:stagevoorstelId/onderteken-bedrijf", controleerToken, async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [check] = await db.query(
      "SELECT getekend_door_bedrijf FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (check.length === 0) {
      return res.status(404).json({ fout: "Stageovereenkomst niet gevonden" })
    }

    if (check[0].getekend_door_bedrijf) {
      return res.status(400).json({ fout: "Deze overeenkomst is al ondertekend door het bedrijf" })
    }

    await db.query(
      "UPDATE stageovereenkomst SET getekend_door_bedrijf = TRUE WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    /* Controleer of alle partijen hebben getekend en activeer de stage */
    const [alle] = await db.query(
      "SELECT getekend_door_student, getekend_door_bedrijf, getekend_door_school FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )
    if (alle.length > 0 && alle[0].getekend_door_student && alle[0].getekend_door_bedrijf && alle[0].getekend_door_school) {
      const [status] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'volledig_getekend'")
      if (status.length > 0) {
        await db.query("UPDATE stageovereenkomst SET status_id = ? WHERE stagevoorstel_id = ?", [status[0].id, stagevoorstelId])
      }

      const [sv] = await db.query(
        "SELECT student_id, bedrijf_id, mentor_id, startdatum, einddatum FROM stagevoorstel WHERE id = ?",
        [stagevoorstelId]
      )
      const [bestaandeStage] = await db.query(
        "SELECT id FROM stage WHERE stageovereenkomst_id = (SELECT id FROM stageovereenkomst WHERE stagevoorstel_id = ?)",
        [stagevoorstelId]
      )
      if (sv.length > 0 && bestaandeStage.length === 0) {
        const s = sv[0]
        const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
        const docentId = docent.length > 0 ? docent[0].persoon_id : null
        const [so] = await db.query("SELECT id FROM stageovereenkomst WHERE stagevoorstel_id = ?", [stagevoorstelId])

        await db.query(
          `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [so[0].id, s.student_id, s.bedrijf_id, s.mentor_id, docentId, s.startdatum, s.einddatum]
        )

        const [gs] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'")
        if (gs.length > 0) {
          await db.query("UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE stagevoorstel_id = ?", [gs[0].id, stagevoorstelId])
        }
      }
    }

    res.json({ bericht: "Stageovereenkomst succesvol ondertekend door bedrijf", getekend_door_bedrijf: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij ondertekenen" })
  }
})

/* PUT /api/stageovereenkomst/:stagevoorstelId/onderteken-school */
router.put("/:stagevoorstelId/onderteken-school", controleerToken, async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [check] = await db.query(
      "SELECT getekend_door_school FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (check.length === 0) {
      return res.status(404).json({ fout: "Stageovereenkomst niet gevonden" })
    }

    if (check[0].getekend_door_school) {
      return res.status(400).json({ fout: "Deze overeenkomst is al ondertekend door de hogeschool" })
    }

    await db.query(
      "UPDATE stageovereenkomst SET getekend_door_school = TRUE WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    /* Controleer of alle partijen hebben ondertekend */
    const [overeenkomst] = await db.query(
      "SELECT getekend_door_student, getekend_door_bedrijf, getekend_door_school FROM stageovereenkomst WHERE stagevoorstel_id = ?",
      [stagevoorstelId]
    )

    if (overeenkomst.length > 0) {
      const o = overeenkomst[0]
      if (o.getekend_door_student && o.getekend_door_bedrijf && o.getekend_door_school) {
        const [status] = await db.query(
          "SELECT id FROM overeenkomst_status WHERE naam = 'volledig_getekend'"
        )
        if (status.length > 0) {
          await db.query(
            "UPDATE stageovereenkomst SET status_id = ? WHERE stagevoorstel_id = ?",
            [status[0].id, stagevoorstelId]
          )
        }

        /* Activeer de stage automatisch als alle partijen hebben getekend */
        const [sv] = await db.query(
          "SELECT student_id, bedrijf_id, mentor_id, startdatum, einddatum FROM stagevoorstel WHERE id = ?",
          [stagevoorstelId]
        )
        const [bestaandeStage] = await db.query(
          "SELECT id FROM stage WHERE stageovereenkomst_id = (SELECT id FROM stageovereenkomst WHERE stagevoorstel_id = ?)",
          [stagevoorstelId]
        )
        if (sv.length > 0 && bestaandeStage.length === 0) {
          const s = sv[0]
          const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
          const docentId = docent.length > 0 ? docent[0].persoon_id : null
          const [so] = await db.query("SELECT id FROM stageovereenkomst WHERE stagevoorstel_id = ?", [stagevoorstelId])

          await db.query(
            `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [so[0].id, s.student_id, s.bedrijf_id, s.mentor_id, docentId, s.startdatum, s.einddatum]
          )

          const [gs] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'")
          if (gs.length > 0) {
            await db.query(
              "UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE stagevoorstel_id = ?",
              [gs[0].id, stagevoorstelId]
            )
          }
        }
      }
    }

    res.json({ bericht: "Stageovereenkomst succesvol ondertekend door hogeschool", getekend_door_school: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij ondertekenen" })
  }
})

/* PUT /api/stageovereenkomst/:stagevoorstelId/activeer - activeer stage */
router.put("/:stagevoorstelId/activeer", controleerToken, async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [overeenkomst] = await db.query(
      `SELECT so.getekend_door_student, so.getekend_door_bedrijf, so.getekend_door_school, sv.startdatum
       FROM stageovereenkomst so
       JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
       WHERE sv.id = ?`,
      [stagevoorstelId]
    )

    if (overeenkomst.length === 0) {
      return res.status(404).json({ fout: "Stageovereenkomst niet gevonden" })
    }

    const o = overeenkomst[0]

    if (!o.getekend_door_student || !o.getekend_door_bedrijf || !o.getekend_door_school) {
      return res.status(400).json({ fout: "Niet alle partijen hebben nog ondertekend" })
    }

    const vandaag = new Date()
    const startdatum = new Date(o.startdatum)

    if (vandaag < startdatum) {
      return res.status(400).json({
        fout: `De stage kan pas geactiveerd worden op ${startdatum.toLocaleDateString("nl-BE")}`
      })
    }

    const [status] = await db.query("SELECT id FROM overeenkomst_status WHERE naam = 'gevalideerd'")
    if (status.length > 0) {
      await db.query(
        "UPDATE stageovereenkomst SET status_id = ?, gevalideerd_op = NOW() WHERE stagevoorstel_id = ?",
        [status[0].id, stagevoorstelId]
      )
    }

    /* Maak de stage aan */
    const [sv] = await db.query(
      "SELECT student_id, bedrijf_id, mentor_id FROM stagevoorstel WHERE id = ?",
      [stagevoorstelId]
    )

    if (sv.length > 0) {
      const s = sv[0]
      const [docent] = await db.query("SELECT persoon_id FROM docent LIMIT 1")
      const docentId = docent.length > 0 ? docent[0].persoon_id : null

      await db.query(
        `INSERT INTO stage (stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief)
         SELECT so.id, sv.student_id, sv.bedrijf_id, sv.mentor_id, ?, sv.startdatum, sv.einddatum, TRUE
         FROM stageovereenkomst so
         JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
         WHERE sv.id = ?`,
        [docentId, stagevoorstelId]
      )
    }

    res.json({ bericht: "Stage succesvol geactiveerd", gevalideerd: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ fout: "Serverfout bij activeren" })
  }
})

/* GET /api/stageovereenkomst/:stagevoorstelId/activeer-status */
router.get("/:stagevoorstelId/activeer-status", controleerToken, async (req, res) => {
  try {
    const { stagevoorstelId } = req.params

    const [rows] = await db.query(
      `SELECT
        so.getekend_door_student,
        so.getekend_door_bedrijf,
        so.getekend_door_school,
        so.gevalideerd_op,
        os.naam AS status,
        sv.startdatum
      FROM stageovereenkomst so
      JOIN stagevoorstel sv ON so.stagevoorstel_id = sv.id
      JOIN overeenkomst_status os ON so.status_id = os.id
      WHERE sv.id = ?`,
      [stagevoorstelId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ fout: "Stageovereenkomst niet gevonden" })
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
    res.status(500).json({ fout: "Serverfout bij ophalen activeringsstatus" })
  }
})

export default router
