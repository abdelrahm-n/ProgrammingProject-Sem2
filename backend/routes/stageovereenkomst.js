import express from "express";
import db from "../db.js";

const router = express.Router();

/* Stageovereenkomst ophalen op basis van stagevoorstel */
router.get("/:stagevoorstelId", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        so.id AS overeenkomst_id,
        so.getekend_door_student,
        so.getekend_door_bedrijf,
        so.getekend_door_school,
        so.gevalideerd_op,

        os.naam AS overeenkomst_status,

        sv.id AS stagevoorstel_id,
        sv.omschrijving_opdracht,
        sv.startdatum,
        sv.einddatum,

        student_p.voornaam AS student_voornaam,
        student_p.achternaam AS student_achternaam,
        student_p.email AS email_student,
        s.studentnummer,

        o.naam AS opleiding,

        b.naam AS bedrijf_naam,
        b.email AS email_bedrijf,
        b.telefoon AS telefoon,

        mentor_p.voornaam AS mentor_voornaam,
        mentor_p.achternaam AS mentor_achternaam,
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
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Geen stageovereenkomst gevonden voor dit stagevoorstel."
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Serverfout bij ophalen van stageovereenkomst."
    });
  }
});

/* Student ondertekent overeenkomst */
router.put("/:stagevoorstelId/onderteken-student", async (req, res) => {
  try {
    const { stagevoorstelId } = req.params;

    await db.query(
      `
      UPDATE stageovereenkomst
      SET getekend_door_student = TRUE
      WHERE stagevoorstel_id = ?
      `,
      [stagevoorstelId]
    );

    res.json({
      message: "Stageovereenkomst succesvol ondertekend door student."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Serverfout bij ondertekenen."
    });
  }
});

export default router;