CREATE TABLE Canteen (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50),
    item VARCHAR(50),
    amount INT,
    purchase_date DATE
);


INSERT INTO Canteen (name, item, amount, purchase_date)
VALUES
('Rahul', 'Tea', 20, '2025-01-21'),
('Ram', 'Sandwich', 50, '2025-01-21'),
('Amit', 'Burger', 80, '2025-01-21'),
('Neha', 'Coffee', 40, '2025-01-22'),
('Amit', 'Pizza', 120, '2025-01-22');



SELECT * FROM Canteen;

