SELECT 
    u.user_id,
    u.name,
    o.product
FROM users u
LEFT JOIN orders o
ON u.user_id = o.user_id;
