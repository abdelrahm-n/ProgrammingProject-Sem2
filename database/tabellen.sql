-- Database tabellen voor het stageplatform

CREATE TABLE gebruikers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  naam       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  wachtwoord VARCHAR(255) NOT NULL,
  rol        ENUM('student','docent','stagecommissie','mentor','admin') NOT NULL,
  aangemaakt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  bedrijf     VARCHAR(200) NOT NULL,
  omschrijving TEXT,
  status      ENUM('ingediend','goedgekeurd','afgekeurd','actief','afgerond') DEFAULT 'ingediend',
  ingediend   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES gebruikers(id)
);

CREATE TABLE logboeken (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  datum      DATE NOT NULL,
  inhoud     TEXT NOT NULL,
  aangemaakt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES gebruikers(id)
);

CREATE TABLE evaluaties (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  beoordelaar INT NOT NULL,
  score       TINYINT CHECK (score BETWEEN 1 AND 10),
  opmerking   TEXT,
  datum       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES gebruikers(id),
  FOREIGN KEY (beoordelaar) REFERENCES gebruikers(id)
);