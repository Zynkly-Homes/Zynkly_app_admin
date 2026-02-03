CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT,
    product VARCHAR(50)
);


INSERT INTO orders (order_id, user_id, product)
VALUES
(101, 1, 'Mobile'),
(102, 1, 'Laptop'),
(103, 2, 'Book');
INSERT INTO orders VALUES (104, 5, 'Pen');



SELECT * FROM orders;