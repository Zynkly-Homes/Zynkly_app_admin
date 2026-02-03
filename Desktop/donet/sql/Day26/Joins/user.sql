CREATE TABLE users (
    user_id INT PRIMARY KEY,
    name VARCHAR(50)
);

INSERT INTO users (user_id, name)
VALUES
(1, 'Rahul'),
(2, 'Amit'),
(3, 'Neha');

SELECT * FROM users;