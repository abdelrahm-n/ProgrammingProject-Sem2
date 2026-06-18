/* ============================================================
   Database opzetten en vullen met demodata.

   Run eenmalig met:  node seed.js

   Dit script voert de SQL-bestanden uit:
     1) database/tabellen.sql  (maakt de database en tabellen aan)
     2) database/testdata.sql  (vult alle demodata)

   De demodata zelf staat dus in SQL (de database), niet in
   JavaScript. Pas die aan in database/testdata.sql.
   ============================================================ */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseMap = path.join(__dirname, '..', 'database')

async function voerSqlBestandUit(verbinding, bestandsnaam) {
  const pad = path.join(databaseMap, bestandsnaam)
  const sql = fs.readFileSync(pad, 'utf8')
  await verbinding.query(sql)
  console.log('Uitgevoerd: ' + bestandsnaam)
}

async function zetDatabaseOp() {
  /* Verbinding zonder vaste database (tabellen.sql maakt ze zelf aan)
     en met multipleStatements zodat hele bestanden in één keer draaien. */
  const verbinding = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  })

  try {
    await voerSqlBestandUit(verbinding, 'tabellen.sql')
    await voerSqlBestandUit(verbinding, 'testdata.sql')
    console.log('\nDatabase klaar. Demo wachtwoord voor alle gebruikers: demo123')
  } finally {
    await verbinding.end()
  }
}

zetDatabaseOp().catch(err => {
  console.error(err)
  process.exit(1)
})
