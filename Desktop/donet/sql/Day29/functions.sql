

CREATE FUNCTION GetDepart (@name VARCHAR(20))
RETURNS TABLE
AS
RETURN
(
    SELECT *
    FROM CollegeMaster1
    WHERE Name = @name
);

SELECT * FROM GetDepart('Amit');



-- making function for finding highest marks in m1


CREATE FUNCTION GetHighestM()
RETURNS INT
AS
BEGIN
    DECLARE @mM1 INT;

    SELECT @mM1 = MAX(m1)
    FROM CollegeMaster1;

    RETURN @mM1;
END;


SELECT dbo.GetHighestM() AS Highest_M1;
