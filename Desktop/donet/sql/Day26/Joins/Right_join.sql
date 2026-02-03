SELECT 
    u.user_id,
    u.name,
--    o.order_id,
    o.product
FROM users u
RIGHT JOIN orders o
ON u.user_id = o.user_id;
