DROP DATABASE IF EXISTS stage_monitoring;

CREATE DATABASE stage_monitoring
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE stage_monitoring;


-- BASIS TABELLEN

CREATE TABLE persoon (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voornaam VARCHAR(100),
    achternaam VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    wachtwoord_hash VARCHAR(255),
    rol VARCHAR(50),
    actief BOOLEAN DEFAULT TRUE
);

CREATE TABLE opleiding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(100),
    afkorting VARCHAR(20),
    actief BOOLEAN DEFAULT TRUE
);

CREATE TABLE academiejaar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(20),
    startdatum DATE,
    einddatum DATE,
    actief BOOLEAN DEFAULT TRUE
);

CREATE TABLE bedrijf (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(150),
    adres VARCHAR(255),
    email VARCHAR(255),
    telefoon VARCHAR(50),
    contactpersoon VARCHAR(150),
    actief BOOLEAN DEFAULT TRUE
);

-- ROLLEN

CREATE TABLE student (
    persoon_id INT PRIMARY KEY,
    studentnummer VARCHAR(50) UNIQUE,
    opleiding_id INT,

    FOREIGN KEY (persoon_id)
        REFERENCES persoon(id),

    FOREIGN KEY (opleiding_id)
        REFERENCES opleiding(id)
);

CREATE TABLE docent (
    persoon_id INT PRIMARY KEY,
    vakgroep VARCHAR(100),

    FOREIGN KEY (persoon_id)
        REFERENCES persoon(id)
);

CREATE TABLE stagementor (
    persoon_id INT PRIMARY KEY,
    functie VARCHAR(100),
    bedrijf_id INT,

    FOREIGN KEY (persoon_id)
        REFERENCES persoon(id),

    FOREIGN KEY (bedrijf_id)
        REFERENCES bedrijf(id)
);

CREATE TABLE stagecommissielid (
    persoon_id INT PRIMARY KEY,
    commissie_rol VARCHAR(100),

    FOREIGN KEY (persoon_id)
        REFERENCES persoon(id)
);

CREATE TABLE administratie (
    persoon_id INT PRIMARY KEY,
    dienst VARCHAR(100),

    FOREIGN KEY (persoon_id)
        REFERENCES persoon(id)
);

-- STATUS TABELLEN

CREATE TABLE stagevoorstel_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(50) UNIQUE,
    beschrijving TEXT
);

CREATE TABLE beslissing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(50) UNIQUE,
    beschrijving TEXT
);

CREATE TABLE overeenkomst_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    naam VARCHAR(50) UNIQUE,
    beschrijving TEXT
);

-- STAGEVOORSTEL

CREATE TABLE stagevoorstel (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT,
    bedrijf_id INT,
    mentor_id INT,
    docent_id INT,
    academiejaar_id INT,

    omschrijving_opdracht TEXT,
    functie VARCHAR(150),

    startdatum DATE,
    einddatum DATE,

    status_id INT,

    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aangepast_op TIMESTAMP NULL,

    FOREIGN KEY (student_id)
        REFERENCES student(persoon_id),

    FOREIGN KEY (bedrijf_id)
        REFERENCES bedrijf(id),

    FOREIGN KEY (mentor_id)
        REFERENCES stagementor(persoon_id),

    FOREIGN KEY (docent_id)
        REFERENCES docent(persoon_id),

    FOREIGN KEY (academiejaar_id)
        REFERENCES academiejaar(id),

    FOREIGN KEY (status_id)
        REFERENCES stagevoorstel_status(id)
);

-- COMMISSIE BEOORDELING

CREATE TABLE commissie_beoordeling (
    id INT AUTO_INCREMENT PRIMARY KEY,

    stagevoorstel_id INT,
    commissielid_id INT,
    beslissing_id INT,

    feedback TEXT,

    beoordeeld_op TIMESTAMP NULL,

    FOREIGN KEY (stagevoorstel_id)
        REFERENCES stagevoorstel(id),

    FOREIGN KEY (commissielid_id)
        REFERENCES stagecommissielid(persoon_id),

    FOREIGN KEY (beslissing_id)
        REFERENCES beslissing(id)
);

-- STAGEOVEREENKOMST

CREATE TABLE stageovereenkomst (
    id INT AUTO_INCREMENT PRIMARY KEY,

    stagevoorstel_id INT,

    getekend_door_student BOOLEAN DEFAULT FALSE,
    getekend_door_bedrijf BOOLEAN DEFAULT FALSE,
    getekend_door_school BOOLEAN DEFAULT FALSE,

    status_id INT,

    gevalideerd_door_id INT,
    gevalideerd_op TIMESTAMP NULL,

    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stagevoorstel_id)
        REFERENCES stagevoorstel(id),

    FOREIGN KEY (status_id)
        REFERENCES overeenkomst_status(id),

    FOREIGN KEY (gevalideerd_door_id)
        REFERENCES persoon(id)
);

-- DOCUMENTEN

CREATE TABLE document (
    id INT AUTO_INCREMENT PRIMARY KEY,

    stagevoorstel_id INT NULL,
    stageovereenkomst_id INT NULL,

    uploader_id INT,

    type VARCHAR(100),

    bestandsnaam VARCHAR(255),
    bestand_url VARCHAR(255),

    geupload_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stagevoorstel_id)
        REFERENCES stagevoorstel(id),

    FOREIGN KEY (stageovereenkomst_id)
        REFERENCES stageovereenkomst(id),

    FOREIGN KEY (uploader_id)
        REFERENCES persoon(id)
);

-- STAGE

