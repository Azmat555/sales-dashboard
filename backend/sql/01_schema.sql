-- =====================================================================
-- Sales Dashboard - database schema (SQLite)
-- One customer -> many orders, linked by Customer_ID.
-- =====================================================================
PRAGMA foreign_keys = ON;

DROP VIEW  IF EXISTS vw_sales;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    Customer_ID         TEXT PRIMARY KEY,                 -- e.g. C0001
    Customer_Name       TEXT NOT NULL,
    Email               TEXT NOT NULL UNIQUE,
    City                TEXT NOT NULL,
    State               TEXT NOT NULL,
    Customer_Segment    TEXT NOT NULL,                    -- Consumer / Corporate / Small Business
    Join_Date           DATE NOT NULL,                    -- stored as ISO text YYYY-MM-DD
    Acquisition_Channel TEXT NOT NULL
);

CREATE TABLE orders (
    Order_ID        TEXT PRIMARY KEY,                     -- e.g. O00076
    Customer_ID     TEXT NOT NULL,
    Order_Date      DATE NOT NULL,                        -- stored as ISO text YYYY-MM-DD
    Product_ID      TEXT NOT NULL,
    Product_Name    TEXT NOT NULL,
    Category        TEXT NOT NULL,
    Quantity        INTEGER NOT NULL CHECK (Quantity > 0),
    Unit_Price_INR  NUMERIC NOT NULL CHECK (Unit_Price_INR >= 0),
    Discount_Rate   REAL    NOT NULL CHECK (Discount_Rate >= 0 AND Discount_Rate <= 1),
    Net_Amount_INR  NUMERIC NOT NULL CHECK (Net_Amount_INR >= 0),
    Payment_Method  TEXT NOT NULL,
    Order_Status    TEXT NOT NULL CHECK (Order_Status IN ('Completed', 'Returned', 'Cancelled')),
    -- Business rule: cancelled orders always have a net amount of zero
    CHECK (Order_Status <> 'Cancelled' OR Net_Amount_INR = 0),
    -- Relationship: many orders belong to one customer
    FOREIGN KEY (Customer_ID) REFERENCES customers (Customer_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_orders_customer ON orders (Customer_ID);
CREATE INDEX idx_orders_date     ON orders (Order_Date);
