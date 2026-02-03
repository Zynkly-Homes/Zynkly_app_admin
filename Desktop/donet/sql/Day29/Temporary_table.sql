
--- local Temporary 


CREATE TABLE #Students (
    Name VARCHAR(50),
    M1 INT
);

INSERT INTO #Students VALUES
('Amit', 40),
('Ravi', 32),
('Neha', 55),
('Sita', 35);



SELECT * FROM #Students;


SELECT 
    Name,
    M1,
    CASE 
        WHEN M1 >= 35 THEN 'Pass'
        ELSE 'Fail'
    END AS Result
FROM #Students;

SELECT COUNT(*) AS Pass_Count
FROM #Students
WHERE M1 >= 35;
