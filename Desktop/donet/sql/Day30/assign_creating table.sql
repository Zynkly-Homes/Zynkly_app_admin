

-- customer table 

CREATE TABLE Customer (
    CustomerID INT PRIMARY KEY,
    CustomerName VARCHAR(100),
    CustomerPhone VARCHAR(20),
    CustomerCity VARCHAR(50)
);


INSERT INTO Customer VALUES
(1, 'Ravi Kumar', '9876543210', 'Chennai'),
(2, 'Priya Sharma', '9123456789', 'Bangalore'),
(3, 'John Peter', '9988776655', 'Hyderabad');

SELECT * FROM Customer;




--sales person 

CREATE TABLE SalesPerson (
    SalesPersonID INT PRIMARY KEY,
    SalesPersonName VARCHAR(100)
);

INSERT INTO SalesPerson VALUES
(1, 'Anitha'),
(2, 'Suresh');

SELECT * FROM SalesPerson ;

--product table

CREATE TABLE Product (
    ProductID INT PRIMARY KEY,
    ProductName VARCHAR(100),
    UnitPrice INT
);

INSERT INTO Product VALUES
(1, 'Laptop', 55000),
(2, 'Mouse', 500),
(3, 'Keyboard', 1500),
(4, 'Monitor', 12000);

SELECT * FROM Product ;


-- order table 

CREATE TABLE Orde (
    OrderID INT PRIMARY KEY,
    OrderDate DATE,
    CustomerID INT,
    SalesPersonID INT,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (SalesPersonID) REFERENCES SalesPerson(SalesPersonID)
);

INSERT INTO Orde VALUES
(101, '2024-01-05', 1, 1),
(102, '2024-01-06', 2, 1),
(103, '2024-01-10', 1, 2),
(104, '2024-02-01', 3, 1),
(105, '2024-02-10', 2, 2);


SELECT * FROM Orde  ;

-- order details

CREATE TABLE OrderDetails (
    OrderDetailID INT PRIMARY KEY,
    OrderID INT,
    ProductID INT,
    Quantity INT,
    FOREIGN KEY (OrderID) REFERENCES Orde(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);


INSERT INTO OrderDetails VALUES
(1, 101, 1, 1),  -- Laptop
(2, 101, 2, 2),  -- Mouse

(3, 102, 3, 1),  -- Keyboard
(4, 102, 2, 1),  

(5, 103, 1, 1),  

(6, 104, 4, 1),  
(7, 104, 2, 1),  

(8, 105, 1, 1), 
(9, 105, 3, 1);  

SELECT * FROM OrderDetails ;