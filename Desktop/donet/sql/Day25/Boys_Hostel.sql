CREATE TABLE dbo.boys_hostel (
    id BIGINT IDENTITY(1,1) NOT NULL,
    roomNo INT NULL,
    collegeId INT NULL,

    CONSTRAINT PK_boys_hostel
        PRIMARY KEY (id),

    CONSTRAINT FK_boys_hostel_college
        FOREIGN KEY (collegeId)
        REFERENCES dbo.CollegeMaster1 (Registration_Number)
);

INSERT INTO dbo.boys_hostel (roomNo, collegeId)
VALUES
(201, 101),
(202, 102),
(203, 103);



SELECT * FROM boys_hostel;
