/* Demo gebruikers aanmaken - run eenmalig met: node seed.js */
import bcrypt from 'bcryptjs'
import db from './db.js'

const DEMO_WACHTWOORD = 'demo123'

/* Lijst van demo gebruikers met hun rollen */
const gebruikers = [
  { naam: 'Jan Jansen',    email: 'jan.jansen@student.ehb.be',      rol: 'student'         },
  { naam: 'Piet Pieters',  email: 'piet.pieters@docent.ehb.be',     rol: 'docent'          },
  { naam: 'Sara Smeets',   email: 'sara.smeets@mentor.ehb.be',      rol: 'mentor'          },
  { naam: 'Tom Thomas',    email: 'tom.thomas@commissie.ehb.be',    rol: 'stagecommissie'  },
  { naam: 'An Anthonis',   email: 'an.anthonis@admin.ehb.be',       rol: 'admin'           }
]

async function maakDemoGebruikers() {
  const hash = await bcrypt.hash(DEMO_WACHTWOORD, 10)

  for (const g of gebruikers) {
    /* Controleer of de gebruiker al bestaat */
    const [bestaand] = await db.query(
      'SELECT id FROM gebruikers WHERE email = ?',
      [g.email]
    )

    if (bestaand.length > 0) {
      console.log('Overgeslagen (bestaat al): ' + g.email)
      continue
    }

    /* Voeg de gebruiker toe aan de tabel */
    await db.query(
      'INSERT INTO gebruikers (naam, email, wachtwoord, rol) VALUES (?, ?, ?, ?)',
      [g.naam, g.email, hash, g.rol]
    )

    console.log('Aangemaakt: ' + g.email + ' (' + g.rol + ')')
  }

  console.log('\nDemo wachtwoord voor alle gebruikers: ' + DEMO_WACHTWOORD)
  process.exit(0)
}

maakDemoGebruikers().catch(err => {
  console.error(err)
  process.exit(1)
})
