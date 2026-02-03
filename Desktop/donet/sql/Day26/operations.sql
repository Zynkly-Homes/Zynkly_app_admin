--Q1. How much do I need to pay?

SELECT SUM(amount) AS total_pay
FROM Canteen
WHERE name = 'Rahul';


--Q2. On 21 Jan, how much did I purchase?

SELECT SUM(amount) AS total_on_21_jan
FROM Canteen
WHERE name = 'Rahul'
AND purchase_date = '2025-01-21';

--Q3. Who purchased more in the canteen?

SELECT TOP 1 name, SUM(amount) AS total_spent
FROM Canteen
GROUP BY name
ORDER BY total_spent DESC;


