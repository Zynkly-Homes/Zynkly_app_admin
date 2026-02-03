
--1) Phone numbers of students in Room No = 1 (both hostels)
SELECT c.phoneNo
FROM college_master c
JOIN boys_hostel b ON c.id = b.collegeId
WHERE b.roomNo = 1

UNION

SELECT c.phoneNo
FROM college_master c
JOIN girls_hostel g ON c.id = g.collegeId
WHERE g.roomNo = 1;
