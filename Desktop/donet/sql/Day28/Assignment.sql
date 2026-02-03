
-- Create UP sports and Punjab sports tables, insert some data, then use UNION. After that, find only cricket players from the table.

CREATE TABLE up_sports (
    id INT,
    name VARCHAR(50),
    sportname VARCHAR(50)
);

INSERT INTO up_sports VALUES
(1, 'Rahul', 'Cricket'),
(2, 'Aman', 'Football'),
(3, 'Vikas', 'Hockey');


Select * from up_sports;

CREATE TABLE punjab_sports (
    id INT,
    name VARCHAR(50),
    sportname VARCHAR(50)
);


INSERT INTO punjab_sports VALUES
(4, 'Harpreet', 'Cricket'),
(5, 'Gurpreet', 'Kabaddi'),
(6, 'Manpreet', 'Cricket');


SELECT * from punjab_sports

SELECT id, name, sportname FROM up_sports
UNION
SELECT id, name, sportname FROM punjab_sports;


SELECT id, name, sportname
FROM (
    SELECT id, name, sportname FROM up_sports
    UNION
    SELECT id, name, sportname FROM punjab_sports
) AS all_players
WHERE sportname = 'Cricket';
