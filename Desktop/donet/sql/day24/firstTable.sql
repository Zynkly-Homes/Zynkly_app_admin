CREATE TABLE Student(
    student_id INT IDENTITY(1,1) PRIMARY KEY,
    student_name VARCHAR(100),
    age INT,
    city VARCHAR(50)
);

INSERT INTO Student(student_name, age, city)
VALUES
('Rahul', 21, 'Delhi'),
('Neha', 22, 'Mumbai');

SELECT * FROM Student;

CREATE TABLE Student1 (
    id INT IDENTITY(1,1) PRIMARY KEY,
    student_id INT,
    department VARCHAR(50),
    subject VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES Student(student_id)
);

INSERT INTO Student1 (student_id, department, subject)
VALUES
(1, 'CSE', 'DBMS'),
(2, 'IT', 'Operating Systems');


SELECT * FROM Student1;

DROP TABLE Student1;


SELECT 
    s.student_name,
    s.age,
    s.city,
    s1.department,
    s1.subject
FROM Student s
JOIN Student1 s1
ON s.student_id = s1.student_id;

