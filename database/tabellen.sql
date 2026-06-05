-- ================================================================
-- Stage Monitor — Database tabellen
-- Voer dit uit in MySQL Workbench (open bestand → bliksem ⚡)
-- ================================================================

CREATE DATABASE IF NOT EXISTS stage_monitor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE stage_monitor;

-- ── Gebruikers ────────────────────────────────────────────────────
-- Bevat alle rollen: student, docent, stagecommissie, mentor, admin
CREATE TABLE gebruikers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  voornaam    VARCHAR(100) NOT NULL,
  achternaam  VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  wachtwoord  VARCHAR(255) NOT NULL,
  rol         ENUM('student','docent','stagecommissie','mentor','admin') DEFAULT 'student',
  aangemaakt  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Stages ────────────────────────────────────────────────────────
-- Fase 1 t/m 3: indienen, beoordelen, overeenkomst
CREATE TABLE stages (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  student_id            INT NOT NULL,
  docent_id             INT,
  bedrijf_naam          VARCHAR(255) NOT NULL,
  bedrijf_adres         VARCHAR(255),
  mentor_naam           VARCHAR(200),
  mentor_email          VARCHAR(255),
  opdracht_omschrijving TEXT NOT NULL,
  start_datum           DATE NOT NULL,
  eind_datum            DATE NOT NULL,
  status                ENUM('ingediend','goedgekeurd','afgekeurd','aanpassingen_vereist','actief','afgerond') DEFAULT 'ingediend',
  commissie_feedback    TEXT,
  aangemaakt            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES gebruikers(id),
  FOREIGN KEY (docent_id)  REFERENCES gebruikers(id)
);

-- ── Logboeken ─────────────────────────────────────────────────────
-- Fase 4: dagelijkse logboeken + wekelijks aftekenen door mentor
CREATE TABLE logboeken (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  stage_id         INT NOT NULL,
  student_id       INT NOT NULL,
  datum            DATE NOT NULL,
  taken            TEXT NOT NULL,
  reflectie        TEXT,
  problemen        TEXT,
  mentor_getekend  TINYINT(1) DEFAULT 0,
  mentor_opmerking TEXT,
  docent_opmerking TEXT,
  aangemaakt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id)   REFERENCES stages(id),
  FOREIGN KEY (student_id) REFERENCES gebruikers(id)
);

-- ── Competenties ──────────────────────────────────────────────────
-- Fase 5: editeerbaar door de commissie — geen hardgecodeerde criteria
CREATE TABLE competenties (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  naam         VARCHAR(255) NOT NULL,
  omschrijving TEXT,
  gewicht      DECIMAL(4,2) DEFAULT 1.00,
  volgorde     INT          DEFAULT 0,
  actief       TINYINT(1)   DEFAULT 1
);

-- ── Evaluatiescores ───────────────────────────────────────────────
-- Fase 5: score per competentie per stage, tussentijds én finaal
-- UNIQUE zorgt dat je een bestaande score overschrijft (geen duplicaten)
CREATE TABLE evaluatie_scores (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  stage_id       INT  NOT NULL,
  competentie_id INT  NOT NULL,
  type           ENUM('tussentijds','finaal') NOT NULL,
  score          DECIMAL(4,2),
  opmerking      TEXT,
  aangemaakt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniek_score (stage_id, competentie_id, type),
  FOREIGN KEY (stage_id)       REFERENCES stages(id),
  FOREIGN KEY (competentie_id) REFERENCES competenties(id)
);

-- ================================================================
-- Testdata
-- ================================================================

-- Admin account  (wachtwoord: Admin1234)
INSERT INTO gebruikers (voornaam, achternaam, email, wachtwoord, rol) VALUES
('Admin', 'EhB', 'admin@ehb.be',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihO',
 'admin');

-- Standaard competenties (aanpasbaar via /pages/stagecommissie/competenties.html)
INSERT INTO competenties (naam, gewicht, volgorde) VALUES
  ('Technische vaardigheden',  3.00, 1),
  ('Probleemoplossend denken', 2.00, 2),
  ('Communicatie',             2.00, 3),
  ('Samenwerking',             2.00, 4),
  ('Zelfstandigheid',          2.00, 5),
  ('Professionele attitude',   1.00, 6),
  ('Leervermogen',             1.00, 7);
