CREATE TABLE dbo.book_master (
    id BIGINT IDENTITY(1,1) NOT NULL,
    bookName VARCHAR(255) NULL,
    authorName VARCHAR(255) NULL,
    code VARCHAR(255) NULL,
    price BIGINT NULL,
    CONSTRAINT PK_book_master PRIMARY KEY (id)
);


INSERT INTO dbo.book_master (bookName, authorName, code, price)
VALUES
('Clean Code', 'Robert C. Martin', 'BC101', 450),

('The Alchemist', 'Paulo Coelho', 'TA202', 300),

('Introduction to Algorithms', 'Thomas H. Cormen', 'CLRS303', 900),

('Java', 'James Clear', 'AH404', 500);



Select * from book_master




Drop TABLE book_master;