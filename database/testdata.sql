/* Testdata voor het stageplatform - demo gebruikers met wachtwoord: demo123 */
/* De hash hieronder is bcrypt van 'demo123' */

USE stage_monitoring;

INSERT INTO persoon (voornaam, achternaam, email, wachtwoord_hash, rol, actief) VALUES
('Jan',   'Jansen',   'jan.jansen@student.ehb.be',     '$2a$10$0V0mfYPp/RvHvfcuUzmE6.QB66A.MICQMmASTNrx5o9PzZvuiUQze', 'student',        TRUE),
('Piet',  'Pieters',  'piet.pieters@docent.ehb.be',    '$2a$10$0V0mfYPp/RvHvfcuUzmE6.QB66A.MICQMmASTNrx5o9PzZvuiUQze', 'docent',         TRUE),
('Sara',  'Smeets',   'sara.smeets@mentor.ehb.be',     '$2a$10$0V0mfYPp/RvHvfcuUzmE6.QB66A.MICQMmASTNrx5o9PzZvuiUQze', 'stagementor',    TRUE),
('Tom',   'Thomas',   'tom.thomas@commissie.ehb.be',   '$2a$10$0V0mfYPp/RvHvfcuUzmE6.QB66A.MICQMmASTNrx5o9PzZvuiUQze', 'stagecommissie', TRUE),
('An',    'Anthonis', 'an.anthonis@admin.ehb.be',      '$2a$10$0V0mfYPp/RvHvfcuUzmE6.QB66A.MICQMmASTNrx5o9PzZvuiUQze', 'admin',          TRUE);
