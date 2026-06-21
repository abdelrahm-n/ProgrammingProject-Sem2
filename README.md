# Stageplatform

Platform voor stagebeheer bij EhB Toegepaste Informatica.

## Projectstructuur

- `frontend/` - statische HTML, CSS en JavaScript
- `backend/`  - Node.js/Express API
- `database/` - SQL scripts voor de database
  - `tabellen.sql` - maakt de database en alle tabellen aan
  - `testdata.sql` - vult alle demodata (gebruikers, opleidingen, bedrijven,
    stagevoorstellen, een actieve stage, logboeken en evaluaties)

## Database opzetten

Alle demodata staat in `database/testdata.sql` (dus in de database, niet in
JavaScript). Zet de database in één keer op met:

```bash
cd backend
npm install
node seed.js
```

`node seed.js` voert `database/tabellen.sql` en `database/testdata.sql` uit.
Pas de databasegegevens (host, gebruiker, wachtwoord) aan in `backend/.env`.

## Backend starten

```bash
cd backend
npm run dev      # of: npm start
```

De API draait standaard op http://localhost:3000.

## Frontend openen

Open de map `frontend/` met een statische webserver, bijvoorbeeld:

```bash
python -m http.server 5500 --directory frontend
```

Surf daarna naar http://localhost:5500/index.html.

## Demo-accounts

Alle demo-gebruikers hebben hetzelfde wachtwoord: **demo123**

| Rol            | E-mail                            |
|----------------|-----------------------------------|
| Student        | amira.bensalem@student.ehb.be     |
| Student        | luca.desmedt@student.ehb.be       |
| Docent         | thomas.wouters@docent.ehb.be      |
| Stagementor    | pieter.desmedt@mentor.ehb.be      |
| Stagecommissie | katrien.lenaerts@commissie.ehb.be |
| Administratie  | nele.pauwels@admin.ehb.be         |

Op de loginpagina kies je eerst je rol en typ je enkel het deel vóór de @
(bijv. `nele.pauwels`). Het domein wordt automatisch toegevoegd.

Met de knop **Snel inloggen (dev)** op de loginpagina log je via de server in
als de eerste demo-gebruiker van de gekozen rol (met een echt token).
