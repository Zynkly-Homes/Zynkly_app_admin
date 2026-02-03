CREATE TABLE EmployeeMaster (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    salary DECIMAL(10,2),
    pf DECIMAL(10,2),
    age INT,
    bonus DECIMAL(10,2)
);

INSERT INTO EmployeeMaster (id, name, salary, pf, age, bonus)
VALUES
(1, 'Rahul', 50000, 5000, 25, 2000),
(2, 'Amit', 60000, 6000, 28, 3000),
(3, 'Neha', 55000, 5500, 26, 2500),
(4, 'Priya', 65000, 6500, 30, 3500),
(5, 'Rohan', 48000, 4800, 24, 1500);


SELECT * FROM EmployeeMaster;
