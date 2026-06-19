// Eenmalige migratie: voeg student_score toe aan competentie_beoordeling.
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

const [kolommen] = await conn.query(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'competentie_beoordeling' AND COLUMN_NAME = 'student_score'`,
  [process.env.DB_NAME]
)

if (kolommen.length > 0) {
  console.log('Kolom student_score bestaat al.')
} else {
  await conn.query(
    `ALTER TABLE competentie_beoordeling
     ADD COLUMN student_score INT NULL AFTER student_reflectie`
  )
  console.log('Kolom student_score toegevoegd.')
}

await conn.end()
