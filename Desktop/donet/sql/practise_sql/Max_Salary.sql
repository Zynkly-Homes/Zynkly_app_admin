CREATE TABLE Employ (
    Id INT,
    Name VARCHAR(50),
    Dept VARCHAR(50),
    Salary INT
);


INSERT INTO Employ VALUES (1, 'Aryan', 'IT', 60000);
INSERT INTO Employ VALUES (2, 'Aryan', 'IT', 80000);
INSERT INTO Employ VALUES (3, 'Navneet', 'HR', 50000);
INSERT INTO Employ VALUES (4, 'Navneet', 'HR', 70000);
INSERT INTO Employ VALUES (5, 'Rithik', 'Sales', 45000);
INSERT INTO Employ VALUES (6, 'Rithik', 'Sales', 65000);

 drop table Employ
Select * from Employ

SELECT Dept, Name, Salary
FROM Employ e
WHERE Salary = (
    SELECT MAX(Salary)
    FROM Employ
    WHERE Dept = e.Dept
);
