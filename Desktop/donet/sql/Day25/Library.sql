CREATE TABLE dbo.library (
    id BIGINT IDENTITY(1,1) NOT NULL,
    bookId BIGINT NULL,
    takenBy INT NULL,
    issueDate VARCHAR(255) NULL,

    CONSTRAINT PK_library
        PRIMARY KEY (id),

    CONSTRAINT FK_library_book
        FOREIGN KEY (bookId)
        REFERENCES dbo.book_master (id),

    CONSTRAINT FK_library_student
        FOREIGN KEY (takenBy)
        REFERENCES dbo.CollegeMaster1 (Registration_Number)
);

INSERT INTO dbo.library (bookId, takenBy, issueDate)
VALUES
(1, 101, '2024-01-10'),
(2, 102, '2024-01-12'),
(3, 103, '2024-01-15');


SELECT * FROM dbo.library;
