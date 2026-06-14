/* Testdata voor het stageplatform - demo gebruikers met wachtwoord: demo123 */
/* De hash hieronder is bcrypt van 'demo123' */

USE stage_monitoring;

INSERT INTO gebruikers (naam, email, wachtwoord, rol) VALUES
('Jan Jansen',   'jan.jansen@student.ehb.be',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student'),
('Piet Pieters', 'piet.pieters@docent.ehb.be',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'docent'),
('Sara Smeets',  'sara.smeets@mentor.ehb.be',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'mentor'),
('Tom Thomas',   'tom.thomas@commissie.ehb.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'stagecommissie'),
('An Anthonis',  'an.anthonis@admin.ehb.be',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');
