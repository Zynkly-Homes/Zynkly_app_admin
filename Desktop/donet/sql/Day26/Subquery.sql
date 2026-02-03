CREATE TABLE Employees (
    emp_id INT PRIMARY KEY,
    name VARCHAR(50),
    salary INT
);

INSERT INTO Employees VALUES
(1, 'Aman', 30000),
(2, 'Riya', 40000),
(3, 'Navneet', 50000),
(4, 'Karan', 35000);


--Find employees whose salary is more than average salary

SELECT name, salary
FROM Employees
WHERE salary > (
    SELECT AVG(salary)
    FROM Employees
);

Select * from Employees;