USE stage_monitoring;

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

INSERT INTO opleiding (id, naam, afkorting, actief) VALUES
(1, 'Toegepaste Informatica',              'TI',   TRUE),
(2, 'Multimedia en Creatieve Technologie', 'MCT',  TRUE),
(3, 'Elektronica-ICT',                     'EICT', TRUE);

INSERT INTO academiejaar (id, naam, startdatum, einddatum, actief) VALUES
(1, '2025-2026', '2025-09-15', '2026-06-30', TRUE);

INSERT INTO bedrijf (id, naam, adres, email, telefoon, contactpersoon, actief) VALUES
(1, 'iO Belgium',        'Boudewijnlaan 31, 1000 Brussel',     'hr@io-berlin.be',        '02 588 70 00', 'Pieter De Smedt',    TRUE),
(2, 'Argus Labs',        'Kanselarijstraat 19, 1000 Brussel',  'contact@arguslabs.be',   '02 777 12 45', 'Nina Claes',         TRUE),
(3, 'Zebra Systems',     'Industrieweg 88, 9000 Gent',         'jobs@zebrasystems.be',   '09 234 56 78', 'Sam Verhoeven',      TRUE),
(4, 'Treebit Technology', 'Vuurplas 44, 2140 Antwerpen',       'info@treebit.be',        '03 888 90 12', 'Leen Maes',          TRUE);

