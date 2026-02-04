CREATE TABLE Studentsindex (
    StudentId INT PRIMARY KEY,   -- PRIMARY KEY is clustered by default
    Name VARCHAR(50),
    Marks INT
);

INSERT INTO Studentsindex (StudentId, Name, Marks)
VALUES (1, 'Amit', 78);

INSERT INTO Studentsindex  (StudentId, Name, Marks)
VALUES (2, 'Rohit', 45);

INSERT INTO Studentsindex (StudentId, Name, Marks)
VALUES (3, 'Neha', 92);

INSERT INTO Studentsindex (StudentId, Name, Marks)
VALUES (4, 'Pooja', 66);


select * from Studentsindex;

-- INSERT INTO Students (StudentId, Name, Marks)
-- VALUES
-- (5, 'Karan', 55),
-- (6, 'Sneha', 81),
-- (7, 'Arjun', 34);


EXEC sp_helpindex Studentsindex;

CREATE NONCLUSTERED INDEX idx_marks
ON Studentsindex(Marks);
