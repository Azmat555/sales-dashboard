-- Reference queries for every KPI (the API runs the same logic with filters applied).

-- KPIs
SELECT
    SUM(Net_Amount_INR)                                                      AS total_net_revenue,
    COUNT(DISTINCT Order_ID)                                                 AS total_orders,
    COUNT(DISTINCT Customer_ID)                                              AS unique_customers,
    COUNT(DISTINCT CASE WHEN Order_Status <> 'Cancelled' THEN Order_ID END)  AS non_cancelled_orders,
    SUM(Net_Amount_INR) * 1.0 /
      NULLIF(COUNT(DISTINCT CASE WHEN Order_Status <> 'Cancelled' THEN Order_ID END), 0) AS average_order_value
FROM vw_sales;

-- Monthly revenue trend
SELECT Order_Month, SUM(Net_Amount_INR) AS revenue FROM vw_sales GROUP BY Order_Month ORDER BY Order_Month;

-- Revenue by product category / customer segment / city
SELECT Category,         SUM(Net_Amount_INR) AS revenue FROM vw_sales GROUP BY Category         ORDER BY revenue DESC;
SELECT Customer_Segment, SUM(Net_Amount_INR) AS revenue FROM vw_sales GROUP BY Customer_Segment ORDER BY revenue DESC;
SELECT City,             SUM(Net_Amount_INR) AS revenue FROM vw_sales GROUP BY City             ORDER BY revenue DESC;

-- Order count by status (Returned orders are identifiable here)
SELECT Order_Status, COUNT(DISTINCT Order_ID) AS orders FROM vw_sales GROUP BY Order_Status;

-- Bonus: top five products by revenue
SELECT Product_Name, SUM(Net_Amount_INR) AS revenue FROM vw_sales GROUP BY Product_ID, Product_Name ORDER BY revenue DESC LIMIT 5;

-- Bonus: repeat customers (2+ non-cancelled orders)
SELECT COUNT(*) AS repeat_customers FROM (
    SELECT Customer_ID FROM vw_sales WHERE Order_Status <> 'Cancelled'
    GROUP BY Customer_ID HAVING COUNT(DISTINCT Order_ID) >= 2
);
