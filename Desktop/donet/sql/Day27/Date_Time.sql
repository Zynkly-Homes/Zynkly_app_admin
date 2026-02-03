
Select DATEADD(year,1,GETDATE()) AS warrantydate;

select DATEDIFF(day, '2005-08-15',GETDATE());

ALTER TABLE dbo.College
ADD DOB DATE;

select * from [dbo].[College]

-- CREATE OR ALTER PROC dbo.uspGetBirthdaysInMyMonth
--     @month DATE
-- AS
-- BEGIN
--     SELECT *
--     FROM dbo.College
--     WHERE MONTH(DOB) = MONTH(@month);
-- END;
-- exec dbo.uspGetBirthdaysInMyMonth @month = '2004-12-10';


ALTER TABLE dbo.College
ADD DOB DATE;

select * from [dbo].[College]

CREATE OR ALTER PROC dbo.uspGetBirthdaysInMyMonth
    @month DATE
AS
BEGIN
    SELECT *
    FROM dbo.College
    WHERE MONTH(DOB) = MONTH(@month);
END;
exec dbo.uspGetBirthdaysInMyMonth @month = '2004-12-10';