/* ============================================================
   Testdata voor het stageplatform
   ------------------------------------------------------------
   Alle demo-gegevens staan hier (niet in JavaScript), zodat ze
   in de database terechtkomen en overal in het project terug
   te vinden zijn.

   Demo wachtwoord voor ALLE gebruikers: demo123
   De hash hieronder is bcrypt van 'demo123'.

   Volgorde van uitvoeren:
     1) database/tabellen.sql   (maakt de tabellen)
     2) database/testdata.sql   (dit bestand, vult de data)
   ============================================================ */

USE stage_monitoring;

/* Maak bestaande data leeg zodat dit bestand herhaaldelijk kan
   draaien zonder dubbele rijen. */
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE competentie_beoordeling;
TRUNCATE TABLE evaluatie_moment;
TRUNCATE TABLE logboek_feedback;
TRUNCATE TABLE logboek_dag_item;
TRUNCATE TABLE logboek_week;
TRUNCATE TABLE document;
TRUNCATE TABLE stage;
TRUNCATE TABLE stageovereenkomst;
TRUNCATE TABLE commissie_beoordeling;
TRUNCATE TABLE stagevoorstel;
TRUNCATE TABLE notificatie;
TRUNCATE TABLE competentie;
TRUNCATE TABLE evaluatie_type;
TRUNCATE TABLE logboek_status;
TRUNCATE TABLE overeenkomst_status;
TRUNCATE TABLE beslissing;
TRUNCATE TABLE stagevoorstel_status;
TRUNCATE TABLE administratie;
TRUNCATE TABLE stagecommissielid;
TRUNCATE TABLE stagementor;
TRUNCATE TABLE docent;
TRUNCATE TABLE student;
TRUNCATE TABLE bedrijf;
TRUNCATE TABLE academiejaar;
TRUNCATE TABLE opleiding;
TRUNCATE TABLE persoon;
SET FOREIGN_KEY_CHECKS = 1;

/* ---------- LOOKUP / STATUS TABELLEN ---------- */

INSERT INTO stagevoorstel_status (id, naam, beschrijving) VALUES
(1, 'ingediend',          'De aanvraag is ingediend en wacht op behandeling'),
(2, 'in_behandeling',     'De stagecommissie bekijkt de aanvraag'),
(3, 'goedgekeurd',        'De aanvraag is goedgekeurd'),
(4, 'afgekeurd',          'De aanvraag is afgekeurd'),
(5, 'aanpassing_vereist', 'De student moet de aanvraag aanpassen en opnieuw indienen');

INSERT INTO beslissing (id, naam, beschrijving) VALUES
(1, 'goedgekeurd',        'Commissie keurt de aanvraag goed'),
(2, 'afgekeurd',          'Commissie keurt de aanvraag af'),
(3, 'aanpassing_vereist', 'Commissie vraagt een aanpassing');

INSERT INTO overeenkomst_status (id, naam, beschrijving) VALUES
(1, 'wacht_op_handtekeningen', 'Wacht tot alle partijen ondertekend hebben'),
(2, 'volledig_getekend',       'Alle partijen hebben ondertekend'),
(3, 'gevalideerd',             'De overeenkomst is gevalideerd en de stage is actief');

INSERT INTO logboek_status (id, naam, beschrijving) VALUES
(1, 'open',       'Logboekweek is nog in bewerking'),
(2, 'ingediend',  'Logboekweek is ingediend bij de mentor'),
(3, 'goedgekeurd','Logboekweek is goedgekeurd door de mentor');

INSERT INTO evaluatie_type (id, naam, beschrijving) VALUES
(1, 'tussentijdse_evaluatie', 'Evaluatie halverwege de stage'),
(2, 'eindevaluatie',          'Evaluatie op het einde van de stage'),
(3, 'zelfevaluatie',          'Zelfevaluatie door de student');

/* ---------- OPLEIDINGEN ---------- */

INSERT INTO opleiding (id, naam, afkorting, actief) VALUES
(1, 'Toegepaste Informatica',                'TI',   TRUE),
(2, 'Multimedia en Creatieve Technologie',   'MCT',  TRUE),
(3, 'Elektronica-ICT',                       'EICT', TRUE);

/* ---------- ACADEMIEJAAR ---------- */

