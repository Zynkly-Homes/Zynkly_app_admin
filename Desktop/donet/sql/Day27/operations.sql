
-- write a store procedure to print all hostel student name?


CREATE PROCEDURE GetAllHostelStudentNames
AS
BEGIN
    SELECT Registration_Name
    FROM Hostels;
END;

EXEC GetAllHostelStudentNames;

-- write a store procedure to print all hostel student name who is  staying in room no 202?

CREATE PROCEDURE GetStudentsByRoomNo
    @RoomNo INT
AS
BEGIN
    SELECT Registration_Name
    FROM Hostels
    WHERE Room_number = @RoomNo;
END;


EXEC GetStudentsByRoomNo 202;


select * from Hostels;


-- if hostel studnet are less than 5 then  insert more student


CREATE proc insertnew
@Collegeids Int,
@RoomNos Int
AS
BEGIN
DECLARE @HostelStudentCount int
SELECT @HostelStudentCount = count(*) FROM Hostels
IF @HostelStudentCount <=5
BEGIN
Insert Hostels(CollegeId,RoomNo) Values (@Collegeids,@RoomNos)
END
END;
exec insertnew @Collegeids=1002,@RoomNos=7

SELECT * FROM Hostels;

SELECT * FROM CollegeMaster1;

-- To check constraints
-- alter table collegemaster add constraint agelimit check (Age>18 and Age<30)





