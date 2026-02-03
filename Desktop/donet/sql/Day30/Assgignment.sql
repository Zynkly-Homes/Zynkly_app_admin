CREATE TABLE Sales_Raw
(
    OrderID INT,
    OrderDate VARCHAR(20),
    CustomerName VARCHAR(100),
    CustomerPhone VARCHAR(20),
    CustomerCity VARCHAR(50),
    ProductNames VARCHAR(200),  
    Quantities VARCHAR(100),    
    UnitPrices VARCHAR(100),     
    SalesPerson VARCHAR(100)
);


INSERT INTO Sales_Raw VALUES
(101, '2024-01-05', 'Ravi Kumar','9876543210', 'Chennai',
 'Laptop,Mouse', '1,2', '55000,500','Anitha'),

(102, '2024-01-06', 'Priya Sharma', '9123456789', 'Bangalore',
 'Keyboard,Mouse', '1,1', '1500,500', 'Anitha'),

(103, '2024-01-10', 'Ravi Kumar', '9876543210', 'Chennai',
 'Laptop', '1', '54000', 'Suresh'),

(104, '2024-02-01', 'John Peter', '9988776655', 'Hyderabad',
 'Monitor,Mouse', '1,1', '12000,500', 'Anitha'),

(105, '2024-02-10', 'Priya Sharma', '9123456789', 'Bangalore',
 'Laptop,Keyboard', '1,1', '56000,1500', 'Suresh');


select * from Sales_Raw;