select * from college_master;


---Students who passed (marks ≥ 35)
WITH PassStudents AS (
    SELECT id, name, m1, m2, m3, m4
    FROM college_master
    WHERE m1 >= 35 AND m2 >= 35 AND m3 >= 35 AND m4 >= 35
)
SELECT *
FROM PassStudents;


---WITH + total marks

WITH TotalMarks AS (
    SELECT 
        id,
        name,
        (m1 + m2 + m3 + m4) AS total
    FROM college_master
)
SELECT *
FROM TotalMarks
WHERE total >= 200;



--WITH + GROUP BY (count students by city)
WITH CityCount AS (
    SELECT address, COUNT(*) AS total_students
    FROM college_master
    GROUP BY address
)
SELECT *
FROM CityCount;


--Common Temporary Table

WITH PassStudents AS (
    SELECT id, name
    FROM college_master
    WHERE m1 >= 35 AND m2 >= 35 AND m3 >= 35 AND m4 >= 35
)
SELECT * FROM PassStudents;


--LTT – Local Temporary Table

CREATE TABLE #PassStudents (
    id INT,
    name VARCHAR(50)
);

INSERT INTO #PassStudents
SELECT id, name
FROM college_master
WHERE m1 >= 35 AND m2 >= 35 AND m3 >= 35 AND m4 >= 35;

SELECT * FROM #PassStudents;



--Find 3rd maximum m1 marks

SELECT DISTINCT m1
FROM college_master
ORDER BY m1 DESC
OFFSET 2 ROWS FETCH NEXT 1 ROW ONLY;