CREATE TABLE stage (
    id INT AUTO_INCREMENT PRIMARY KEY,

    stageovereenkomst_id INT,

    student_id INT,
    bedrijf_id INT,
    mentor_id INT,
    docent_id INT,

    startdatum DATE,
    einddatum DATE,

    actief BOOLEAN DEFAULT TRUE,

    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stageovereenkomst_id)
        REFERENCES stageovereenkomst(id),

    FOREIGN KEY (student_id)
        REFERENCES student(persoon_id),

    FOREIGN KEY (bedrijf_id)
        REFERENCES bedrijf(id),

    FOREIGN KEY (mentor_id)
        REFERENCES stagementor(persoon_id),

    FOREIGN KEY (docent_id)
        REFERENCES docent(persoon_id)
);

-- LOGBOEK STATUS

CREATE TABLE logboek_status (
    id INT AUTO_INCREMENT PRIMARY KEY,

    naam VARCHAR(50) UNIQUE,
    beschrijving TEXT
);

-- LOGBOEK WEEK

CREATE TABLE logboek_week (
    id INT AUTO_INCREMENT PRIMARY KEY,

    stage_id INT,

    week_nummer INT,
    week_start DATE,
    week_einde DATE,

    status_id INT,

    feedback_mentor TEXT,

    afgecheckt_op TIMESTAMP NULL,

    FOREIGN KEY (stage_id)
        REFERENCES stage(id),

    FOREIGN KEY (status_id)
        REFERENCES logboek_status(id)
);

-- LOGBOEK DAG ITEM

CREATE TABLE logboek_dag_item (
    id INT AUTO_INCREMENT PRIMARY KEY,

    logboek_week_id INT,

    datum DATE,

    uitgevoerde_taken TEXT,
    reflectie TEXT,
    problemen_leerpunten TEXT,

    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (logboek_week_id)
        REFERENCES logboek_week(id)
);

-- LOGBOEK FEEDBACK

CREATE TABLE logboek_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,

    logboek_dag_item_id INT,

    afzender_id INT,

    feedback TEXT,

    gegeven_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (logboek_dag_item_id)
        REFERENCES logboek_dag_item(id),

    FOREIGN KEY (afzender_id)
        REFERENCES persoon(id)
);

-- EVALUATIE TYPE

CREATE TABLE evaluatie_type (
    id INT AUTO_INCREMENT PRIMARY KEY,

    naam VARCHAR(50) UNIQUE,
    beschrijving TEXT
);

-- EVALUATIE MOMENT

CREATE TABLE evaluatie_moment (
    id INT AUTO_INCREMENT PRIMARY KEY,

    stage_id INT,
    docent_id INT,
    mentor_id INT,
    type_id INT,

    datum DATE,

    eindresultaat_score DECIMAL(5,2),
    algemene_feedback TEXT,

    FOREIGN KEY (stage_id)
        REFERENCES stage(id),

    FOREIGN KEY (docent_id)
        REFERENCES docent(persoon_id),

    FOREIGN KEY (mentor_id)
        REFERENCES stagementor(persoon_id),

    FOREIGN KEY (type_id)
        REFERENCES evaluatie_type(id)
);

-- COMPETENTIE

CREATE TABLE competentie (
    id INT AUTO_INCREMENT PRIMARY KEY,

    opleiding_id INT,

    naam VARCHAR(150),
    beschrijving TEXT,
    gewicht INT,

    rubric_volledig TEXT NULL,
    rubric_goed TEXT NULL,
    rubric_onvoldoende TEXT NULL,

    actief BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (opleiding_id)
        REFERENCES opleiding(id)
);

-- COMPETENTIE BEOORDELING

CREATE TABLE competentie_beoordeling (
    id INT AUTO_INCREMENT PRIMARY KEY,

    evaluatie_moment_id INT,
    competentie_id INT,

    student_reflectie TEXT,
    student_score INT,
    mentor_score INT,
    mentor_feedback TEXT,
    docent_score INT,
    docent_feedback TEXT,

    FOREIGN KEY (evaluatie_moment_id)
        REFERENCES evaluatie_moment(id),

    FOREIGN KEY (competentie_id)
        REFERENCES competentie(id)
);

-- LOGBOEK DAG ITEM GEKOPPELD AAN COMPETENTIES

CREATE TABLE logboek_dag_competentie (
    id INT AUTO_INCREMENT PRIMARY KEY,

    logboek_dag_item_id INT,
    competentie_id INT,

    UNIQUE KEY uniek_dag_competentie (logboek_dag_item_id, competentie_id),

    FOREIGN KEY (logboek_dag_item_id)
        REFERENCES logboek_dag_item(id)
        ON DELETE CASCADE,

    FOREIGN KEY (competentie_id)
        REFERENCES competentie(id)
);

-- NOTIFICATIE

CREATE TABLE notificatie (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ontvanger_id INT,

    titel VARCHAR(255),
    boodschap TEXT,

    gelezen BOOLEAN DEFAULT FALSE,

    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ontvanger_id)
        REFERENCES persoon(id)
);

-- TUSSENTIJDSE BESPREKING (student vraagt aan, mentor ziet/bevestigt)

CREATE TABLE bespreking (
    id INT AUTO_INCREMENT PRIMARY KEY,

    stage_id INT,
    student_id INT,
    mentor_id INT,

    bericht TEXT,
    voorkeur_datum DATE NULL,

    status VARCHAR(20) DEFAULT 'aangevraagd',
    mentor_antwoord TEXT NULL,

    aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stage_id)   REFERENCES stage(id),
    FOREIGN KEY (student_id) REFERENCES persoon(id),
    FOREIGN KEY (mentor_id)  REFERENCES persoon(id)
);