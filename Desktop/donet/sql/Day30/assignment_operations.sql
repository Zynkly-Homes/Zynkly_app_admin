select * from Sales_Raw;


--Question 2 – Third Highest Total Sales (Analytical Query)


WITH OrderTotal AS (
    SELECT 
        OrderID,
        SUM(CAST(q.value AS INT) * CAST(p.value AS INT)) AS TotalSales
    FROM Sales_Raw
    CROSS APPLY STRING_SPLIT(Quantities, ',') q
    CROSS APPLY STRING_SPLIT(UnitPrices, ',') p
    GROUP BY OrderID
)
SELECT DISTINCT TotalSales
FROM (
    SELECT 
        TotalSales,
        DENSE_RANK() OVER (ORDER BY TotalSales DESC) AS rnk
    FROM OrderTotal
) t
WHERE rnk = 3;


--Question 3 – GROUP BY & HAVING (Business Rule)

SELECT 
    SalesPerson,
    SUM(CAST(q.value AS INT) * CAST(p.value AS INT)) AS TotalSales
FROM Sales_Raw
CROSS APPLY STRING_SPLIT(Quantities, ',') q
CROSS APPLY STRING_SPLIT(UnitPrices, ',') p
GROUP BY SalesPerson
HAVING SUM(CAST(q.value AS INT) * CAST(p.value AS INT)) > 60000;




---Question 4 – Subquery Usage

SELECT 
    CustomerName,
    SUM(CAST(q.value AS INT) * CAST(p.value AS INT)) AS TotalSpent
FROM Sales_Raw
CROSS APPLY STRING_SPLIT(Quantities, ',') q
CROSS APPLY STRING_SPLIT(UnitPrices, ',') p
GROUP BY CustomerName
HAVING SUM(CAST(q.value AS INT) * CAST(p.value AS INT)) >
(
    SELECT AVG(TotalSpent)
    FROM (
        SELECT 
            SUM(CAST(q.value AS INT) * CAST(p.value AS INT)) AS TotalSpent
        FROM Sales_Raw
        CROSS APPLY STRING_SPLIT(Quantities, ',') q
        CROSS APPLY STRING_SPLIT(UnitPrices, ',') p
        GROUP BY CustomerName
    ) t
);


--Question 5 – String & Date Functions

SELECT 
    UPPER(CustomerName) AS CustomerName,
    MONTH(OrderDate) AS OrderMonth,
    *
FROM Sales_Raw
WHERE 
    YEAR(OrderDate) = 2024
    AND MONTH(OrderDate) = 1;
