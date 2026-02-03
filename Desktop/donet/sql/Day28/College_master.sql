select * from college_master;



GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[uspGetstudentCountByDept]
   
AS
BEGIN

BEGIN TRY

BEGIN TRANSACTION Trans_One

update collegemaster set department ='ME' where department ='MCA'
insert into Hostel (RoomNo,CollegeId) values (23,7)


if @@ROWCOUNT = 0
ROLLBACK TRANSACTION Trans_One

COMMIT TRANSACTION Trans_One

END TRY

BEGIN CATCH

ROLLBACK TRANSACTION Trans_One

END CATCH

END;


select * from college_master;
select * from Hostels;