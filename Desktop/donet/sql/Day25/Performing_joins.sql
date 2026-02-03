--Print the student name who has taken the Java book

SELECT c.name
FROM library l
JOIN book_master b ON l.bookId = b.id
JOIN college_master c ON l.takenBy = c.id
WHERE b.bookName = 'Java';

--How many books taken by the person who scored 100 in any one subject

SELECT COUNT(*) AS total_books
FROM library l
JOIN college_master c ON l.takenBy = c.id
WHERE c.m1 = 100 OR c.m2 = 100 OR c.m3 = 100 OR c.m4 = 100;


--How many students in Room No 1 have taken a book from library
SELECT COUNT(DISTINCT l.takenBy) AS total_students
FROM library l
WHERE l.takenBy IN (
    SELECT collegeId FROM boys_hostel WHERE roomNo = 1
    UNION
    SELECT collegeId FROM girls_hostel WHERE roomNo = 1
);


--Which department students have taken the Python book
SELECT DISTINCT c.grade
FROM library l
JOIN book_master b ON l.bookId = b.id
JOIN college_master c ON l.takenBy = c.id
WHERE b.bookName = 'Python';

--Print the phone number of the student who took the Java book

SELECT c.phoneNo
FROM library l
JOIN book_master b ON l.bookId = b.id
JOIN college_master c ON l.takenBy = c.id
WHERE b.bookName = 'Java';
