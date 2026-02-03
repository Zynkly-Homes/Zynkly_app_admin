

select * from college_master

select * from Hostels
-- Q1  ID+3 letter of name from the mastertable

SELECT 
    Concat(id ,SUBSTRING(Name,1,3)) AS PASSWORD
FROM college_master;


--Q2  extract the substring  till "r"
SELECT 
    SUBSTRING(Name,1,CHARINDEX('r',Name)) AS till_r
FROM college_master;


-- Q3 extract the substing from r to end

SELECT 
    SUBSTRING(Name, CHARINDEX('r', Name), LEN(Name)) AS from_r
FROM college_master;
