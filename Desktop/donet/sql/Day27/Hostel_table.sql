CREATE TABLE Hostels (
    Registration_Name VARCHAR(100) NOT NULL,
    Hostel_number     VARCHAR(10)  NOT NULL,
    Room_number       INT          NOT NULL,
    Phone_Number      VARCHAR(15),
    Gender            VARCHAR(10)
);


INSERT INTO Hostels
(Registration_Name, Hostel_number, Room_number, Phone_Number, Gender)
VALUES
('Amit Kumar', 'H-1', 201, '9876543210', 'Male'),
('Rahul Sharma', 'H-1', 202, '9876543211', 'Male'),
('Sneha Verma', 'H-2', 105, '9876543212', 'Female'),
('Priya Singh', 'H-2', 110, '9876543213', 'Female');


select * from Hostels;

select * from CollegeMaster1;
