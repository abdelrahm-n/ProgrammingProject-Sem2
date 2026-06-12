/* Demo gebruikers aanmaken - run eenmalig met: node seed.js */
import bcrypt from 'bcryptjs'
import db from './db.js'

const DEMO_WACHTWOORD = 'demo123'

const gebruikers = [
  {
    voornaam: 'Jan', achternaam: 'Jansen',
    email: 'jan.jansen@student.ehb.be',
    maakRol: async (id) => {
      const [opleiding] = await db.query('SELECT id FROM opleiding LIMIT 1')
      const opleidingId = opleiding[0]?.id || null
      await db.query(
        'INSERT INTO student (persoon_id, studentnummer, opleiding_id) VALUES (?, ?, ?)',
        [id, 'TI2025001', opleidingId]
      )
    }
  },
  {
    voornaam: 'Piet', achternaam: 'Pieters',
    email: 'piet.pieters@docent.ehb.be',
    maakRol: async (id) => {
      await db.query(
        'INSERT INTO docent (persoon_id, vakgroep) VALUES (?, ?)',
        [id, 'Informatica']
      )
    }
  },
  {
    voornaam: 'Sara', achternaam: 'Smeets',
    email: 'sara.smeets@mentor.ehb.be',
    maakRol: async (id) => {
      await db.query(
        'INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, ?, NULL)',
        [id, 'Software Engineer']
      )
    }
  },
  {
    voornaam: 'Tom', achternaam: 'Thomas',
    email: 'tom.thomas@commissie.ehb.be',
    maakRol: async (id) => {
      await db.query(
        'INSERT INTO stagecommissielid (persoon_id, commissie_rol) VALUES (?, ?)',
        [id, 'Lid']
      )
    }
  },
  {
    voornaam: 'An', achternaam: 'Anthonis',
    email: 'an.anthonis@admin.ehb.be',
    maakRol: async (id) => {
      await db.query(
        'INSERT INTO administratie (persoon_id, dienst) VALUES (?, ?)',
        [id, 'Stageadministratie']
      )
    }
  }
]

async function maakDemoGebruikers() {
  const hash = await bcrypt.hash(DEMO_WACHTWOORD, 10)

  for (const g of gebruikers) {
    const [bestaand] = await db.query('SELECT id FROM persoon WHERE email = ?', [g.email])

    if (bestaand.length > 0) {
      console.log('Overgeslagen (bestaat al): ' + g.email)
      continue
    }

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES (?, ?, ?, ?, TRUE)',
      [g.voornaam, g.achternaam, g.email, hash]
    )

    await g.maakRol(resultaat.insertId)
    console.log('Aangemaakt: ' + g.email)
  }

  console.log('\nDemo wachtwoord voor alle gebruikers: ' + DEMO_WACHTWOORD)
  process.exit(0)
}

maakDemoGebruikers().catch(err => {
  console.error(err)
  process.exit(1)
})
