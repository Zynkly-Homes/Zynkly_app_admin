CREATE TABLE User1 (
    Id INT,
    Email VARCHAR(100)
);


INSERT INTO User1 (Id, Email) VALUES
(1, 'a@gmail.com'),
(2, 'b@gmail.com'),
(3, 'a@gmail.com'),
(4, 'c@gmail.com'),
(5, 'b@gmail.com'),
(6, 'b@gmail.com');

select * from user1


SELECT Email, COUNT(*) AS Email_Count
FROM User1
GROUP BY Email
HAVING COUNT(*) > 1;
