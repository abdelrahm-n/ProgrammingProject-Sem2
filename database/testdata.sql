USE stage_monitoring; 
SHOW TABLES; 

USE stage_monitoring;

INSERT INTO opleiding (naam, afkorting, actief)
VALUES ('Toegepaste Informatica', 'TI', TRUE);

INSERT INTO academiejaar (naam, startdatum, einddatum, actief)
VALUES ('2025-2026', '2025-09-01', '2026-06-30', TRUE);

INSERT INTO stagevoorstel_status (naam, beschrijving)
VALUES 
('ingediend', 'Stagevoorstel is ingediend'),
('goedgekeurd', 'Stagevoorstel is goedgekeurd'),
('afgekeurd', 'Stagevoorstel is afgekeurd'),
('aanpassing_vereist', 'Stagevoorstel moet aangepast worden');

INSERT INTO beslissing (naam, beschrijving)
VALUES 
('goedgekeurd', 'De aanvraag is goedgekeurd'),
('afgekeurd', 'De aanvraag is afgekeurd'),
('aanpassing_vereist', 'Er zijn aanpassingen nodig');

INSERT INTO overeenkomst_status (naam, beschrijving)
VALUES 
('wacht_op_handtekeningen', 'Niet iedereen heeft ondertekend'),
('volledig_getekend', 'Alle partijen hebben ondertekend'),
('gevalideerd', 'Overeenkomst is gevalideerd door administratie');

INSERT INTO logboek_status (naam, beschrijving)
VALUES 
('concept', 'Logboek is nog niet ingediend'),
('ingediend', 'Logboek is ingediend'),
('nagekeken', 'Logboek is nagekeken');

INSERT INTO evaluatie_type (naam, beschrijving)
VALUES 
('tussentijds', 'Tussentijdse evaluatie'),
('finaal', 'Finale evaluatie');



SELECT * FROM opleiding;
SELECT * FROM academiejaar;
SELECT * FROM stagevoorstel_status;