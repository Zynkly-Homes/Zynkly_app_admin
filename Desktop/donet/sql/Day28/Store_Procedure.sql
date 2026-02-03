
-- I want to insert new data in collegemaster table then i want the id of that that then then i want to add  into hostel  using transaction by store procdeure.

ALTER PROCEDURE InsertStudentWithHostel

AS
BEGIN
    BEGIN TRANSACTION;

    BEGIN TRY
        -- 1️⃣ Insert into college_master
       INSERT INTO college_master
(name, dob, pincode, address, gender, m1, m2, m3, m4, grade, phoneNo)
VALUES
('Navneet', '2005-08-15', 284001, 'Jhansi', 'Male', 23, 25, 26, 27, 'O', 8122441526);


        -- 2️⃣ Get newly inserted ID
        DECLARE @studentId INT;
        SET @studentId = SCOPE_IDENTITY();

        -- 3️⃣ Insert into hostels
        INSERT INTO Hostels
        (Registration_Name, Hostel_number, Room_number, Phone_Number, Gender,registration_no)
        VALUES
        ('Priya Singh', 'H-2', 110, '9876543213', 'Female',  @studentId);

        -- 4️⃣ Commit if everything is OK
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- If error, rollback
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;


exec InsertStudentWithHostel;

select * from college_master;
select * from Hostels;

ALTER TABLE Hostels
ADD registration_no INT;

UPDATE Hostels
SET registration_no = c.id
FROM Hostels h
JOIN college_master c
ON h.Phone_Number = c.phoneNo;

ALTER TABLE Hostels
ADD CONSTRAINT FK_Hostels_CollegeMaster
FOREIGN KEY (registration_no)
REFERENCES college_master(id);





