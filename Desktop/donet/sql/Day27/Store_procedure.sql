DROP PROCEDURE IF EXISTS GetStudentById;
GO

CREATE PROCEDURE GetStudentById
    @StudentId INT
AS
BEGIN
    SELECT 
    --id, name, Dob, pincode, address, gender, grade, phoneNo
           m1, m2, m3, m4
    FROM college_master
    WHERE id = @StudentId;
END;
GO

EXEC GetStudentById @StudentId = 2;

SELECT * FROM college_master

