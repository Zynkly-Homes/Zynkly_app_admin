CREATE TABLE Student (
    StudentID INT PRIMARY KEY,
    Name VARCHAR(50),
    Email VARCHAR(50),
    Phone BIGINT
);

INSERT INTO Student (StudentID, Name, Email, Phone)
VALUES
(1, 'Rahul', 'rahul@gmail.com', 9876543210),
(2, 'Aman', 'aman@gmail.com', 9123456780),
(3, 'Neha', 'neha@gmail.com', 9988776655);

SELECT * from Studnet1



CREATE TABLE #TempStudent (
    Id INT,
    Name VARCHAR(50)
);


INSERT INTO #TempStudent (Id, Name)
VALUES
(4, 'Harsh'),
(2, 'Aman'),
(3, 'Navneet');
;

SELECT * FROM #TempStudent;