INSERT INTO persoon (id, voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES
(1,  'Amira',    'Bensalem',    'amira.bensalem@student.ehb.be',    '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'student',        TRUE),
(2,  'Luca',     'De Smedt',    'luca.desmedt@student.ehb.be',      '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'student',        TRUE),
(3,  'Sofia',    'Martins',     'sofia.martins@student.ehb.be',     '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'student',        TRUE),
(4,  'Brent',    'Van Damme',   'brent.vandamme@student.ehb.be',    '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'student',        TRUE),
(5,  'Nadia',    'Khelifi',     'nadia.khelifi@student.ehb.be',     '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'student',        TRUE),
(6,  'Thomas',   'Wouters',     'thomas.wouters@docent.ehb.be',     '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'docent',         TRUE),
(7,  'Els',      'Buyssens',    'els.buyssens@docent.ehb.be',       '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'docent',         TRUE),
(8,  'Pieter',   'De Smedt',    'pieter.desmedt@mentor.ehb.be',     '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'stagementor',    TRUE),
(9,  'Nina',     'Claes',       'nina.claes@mentor.ehb.be',         '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'stagementor',    TRUE),
(10, 'Sam',      'Verhoeven',   'sam.verhoeven@mentor.ehb.be',      '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'stagementor',    TRUE),
(11, 'Katrien',  'Lenaerts',    'katrien.lenaerts@commissie.ehb.be', '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'stagecommissie', TRUE),
(12, 'Bram',     'Govers',      'bram.govers@commissie.ehb.be',     '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'stagecommissie', TRUE),
(13, 'Nele',     'Pauwels',     'nele.pauwels@admin.ehb.be',        '$2a$10$nob6YQXhElqJgiGfpkqVDuw6wXddLC4jXKx2380obf.gr3fsyPIqO', 'admin',          TRUE);

INSERT INTO student (persoon_id, studentnummer, opleiding_id) VALUES
(1, 'r0850101', 1),
(2, 'r0850102', 1),
(3, 'r0850103', 2),
(4, 'r0850104', 3),
(5, 'r0850105', 1);

INSERT INTO docent (persoon_id, vakgroep) VALUES
(6, 'Toegepaste Informatica'),
(7, 'Multimedia en Creatieve Technologie');

INSERT INTO stagementor (persoon_id, functie, bedrijf_id) VALUES
(8,  'Software Architect',        1),
(9,  'DevOps Engineer',           2),
(10, 'Frontend Team Lead',        3);

INSERT INTO stagecommissielid (persoon_id, commissie_rol) VALUES
(11, 'Voorzitter'),
(12, 'Lid');

INSERT INTO administratie (persoon_id, dienst) VALUES
(13, 'Stagedienst');

INSERT IGNORE INTO competentie (id, opleiding_id, naam, beschrijving, gewicht, rubric_volledig, rubric_goed, rubric_onvoldoende, actief) VALUES
(1,  1, 'LO1 - Beheersing van het planningsproces',
       'De lerende professional beheerst het volledige planningsproces.',
       10,
       'De student beheerst het volledige planningsproces en maakt realistische planningen.',
       'De student kan een planning opstellen maar mist soms structuur.',
       'De student heeft moeite met plannen en maakt onrealistische planningen.',
       TRUE),
(2,  1, 'LO2 - Ontwerpen van IT-oplossingen',
       'De lerende professional ontwerpt IT-oplossingen volgens de industriestandaarden.',
       10,
       'De student ontwerpt volledige IT-oplossingen die voldoen aan industriestandaarden.',
       'De student kan een ontwerp maken maar volgt niet altijd alle standaarden.',
       'De student heeft moeite met het ontwerpen van IT-oplossingen.',
       TRUE),
(3,  1, 'LO3 - Implementatie van digitale producten',
       'De lerende professional implementeert digitale producten in een professionele omgeving.',
       10,
       'De student implementeert digitale producten zelfstandig en kwaliteitsvol.',
       'De student kan implementeren maar heeft soms begeleiding nodig.',
       'De student heeft significante moeite met implementatie.',
       TRUE),
(4,  1, 'LO4 - Integratie van technologie en infrastructuur',
       'De lerende professional integreert technologie en infrastructuur binnen een professionele omgeving.',
       10,
       'De student integreert technologie en infrastructuur foutloos en doordacht.',
       'De student kan technologie integreren maar ondervindt soms problemen.',
       'De student heeft moeite met het integreren van technologie.',
       TRUE),
(5,  1, 'LO5 - Onderzoekende houding',
       'De lerende professional hanteert een onderzoekende houding om tot innovatieve oplossingen te komen.',
       10,
       'De student hanteert een sterke onderzoekende houding en analyseert kritisch.',
       'De student onderzoekt mogelijke oplossingen maar de analyse kan verdiept worden.',
       'Er is weinig tot geen onderzoek uitgevoerd.',
       TRUE),
(6,  1, 'LO6 - Helder en transparant communiceren',
       'De lerende professional communiceert helder en transparant in een professionele omgeving.',
       10,
       'De student communiceert helder, professioneel en transparant.',
       'De communicatie is meestal duidelijk maar soms onvolledig.',
       'Communicatie ontbreekt of is onduidelijk.',
       TRUE),
(7,  1, 'LO7 - Probleemoplossend vermogen',
       'De lerende professional denkt kritisch na om problemen efficiënt en effectief op te lossen.',
       10,
       'De student analyseert problemen kritisch en werkt efficiënte oplossingen uit.',
       'De student lost problemen op maar de analyse kan verbeterd worden.',
       'Problemen worden niet of onvoldoende geanalyseerd.',
       TRUE),
(8,  1, 'LO8 - Persoonlijke ontwikkeling',
       'De lerende professional ziet persoonlijke ontwikkeling als de basis voor professionele groei.',
       10,
       'De student reflecteert actief over zijn eigen functioneren en gebruikt feedback.',
       'De student toont bereidheid om te leren maar verwerkt feedback gedeeltelijk.',
       'De student reflecteert niet over het eigen functioneren.',
       TRUE),
(9,  1, 'LO9 - Professionele attitude',
       'De lerende professional ontwikkelt een professionele attitude en handelt kwaliteitsvol.',
       10,
       'De student handelt steeds professioneel en respecteert afspraken.',
       'De student toont meestal een professionele houding maar is niet altijd consequent.',
       'De student toont onvoldoende professionele houding.',
       TRUE),
(10, 1, 'LO10 - Ondernemend handelen',
       'De lerende professional demonstreert ondernemend handelen in functie van waardecreatie.',
       10,
       'De student demonstreert sterk ondernemend handelen en creëert waarde.',
       'De student toont ondernemend handelen maar dit kan consistenter.',
       'De student toont weinig ondernemend handelen.',
       TRUE),
(11, 1, 'LO11 - Ethisch en deontologisch handelen',
       'De lerende professional handelt ethisch en deontologisch.',
       10,
       'De student handelt steeds ethisch en deontologisch correct.',
       'De student handelt meestal ethisch maar sommige situaties verdienen aandacht.',
       'De student toont onvoldoende ethisch en deontologisch handelen.',
       TRUE);

-- Zelfde competentieset voor de andere opleidingen (MCT, EICT)
INSERT INTO competentie (opleiding_id, naam, beschrijving, gewicht, rubric_volledig, rubric_goed, rubric_onvoldoende, actief)
  SELECT 2, naam, beschrijving, gewicht, rubric_volledig, rubric_goed, rubric_onvoldoende, TRUE FROM competentie WHERE opleiding_id = 1;
INSERT INTO competentie (opleiding_id, naam, beschrijving, gewicht, rubric_volledig, rubric_goed, rubric_onvoldoende, actief)
  SELECT 3, naam, beschrijving, gewicht, rubric_volledig, rubric_goed, rubric_onvoldoende, TRUE FROM competentie WHERE opleiding_id = 1;

INSERT INTO stagevoorstel
  (id, student_id, bedrijf_id, mentor_id, academiejaar_id, omschrijving_opdracht, functie, startdatum, einddatum, status_id, aangemaakt_op)
VALUES
  (1, 1, 1, 8, 1, 'Ontwikkelen van een intern HR-dashboard met React en een Node.js API.', 'Full-stack Developer',
   '2026-02-03', '2026-06-15', 3, '2025-11-20 09:00:00'),
  (2, 2, 2, 9, 1, 'Opzetten van een CI/CD-pipeline en containeriseren van microservices.', 'DevOps Engineer',
   '2026-02-10', '2026-06-19', 1, '2026-01-05 14:30:00'),
  (3, 3, 3, 10, 1, 'Bouwen van een interactieve productcatalogus met Three.js.', 'Frontend Developer',
   '2026-02-17', '2026-06-12', 5, '2026-01-10 10:00:00'),
  (4, 4, 4, NULL, 1, 'Implementeren van een IoT-sensornetwerk voor gebouwmonitoring.', 'IoT Engineer',
   '2026-02-03', '2026-05-29', 4, '2025-12-05 11:45:00'),
  (5, 5, 1, 8, 1, 'Maken van een klantportaal voor projectbeheer.', 'Junior Developer',
   '2026-03-02', '2026-06-30', 1, '2026-01-22 08:15:00');

INSERT INTO commissie_beoordeling
  (stagevoorstel_id, commissielid_id, beslissing_id, feedback, beoordeeld_op)
VALUES
  (1, 11, 1, 'Goed onderbouwd voorstel met een duidelijke opdrachtomschrijving. Goedgekeurd.', '2025-12-01 10:00:00'),
  (3, 12, 3, 'Voeg meer details toe over de technische stack en de verwachte leerdoelen.', '2026-01-12 14:30:00'),
  (4, 11, 2, 'De stageplek voldoet niet aan de eisen voor een EICT-stage. Andere plek zoeken.', '2025-12-10 09:15:00');

INSERT INTO stageovereenkomst
  (id, stagevoorstel_id, getekend_door_student, getekend_door_bedrijf, getekend_door_school, status_id, gevalideerd_door_id, gevalideerd_op, aangemaakt_op)
VALUES
  (1, 1, TRUE, TRUE, TRUE, 3, 13, '2026-01-15 11:00:00', '2025-12-01 10:05:00');

INSERT INTO stage
  (id, stageovereenkomst_id, student_id, bedrijf_id, mentor_id, docent_id, startdatum, einddatum, actief, aangemaakt_op)
VALUES
  (1, 1, 1, 1, 8, 6, '2026-02-03', '2026-06-26', TRUE, '2026-01-15 11:10:00');

-- De student heeft zijn weken ingediend; de mentor heeft nog niets goedgekeurd
-- (status 2 = 'ingediend', geen mentor-feedback of afcheck-datum).
INSERT INTO logboek_week
  (id, stage_id, week_nummer, week_start, week_einde, status_id, feedback_mentor, afgecheckt_op)
VALUES
  (1, 1, 1, '2026-02-02', '2026-02-08', 2, NULL, NULL),
  (2, 1, 2, '2026-02-09', '2026-02-15', 2, NULL, NULL);

INSERT INTO logboek_dag_item
  (id, logboek_week_id, datum, uitgevoerde_taken, reflectie, problemen_leerpunten)
VALUES
  (1, 1, '2026-02-03', 'Onboarding en kennismaking met het development team.', 'Leuke sfeer, iedereen helpt elkaar.', 'De interne tools zijn nieuw voor mij.'),
  (2, 1, '2026-02-04', 'Omgeving opgezet: Node.js, React, Docker en Git.', 'Alles draait, maar het duurde even.', 'Docker-versie conflicteerde met mijn lokale setup.'),
  (3, 1, '2026-02-05', 'Eerste React-component gebouwd voor de dashboard-pagina.', 'Begin vertrouwd te raken met de codebase.', 'Storybook was nog onbekend, maar handig.'),
  (4, 1, '2026-02-06', 'REST-api endpoints getest met Postman.', 'API-design is goed gestructureerd.', 'Authenticatie-token werd niet correct doorgegeven.'),
  (5, 1, '2026-02-07', 'Code review gedaan en eerste merge request ingediend.', 'Goede feedback gekregen van het team.', 'Ik moet nog leren om commits kleiner te houden.'),
  (6, 2, '2026-02-10', 'Grafieken toegevoegd aan het dashboard met Recharts.', 'Data visualiseren maakt het project concreet.', 'Bij grote datasets moet ik lazy loading toepassen.');

INSERT INTO logboek_feedback
  (logboek_dag_item_id, afzender_id, feedback, gegeven_op)
VALUES
  (2, 8, 'Goed dat je Docker hebt opgezet, maar check de versie-eisen in de README.', '2026-02-05 08:30:00'),
  (4, 8, 'Mooi dat je de API hebt getest. Gebruik voortaan ook Jest voor unit tests.', '2026-02-09 08:30:00');

INSERT INTO evaluatie_moment
  (id, stage_id, docent_id, mentor_id, type_id, datum, eindresultaat_score, algemene_feedback)
VALUES
  (1, 1, 6, 8, 1, '2026-04-15', NULL, NULL);

-- De student heeft zijn reflectie ingevuld; de mentor en docent hebben nog
-- niets beoordeeld (mentor_score / mentor_feedback / docent_feedback blijven leeg).
INSERT IGNORE INTO competentie_beoordeling
  (evaluatie_moment_id, competentie_id, student_reflectie, student_score, mentor_score, mentor_feedback, docent_feedback)
VALUES
  (1, 1, 'Ik plan elke dag mijn taken en gebruik Jira.', 3, NULL, NULL, NULL),
  (1, 2, 'Ik heb een dashboard ontworpen met React.', 5, NULL, NULL, NULL),
  (1, 3, 'Ik implementeer functionaliteiten in onze app.', 3, NULL, NULL, NULL),
  (1, 4, 'Ik heb Docker en Node.js opgezet voor het project.', 1, NULL, NULL, NULL);

INSERT INTO notificatie (ontvanger_id, titel, boodschap, gelezen) VALUES
(1, 'Stagevoorstel goedgekeurd',    'Je stagevoorstel bij iO Belgium werd goedgekeurd.', FALSE),
(3, 'Aanpassing vereist',           'Je stagevoorstel heeft feedback gekregen. Bekijk de details.', FALSE),
(5, 'Nieuw stagevoorstel ingediend','Je aanvraag werd succesvol ingediend en wacht op behandeling.', FALSE);
