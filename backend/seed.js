/* Demo gebruikers aanmaken - run eenmalig met: node seed.js */
import bcrypt from 'bcryptjs'
import db from './db.js'

const DEMO_WACHTWOORD = 'demo123'

const gebruikers = [
  { voornaam: 'Jan',   achternaam: 'Jansen',   email: 'jan.jansen@student.ehb.be',      rol: 'student'        },
  { voornaam: 'Piet',  achternaam: 'Pieters',  email: 'piet.pieters@docent.ehb.be',     rol: 'docent'         },
  { voornaam: 'Sara',  achternaam: 'Smeets',   email: 'sara.smeets@mentor.ehb.be',      rol: 'stagementor'    },
  { voornaam: 'Tom',   achternaam: 'Thomas',   email: 'tom.thomas@commissie.ehb.be',    rol: 'stagecommissie' },
  { voornaam: 'An',    achternaam: 'Anthonis',  email: 'an.anthonis@admin.ehb.be',       rol: 'admin'          }
]

async function maakDemoGebruikers() {
  const hash = await bcrypt.hash(DEMO_WACHTWOORD, 10)

  for (const g of gebruikers) {
    const [bestaand] = await db.query(
      'SELECT id FROM persoon WHERE email = ?',
      [g.email]
    )

    if (bestaand.length > 0) {
      console.log('Overgeslagen (bestaat al): ' + g.email)
      continue
    }

    const [resultaat] = await db.query(
      'INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES (?, ?, ?, ?, ?, TRUE)',
      [g.voornaam, g.achternaam, g.email, hash, g.rol]
    )

    const persoonId = resultaat.insertId

    if (g.rol === 'student') {
      await db.query(
        'INSERT INTO student (persoon_id, studentnummer, opleiding_id) VALUES (?, NULL, NULL)',
        [persoonId]
      )
    } else if (g.rol === 'docent') {
      await db.query(
        'INSERT INTO docent (persoon_id, vakgroep) VALUES (?, NULL)',
        [persoonId]
      )
    } else if (g.rol === 'stagementor') {
      await db.query(
        'INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES (?, NULL, NULL)',
        [persoonId]
      )
    } else if (g.rol === 'stagecommissie') {
      await db.query(
        'INSERT INTO stagecommissielid (persoon_id, commissie_rol) VALUES (?, NULL)',
        [persoonId]
      )
    } else if (g.rol === 'admin') {
      await db.query(
        'INSERT INTO administratie (persoon_id, dienst) VALUES (?, NULL)',
        [persoonId]
      )
    }

    console.log('Aangemaakt: ' + g.email + ' (' + g.rol + ')')
  }

  console.log('\nDemo wachtwoord voor alle gebruikers: ' + DEMO_WACHTWOORD)
  process.exit(0)
}

maakDemoGebruikers().catch(err => {
  console.error(err)
  process.exit(1)
})
