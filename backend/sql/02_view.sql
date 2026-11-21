-- =====================================================================
-- vw_sales : the joined dataset used by the dashboard (one row per order)
-- INNER JOIN is correct here: every order has a customer (enforced by the
-- foreign key), and customers without orders contribute nothing to sales.
-- =====================================================================
CREATE VIEW vw_sales AS
SELECT
    o.Order_ID,
    o.Order_Date,
    strftime('%Y-%m', o.Order_Date) AS Order_Month,
    o.Product_ID,
    o.Product_Name,
    o.Category,
    o.Quantity,
    o.Unit_Price_INR,
    o.Discount_Rate,
    o.Net_Amount_INR,
    o.Payment_Method,
    o.Order_Status,
    c.Customer_ID,
    c.Customer_Name,
    c.City,
    c.State,
    c.Customer_Segment,
    c.Acquisition_Channel,
    c.Join_Date
FROM orders AS o
JOIN customers AS c ON c.Customer_ID = o.Customer_ID;
