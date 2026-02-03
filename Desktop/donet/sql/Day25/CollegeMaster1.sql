CREATE TABLE dbo.college_master (
    id BIGINT IDENTITY(1,1) NOT NULL,
    name VARCHAR(255) NULL,
    Dob VARCHAR(255) NULL,
    pincode INT NULL,
    address VARCHAR(255) NULL,
    gender VARCHAR(255) NULL,
    m1 INT NULL,
    m2 INT NULL,
    m3 INT NULL,
    m4 INT NULL,
    grade VARCHAR(10) NULL,
    phoneNo BIGINT NULL,

    CONSTRAINT PK_college_master
        PRIMARY KEY (id)
);


INSERT INTO dbo.college_master
(name, Dob, pincode, address, gender, m1, m2, m3, m4, grade, phoneNo)
VALUES
('Amit Kumar', '2002-05-10', 110001, 'Delhi', 'Male', 75, 80, 78, 82, 'A', 9876543210),

('Rahul Sharma', '2001-08-15', 302001, 'Jaipur', 'Male', 68, 72, 70, 74, 'B', 9876543211),

('Sneha Verma', '2002-03-22', 226001, 'Lucknow', 'Female', 82, 85, 88, 90, 'A+', 9876543212),

('Priya Singh', '2001-11-30', 400001, 'Mumbai', 'Female', 70, 75, 73, 78, 'B+', 9876543213);




DROP TABLE CollegeMaster1;
SELECT * FROM college_master;
