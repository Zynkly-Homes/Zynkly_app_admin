CREATE TABLE Hostel1 (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(50),
    room_no INT
);

INSERT INTO Hostel1 VALUES
(1, 'Rahul', 101),
(2, 'Aman', 102),
(3, 'Neha', 103);


Select * from Hostel1


CREATE TABLE Hostel2 (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(50),
    room_no INT
);


INSERT INTO Hostel2 VALUES
(6, 'Navneet', 201),
(4, 'Pooja', 202),
(5, 'Karan', 203);



Select * from Hostel2



--copying data from hostel1 to hostel 2


INSERT INTO Hostel2
SELECT * FROM Hostel1;
