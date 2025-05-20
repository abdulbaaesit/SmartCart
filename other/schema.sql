-- 1. User Management Tables
-----------------------------------
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS User_Roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
            REFERENCES Users(user_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_role
        FOREIGN KEY(role_id)
            REFERENCES Roles(role_id)
            ON DELETE CASCADE
);

-- 2. Product & Category Management
-----------------------------------
CREATE TABLE IF NOT EXISTS Categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER,
    CONSTRAINT fk_parent_category
        FOREIGN KEY(parent_id)
            REFERENCES Categories(category_id)
            ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Products (
    product_id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    condition VARCHAR(20) NOT NULL,  
    category_id INTEGER NOT NULL,
    original_order_item_id INTEGER,  
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_seller
        FOREIGN KEY(seller_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_category
        FOREIGN KEY(category_id)
            REFERENCES Categories(category_id)
            ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Product_Images (
    image_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_product_image
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE
);

-- 3. Shopping Cart Tables
-----------------------------------
CREATE TABLE IF NOT EXISTS Carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, 
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_cart_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Cart_Items (
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (cart_id, product_id),
    CONSTRAINT fk_cart
        FOREIGN KEY(cart_id)
            REFERENCES Carts(cart_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_cart_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE
);

-- 4. Order and Payment Tables
-----------------------------------
CREATE TABLE IF NOT EXISTS Orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    order_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) NOT NULL,  
    total_amount NUMERIC(10,2) NOT NULL,
    shipping_address TEXT,
    payment_status VARCHAR(50),
    CONSTRAINT fk_order_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Order_Items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10,2) NOT NULL, 
    CONSTRAINT fk_orderitem_order
        FOREIGN KEY(order_id)
            REFERENCES Orders(order_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE,
    UNIQUE (order_id, product_id)
);

ALTER TABLE Products
    ADD CONSTRAINT fk_original_order_item
    FOREIGN KEY(original_order_item_id)
    REFERENCES Order_Items(order_item_id)
    ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS Payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE,  
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,  
    status VARCHAR(50) NOT NULL,  
    transaction_ref VARCHAR(100),
    payment_date TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_payment_order
        FOREIGN KEY(order_id)
            REFERENCES Orders(order_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Order_Status_History (
    history_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    remarks TEXT,
    CONSTRAINT fk_history_order
        FOREIGN KEY(order_id)
            REFERENCES Orders(order_id)
            ON DELETE CASCADE
);

-- 5. Reviews and Review Summaries
-----------------------------------
CREATE TABLE IF NOT EXISTS Reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_review_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_review_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Review_Summary (
    product_id INTEGER PRIMARY KEY,
    summary_text TEXT,
    CONSTRAINT fk_summary_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE
);

-- 6. AI and Advanced Feature Tables
-----------------------------------
CREATE TABLE IF NOT EXISTS User_Recommendations (
    rec_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    score NUMERIC(5,2),
    CONSTRAINT fk_rec_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_rec_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fraud_Alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    order_id INTEGER,
    alert_type VARCHAR(50) NOT NULL,
    risk_score NUMERIC(5,2),
    status VARCHAR(50) NOT NULL,  
    timestamp TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_alert_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE SET NULL,
    CONSTRAINT fk_alert_order
        FOREIGN KEY(order_id)
            REFERENCES Orders(order_id)
            ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Gift_Quiz_Results (
    result_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    answers JSONB,  
    recommendation TEXT,  
    quiz_date TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_quiz_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Price_Suggestions (
    suggestion_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    suggested_price NUMERIC(10,2) NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_price_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Flash_Sales (
    flash_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    discount_pct NUMERIC(5,2) NOT NULL, 
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    CONSTRAINT fk_flash_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE
);

-- 7. Notifications 
--------------------
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,  
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    status VARCHAR(50),
    CONSTRAINT fk_notification_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AuditLogs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    details TEXT,
    CONSTRAINT fk_audit_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE SET NULL
);

-- 8. Wishlist Table
-----------------------------------
CREATE TABLE IF NOT EXISTS Wishlist_Items (
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_wishlist_user
        FOREIGN KEY(user_id)
            REFERENCES Users(user_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product
        FOREIGN KEY(product_id)
            REFERENCES Products(product_id)
            ON DELETE CASCADE
);