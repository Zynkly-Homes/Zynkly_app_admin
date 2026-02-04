CREATE TABLE Customers
(
    CustomerID INT PRIMARY KEY,
    CustomerName VARCHAR(100),
    PhoneNumber VARCHAR(15),
    City VARCHAR(50),
    CreatedDate DATE
);


INSERT INTO Customers VALUES
(1, 'Ravi Kumar', '9876543210', 'Chennai', '2023-01-10'),
(2, 'Priya Sharma', '9123456789', 'Bangalore', '2023-03-15'),
(3, 'John Peter', '9988776655', 'Hyderabad', '2023-06-20');

select * from Customers;


CREATE TABLE Account
(
    AccountID INT PRIMARY KEY,
    CustomerID INT,
    AccountNumber VARCHAR(20),
    AccountType VARCHAR(20),
    OpeningBalance DECIMAL(12,2),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);


INSERT INTO Account VALUES
(101, 1, 'SB1001', 'Savings', 20000),
(102, 2, 'SB1002', 'Savings', 15000),
(103, 3, 'SB1003', 'Savings', 30000);


select * from Account;

CREATE TABLE Transactions
(
    TransactionID INT PRIMARY KEY,
    AccountID INT,
    TransactionDate DATE,
    TransactionType VARCHAR(10),
    Amount DECIMAL(12,2),
    FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
);



INSERT INTO Transactions VALUES
(1, 101, '2024-01-05', 'Deposit', 30000),
(2, 101, '2024-01-18', 'Withdraw', 5000),
(3, 101, '2024-02-10', 'Deposit', 25000),

(4, 102, '2024-01-07', 'Deposit', 20000),
(5, 102, '2024-01-25', 'Deposit', 35000),
(6, 102, '2024-02-05', 'Withdraw', 10000),

(7, 103, '2024-01-10', 'Deposit', 15000),
(8, 103, '2024-01-20', 'Withdraw', 5000);


select * from Transactions;

CREATE TABLE Bonus
(
    BonusID INT PRIMARY KEY,
    AccountID INT,
    BonusMonth INT,
    BonusYear INT,
    BonusAmount DECIMAL(10,2),
    CreatedDate DATE,
    FOREIGN KEY (AccountID) REFERENCES Account(AccountID)
);

select * from Bonus;

---Total Deposit & Withdraw (Date Range) store prodcedure
CREATE PROCEDURE GetTransactionSummary
    @StartDate DATE,
    @EndDate DATE,
    @AccountID INT
AS
BEGIN
    SELECT
        SUM(CASE WHEN TransactionType = 'Deposit' THEN Amount ELSE 0 END) AS TotalDeposited,
        SUM(CASE WHEN TransactionType = 'Withdraw' THEN Amount ELSE 0 END) AS TotalWithdrawn
    FROM Transactions
    WHERE AccountID = @AccountID
      AND TransactionDate BETWEEN @StartDate AND @EndDate;
END;

EXEC GetTransactionSummary '2024-01-01', '2024-01-31', 101;



---MONTHLY BONUS INSERT where Deposit > 50,000 → Bonus 1000

INSERT INTO Bonus (BonusID, AccountID, BonusMonth, BonusYear, BonusAmount, CreatedDate)
SELECT
    ROW_NUMBER() OVER (ORDER BY AccountID) AS BonusID,
    AccountID,
    MONTH(TransactionDate),
    YEAR(TransactionDate),
    1000,
    GETDATE()
FROM Transactions
WHERE TransactionType = 'Deposit'
GROUP BY AccountID, YEAR(TransactionDate), MONTH(TransactionDate)
HAVING SUM(Amount) > 50000;






--CURRENT BALANCE QUERY

SELECT
    c.CustomerName,
    a.AccountNumber,
    a.OpeningBalance
    + ISNULL(SUM(CASE WHEN t.TransactionType = 'Deposit' THEN t.Amount END), 0)
    - ISNULL(SUM(CASE WHEN t.TransactionType = 'Withdraw' THEN t.Amount END), 0)
    + ISNULL(SUM(b.BonusAmount), 0) AS CurrentBalance
FROM Customers c
JOIN Account a ON c.CustomerID = a.CustomerID
LEFT JOIN Transactions t ON a.AccountID = t.AccountID
LEFT JOIN Bonus b ON a.AccountID = b.AccountID
GROUP BY c.CustomerName, a.AccountNumber, a.OpeningBalance;
