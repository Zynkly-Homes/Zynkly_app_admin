CREATE TABLE dbo.Hostels (
    Registration_Number INT NOT NULL,
    Hostel_number INT NOT NULL,
    Room_number INT,
    Phone_Number VARCHAR(10),
    Gender VARCHAR(10) NOT NULL,

    CONSTRAINT PK_Hostels PRIMARY KEY (Registration_Number),

    CONSTRAINT FK_Hostels_CollegeMaster
        FOREIGN KEY (Registration_Number)
        REFERENCES dbo.CollegeMaster1 (Registration_Number)
);

DROP TABLE Hostels;

SELECT * FROM Hostels;