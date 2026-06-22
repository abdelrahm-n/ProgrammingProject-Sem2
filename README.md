# Stageplatform

Webapplicatie voor het volledige stageproces bij EhB Toegepaste Informatica:
van stageaanvraag en goedkeuring, over de stageovereenkomst en wekelijkse
logboeken, tot de tussentijdse en finale evaluatie op competenties.

## Technologie

- **Frontend:** statische HTML, CSS en vanilla JavaScript
- **Backend:** Node.js met Express (REST API)
- **Database:** MySQL
- **Authenticatie:** JWT (JSON Web Tokens) + bcrypt-wachtwoordhashes (met zout)

## Projectstructuur

```
frontend/                Statische webapp (per rol een map)
  index.html             Stuurt door naar de loginpagina
  login.html             Inloggen met volledig e-mailadres
  reset-wachtwoord.html  Nieuw wachtwoord instellen via reset-link
  student/   docent/   mentor/   stagecommissie/   admin/
  js/                    Logica per pagina (o.a. evaluatieMatrix.js, nav.js)
  css/                   Stijlbestanden

backend/                 Node.js/Express API
  server.js              Start de server en serveert ook de frontend
  db.js                  MySQL-connectiepool
  seed.js                Zet de database op (tabellen + demodata)
  .env                   DB-gegevens, JWT_SECRET en poort
  middleware/            controleerToken.js (JWT-controle)
  routes/                auth, stages, stageovereenkomst, logboeken,
                         evaluaties, competenties, admin, docent, mentor, ...

database/
  tabellen.sql           Maakt de database en alle tabellen aan
  testdata.sql           Vult alle demodata (gebruikers, opleidingen,
                         bedrijven, competenties, een actieve stage, ...)
```

## Lokaal draaien

**Vereisten:** Node.js en een draaiende MySQL-server.

1. Stel de databasegegevens in `backend/.env` in:

   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=stage_monitoring
   DB_USER=root
   DB_PASSWORD=<jouw MySQL-wachtwoord>
   JWT_SECRET=geheim_sleutel_stageplatform
   PORT=3000
   ```

2. Installeer de afhankelijkheden en zet de database op:

   ```bash
   cd backend
   npm install
   node seed.js
   ```

   `node seed.js` voert `database/tabellen.sql` en `database/testdata.sql` uit.

3. Start de server:

   ```bash
   npm start        # of: npm run dev (met nodemon)
   ```

4. Open de app op **http://localhost:3000**.

> De backend serveert zelf de frontend. Open de app dus via
> `http://localhost:3000` en **niet** via een aparte Live Server (poort 5500),
> anders kloppen de API-aanroepen niet.

## Demo-accounts

Inloggen gebeurt met het **volledige e-mailadres**. Alle demo-accounts hebben
het wachtwoord **`demo123`**.

| Rol            | E-mail                      |
|----------------|-----------------------------|
| Administratie  | `admin@admin.ehb.be`        |
| Student        | `student@student.ehb.be`    |
| Docent         | `docent@docent.ehb.be`      |
| Stagementor    | `mentor@mentor.ehb.be`      |
| Stagecommissie | `commissie@commissie.ehb.be`|

Daarnaast zijn er nog uitgewerkte demo-gebruikers met realistische data, ook
met wachtwoord `demo123`, o.a. `amira.bensalem@student.ehb.be`,
`thomas.wouters@docent.ehb.be`, `pieter.desmedt@mentor.ehb.be`,
`katrien.lenaerts@commissie.ehb.be` en `nele.pauwels@admin.ehb.be`.

## Rollen en stageproces

- **Student** – dient een stagevoorstel in, ondertekent de overeenkomst, vult
  het logboek in en geeft zijn zelfevaluatie per competentie.
- **Administratie** – beheert gebruikers en competenties en koppelt een mentor
  en docent aan een student.
- **Stagecommissie** – beoordeelt het stagevoorstel en ondertekent de
  overeenkomst namens de hogeschool.
- **Stagementor (bedrijf)** – ondertekent de overeenkomst, checkt de logboeken
  af en evalueert de student.
- **Docent** – volgt de student op (logboeken, evaluaties) maar **tekent niet
  mee**; kan de overeenkomst wel alleen-lezen bekijken.

**Ondertekenvolgorde:** student → mentor → stagecommissie. Zodra alle partijen
getekend hebben, wordt de stage actief.

### Evaluatie

De evaluatie verloopt op **competenties** (door de admin beheerd, elk met een
gewicht van 1 t/m 5; samen 100% van de score). Per competentie geven student,
mentor en docent een score op 5 met motivering. Er is een **tussentijdse**
evaluatie (bijsturend) en een **eindevaluatie**; bij de eindevaluatie berekent
het systeem automatisch het gewogen eindcijfer zodra de docent indient.

## Hoe de data wordt opgeslagen

Alle gegevens staan in de **MySQL-database** (`stage_monitoring`), niet in
JavaScript. Belangrijkste tabellen:

- `persoon` + rol-tabellen (`student`, `docent`, `stagementor`,
  `stagecommissielid`, `administratie`)
- `bedrijf`, `opleiding`, `academiejaar`
- `stagevoorstel`, `stageovereenkomst`, `stage`
- `logboek_week`, `logboek_dag_item`, `logboek_feedback`
- `competentie`, `evaluatie_moment`, `competentie_beoordeling`
- `notificatie`

**Beveiliging:**

- Wachtwoorden worden nooit in klare tekst bewaard maar als **bcrypt-hash met
  een eigen zout per gebruiker** (`wachtwoord_hash`).
- Na het inloggen krijgt de gebruiker een **JWT-token**; beschermde routes
  controleren dat token via `middleware/controleerToken.js`.
- Gevoelige acties zijn afgeschermd per rol (bv. enkel de stagecommissie kan
  een voorstel beoordelen; ondertekenen kan enkel door de juiste partij).