INSERT INTO academiejaar (id, naam, startdatum, einddatum, actief) VALUES
(1, '2025-2026', '2025-09-15', '2026-06-30', TRUE);

/* ---------- BEDRIJVEN ---------- */

INSERT INTO bedrijf (id, naam, adres, email, telefoon, contactpersoon, actief) VALUES
(1, 'TechNova BV',  'Technologielaan 12, 1800 Vilvoorde',   'info@technova.be',   '02 555 12 34', 'Sara Smeets',     TRUE),
(2, 'Cronos',       'Veldkant 33, 2550 Kontich',            'hr@cronos.be',       '03 451 23 45', 'David Janssens',  TRUE),
(3, 'Codial',       'Havenlaan 86, 1000 Brussel',           'jobs@codial.be',     '02 333 44 55', 'Fatima Ouali',    TRUE),
(4, 'DataMinded',   'Vaartkom 4, 3000 Leuven',              'contact@dataminded.be','016 22 33 44', 'Wim Declercq',  TRUE);

/* ---------- PERSONEN ----------
   Wachtwoord voor iedereen: demo123 */

INSERT INTO persoon (id, voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES
/* studenten */
(1,  'Jan',      'Jansen',     'jan.jansen@student.ehb.be',     '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'student',        TRUE),
(2,  'Emma',     'Peeters',    'emma.peeters@student.ehb.be',   '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'student',        TRUE),
(3,  'Youssef',  'El Amrani',  'youssef.elamrani@student.ehb.be','$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly','student',        TRUE),
(4,  'Lotte',    'Vermeulen',  'lotte.vermeulen@student.ehb.be','$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'student',        TRUE),
(5,  'Mohammed', 'Bakkali',    'mohammed.bakkali@student.ehb.be','$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly','student',        TRUE),
/* docenten */
(6,  'Piet',     'Pieters',    'piet.pieters@docent.ehb.be',    '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'docent',         TRUE),
(7,  'Karen',    'De Wit',     'karen.dewit@docent.ehb.be',     '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'docent',         TRUE),
/* stagementoren */
(8,  'Sara',     'Smeets',     'sara.smeets@mentor.ehb.be',     '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'stagementor',    TRUE),
(9,  'David',    'Janssens',   'david.janssens@mentor.ehb.be',  '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'stagementor',    TRUE),
(10, 'Fatima',   'Ouali',      'fatima.ouali@mentor.ehb.be',    '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'stagementor',    TRUE),
/* stagecommissie */
(11, 'Tom',      'Thomas',     'tom.thomas@commissie.ehb.be',   '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'stagecommissie', TRUE),
(12, 'Nadia',    'Cools',      'nadia.cools@commissie.ehb.be',  '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'stagecommissie', TRUE),
/* administratie */
(13, 'An',       'Anthonis',   'an.anthonis@admin.ehb.be',      '$2a$10$GU7/piipSgY2nf3KQVBSpO2mo9WzSMG77zB.Hw2nSTlv73QAgdvly', 'admin',          TRUE);

/* ---------- ROLKOPPELINGEN ---------- */

INSERT INTO student (persoon_id, studentnummer, opleiding_id) VALUES
(1, 'r0840001', 1),
(2, 'r0840002', 1),
(3, 'r0840003', 2),
(4, 'r0840004', 3),
(5, 'r0840005', 1);

INSERT INTO docent (persoon_id, vakgroep) VALUES
(6, 'Toegepaste Informatica'),
(7, 'Multimedia');

INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES
(8,  'Teamlead Development', 1),
(9,  'Senior Developer',     2),
(10, 'Project Manager',      3);

INSERT INTO stagecommissielid (persoon_id, commissie_rol) VALUES
(11, 'Voorzitter'),
(12, 'Lid');

INSERT INTO administratie (persoon_id, dienst) VALUES
(13, 'Stagedienst');

/* ---------- COMPETENTIES (voor Toegepaste Informatica) ---------- */

INSERT INTO competentie (id, opleiding_id, naam, beschrijving, gewicht, actief) VALUES
(1, 1, 'Technische vaardigheden',     'Beheerst de gebruikte technologieën en tools', 3, TRUE),
(2, 1, 'Communicatie',                'Communiceert helder met team en klant',        2, TRUE),
(3, 1, 'Zelfstandigheid',             'Werkt zelfstandig en neemt initiatief',        2, TRUE),
(4, 1, 'Probleemoplossend vermogen',  'Analyseert en lost problemen doeltreffend op', 3, TRUE);

/* ============================================================
   STAGEVOORSTELLEN
   Verschillende statussen zodat de geschiedenis en de
   commissie-flow zichtbaar zijn.
   ============================================================ */

/* SV1 - Jan, oudere aanvraag die werd AFGEKEURD (geschiedenis) */
INSERT INTO stagevoorstel
  (id, student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id, aangemaakt_op)
VALUES
  (1, 1, 4, NULL, 1, 'Onderhoud van een legacy PHP-applicatie.', 'Junior Developer',
   '2026-02-02', '2026-05-29', 4, '2025-11-10 09:00:00');

/* SV2 - Jan, nieuwe aanvraag die werd GOEDGEKEURD (actieve stage) */
INSERT INTO stagevoorstel
  (id, student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id, aangemaakt_op)
VALUES
  (2, 1, 1, 8, 1, 'Ontwikkelen van een interne dashboardapplicatie in Vue.js met een Node.js backend.',
   'Full-stack Developer', '2026-02-03', '2026-06-26', 3, '2025-12-01 10:30:00');

/* SV3 - Emma, INGEDIEND (wacht op de commissie) */
INSERT INTO stagevoorstel
  (id, student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id, aangemaakt_op)
VALUES
  (3, 2, 2, 9, 1, 'Bouwen van een REST API en CI/CD-pipeline voor een microservices-platform.',
   'Backend Developer', '2026-02-10', '2026-06-19', 1, '2026-01-15 14:00:00');

/* SV4 - Youssef, AANPASSING VEREIST (met feedback) */
INSERT INTO stagevoorstel
  (id, student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id, aangemaakt_op)
VALUES
  (4, 3, 3, 10, 1, 'Ontwerpen van een mobiele app-prototype.', 'UX/UI Designer',
   '2026-02-16', '2026-06-12', 5, '2026-01-18 11:15:00');

/* SV5 - Lotte, INGEDIEND (wacht op de commissie) */
INSERT INTO stagevoorstel
  (id, student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id, aangemaakt_op)
VALUES
  (5, 4, 1, 8, 1, 'Configureren van embedded sensoren en een IoT-dashboard.', 'IoT Engineer',
   '2026-02-23', '2026-06-26', 1, '2026-01-20 08:45:00');

/* SV6 - Mohammed, AFGEKEURD (met feedback) */
INSERT INTO stagevoorstel
  (id, student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id, aangemaakt_op)
VALUES
  (6, 5, 2, 9, 1, 'Stage bij een familiebedrijf zonder duidelijke IT-opdracht.', 'Onbepaald',
   '2026-03-02', '2026-06-30', 4, '2026-01-22 16:20:00');

/* ---------- COMMISSIE BEOORDELINGEN (met feedback) ---------- */

INSERT INTO commissie_beoordeling
  (stagevoorstel_id, commissielid_id, beslissing_id, feedback, beoordeeld_op)
VALUES
  (1, 11, 2, 'De opdracht is te beperkt en bevat te weinig ontwikkelingswerk. Zoek een uitdagendere opdracht.', '2025-11-15 10:00:00'),
  (2, 11, 1, 'Sterke opdracht met een goede mix van frontend en backend. Goedgekeurd.', '2025-12-05 09:30:00'),
  (4, 12, 3, 'Voeg meer technische details toe over de gebruikte technologie en verleng de stageperiode.', '2026-01-19 13:00:00'),
  (6, 11, 2, 'De opdracht sluit onvoldoende aan bij de opleiding. Gelieve een nieuwe stageplaats te zoeken.', '2026-01-23 09:00:00');

/* ---------- STAGEOVEREENKOMST + STAGE (voor de goedgekeurde SV2) ---------- */

INSERT INTO stageovereenkomst
  (id, stagevoorstel_id, getekend_door_student, getekend_door_bedrijf, getekend_door_school, status_id, gevalideerd_door_id, gevalideerd_op, aangemaakt_op)
VALUES
  (1, 2, TRUE, TRUE, TRUE, 3, 13, '2026-01-30 10:00:00', '2025-12-05 09:35:00');

INSERT INTO stage
  (id, stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief, aangemaakt_op)
VALUES
  (1, 1, 1, 1, 8, 6, '2026-02-03', '2026-06-26', TRUE, '2026-01-30 10:05:00');

/* ============================================================
   LOGBOEK (voor de actieve stage van Jan)
   ============================================================ */

INSERT INTO logboek_week
  (id, stage_id, week_nummer, week_start, week_einde, status_id, feedback_mentor, afgecheckt_op)
VALUES
  (1, 1, 1, '2026-02-02', '2026-02-08', 3, 'Sterke eerste week, mooi initiatief genomen.', '2026-02-09 09:00:00'),
  (2, 1, 2, '2026-02-09', '2026-02-15', 2, NULL, NULL);

INSERT INTO logboek_dag_item
  (id, logboek_week_id, datum, uitgevoerde_taken, reflectie, problemen_leerpunten)
VALUES
  (1, 1, '2026-02-03', 'Onboarding, opzetten van de ontwikkelomgeving en kennismaking met het team.',
   'Veel nieuwe tools, maar de setup verliep vlot.', 'Git-workflow van het bedrijf was even wennen.'),
  (2, 1, '2026-02-04', 'Eerste user stories opgepakt en de projectstructuur bestudeerd.',
   'Begin te begrijpen hoe de codebase in elkaar zit.', 'Veel legacy-code zonder documentatie.'),
  (3, 1, '2026-02-05', 'Component voor de loginpagina gebouwd in Vue.js.',
   'Trots op mijn eerste merge request.', 'Code review gaf nuttige feedback over naamgeving.'),
  (4, 1, '2026-02-06', 'API-endpoint voor gebruikersbeheer geïmplementeerd.',
   'Backend begint logischer te voelen.', 'Foutafhandeling kostte meer tijd dan verwacht.'),
  (5, 1, '2026-02-07', 'Bugfixes en eerste demo aan de mentor gegeven.',
   'Goede week afgesloten.', 'Tijdsinschatting blijft moeilijk.'),
  (6, 2, '2026-02-10', 'Dashboardgrafieken toegevoegd met Chart.js.',
   'Visualisaties maken het project tastbaar.', 'Performance bij veel data is een aandachtspunt.');

INSERT INTO logboek_feedback
  (logboek_dag_item_id, afzender_id, feedback, gegeven_op)
VALUES
  (3, 8, 'Mooie eerste component! Let op consistente naamgeving van je props.', '2026-02-06 08:30:00'),
  (4, 8, 'Goede aanpak van de foutafhandeling, ga zo verder.', '2026-02-09 08:30:00');

/* ============================================================
   EVALUATIE (tussentijdse evaluatie voor de actieve stage)
   ============================================================ */

INSERT INTO evaluatie_moment
  (id, stage_id, docent_id, mentor_id, type_id, datum, eindresultaat_score, algemene_feedback)
VALUES
  (1, 1, 6, 8, 1, '2026-04-15', 15.50, 'Jan presteert sterk en groeit zichtbaar in zelfstandigheid.');

INSERT INTO competentie_beoordeling
  (evaluatie_moment_id, competentie_id, student_reflectie, mentor_score, mentor_feedback, docent_feedback)
VALUES
  (1, 1, 'Ik voel me steeds zekerder met Vue.js en Node.js.', 16, 'Sterke technische groei.', 'Mooie evolutie zichtbaar.'),
  (1, 2, 'Ik durf meer vragen te stellen tijdens de stand-up.', 14, 'Communiceert duidelijk.', 'Blijf actief deelnemen.'),
  (1, 3, 'Ik pak taken nu zelfstandig op.', 15, 'Werkt zelfstandig.', 'Goed initiatief.'),
  (1, 4, 'Problemen analyseer ik stap voor stap.', 16, 'Lost problemen goed op.', 'Sterk analytisch.');

/* ---------- NOTIFICATIES (demo) ---------- */

INSERT INTO notificatie (ontvanger_id, titel, boodschap, gelezen) VALUES
(1, 'Stagevoorstel goedgekeurd', 'Je stagevoorstel bij TechNova BV werd goedgekeurd.', FALSE),
(3, 'Aanpassing vereist',        'Je stagevoorstel vereist een aanpassing. Bekijk de feedback.', FALSE),
(5, 'Stagevoorstel afgekeurd',   'Je stagevoorstel werd afgekeurd. Bekijk de feedback.', FALSE);
