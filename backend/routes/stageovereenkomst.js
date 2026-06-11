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
        sv.student_naam,
        sv.studentnummer,
        sv.opleiding,
        sv.email_student,
        sv.bedrijf_naam,
        sv.contactpersoon,
        sv.email_bedrijf,
        sv.telefoon,
        sv.startdatum,
        sv.einddatum,
        sv.stageopdracht,
        sv.functie

      FROM stageovereenkomst so
      JOIN stagevoorstel sv 
        ON so.stagevoorstel_id = sv.id
      JOIN overeenkomst_status os
        ON so.status_id = os.id
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