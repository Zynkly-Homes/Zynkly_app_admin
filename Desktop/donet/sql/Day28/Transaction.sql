CREATE TABLE Accounts (
    AccountId INT PRIMARY KEY,
    Name VARCHAR(50),
    Balance INT
);

INSERT INTO Accounts (AccountId, Name, Balance)
VALUES 
(1, 'Amit', 5000),
(2, 'Rohit', 3000),
(3, 'Neha', 7000);

SELECT * from Accounts;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO Accounts (AccountId,  Balance)
    VALUES (4,  5000);

    INSERT INTO Accounts (AccountId, Balance)
    VALUES (5,  3000);

       INSERT INTO Accounts (AccountId, Balance)
    VALUES (6,  4000);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Rollback failed happened';
END CATCH;

