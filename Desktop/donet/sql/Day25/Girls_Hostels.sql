CREATE TABLE dbo.girls_hostel (
    id BIGINT IDENTITY(1,1) NOT NULL,
    roomNo INT NULL,
    collegeId INT NULL,

    CONSTRAINT PK_girls_hostel
        PRIMARY KEY (id),

    CONSTRAINT FK_girls_hostel_college
        FOREIGN KEY (collegeId)
        REFERENCES dbo.CollegeMaster1 (Registration_Number)
);

INSERT INTO dbo.girls_hostel (roomNo, collegeId)
VALUES
(301, 101),
(302, 102),
(303, 103);


SELECT * FROM dbo.girls_hostel;

SELECT Registration_Number
FROM dbo.CollegeMaster1;
