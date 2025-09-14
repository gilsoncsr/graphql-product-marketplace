-- Marketplace Database Schema for Oracle
-- This script creates all necessary tables, procedures, and initial data

-- Create tables
CREATE TABLE users (
    id VARCHAR2(36) PRIMARY KEY,
    email VARCHAR2(255) UNIQUE NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    first_name VARCHAR2(100) NOT NULL,
    last_name VARCHAR2(100) NOT NULL,
    phone VARCHAR2(20),
    address VARCHAR2(500),
    city VARCHAR2(100),
    state VARCHAR2(100),
    zip_code VARCHAR2(20),
    country VARCHAR2(100),
    is_admin NUMBER(1) DEFAULT 0,
    is_active NUMBER(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id VARCHAR2(36) PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    description CLOB,
    price NUMBER(10,2) NOT NULL,
    category VARCHAR2(100) NOT NULL,
    brand VARCHAR2(100),
    sku VARCHAR2(100) UNIQUE,
    stock_quantity NUMBER(10) DEFAULT 0,
    is_active NUMBER(1) DEFAULT 1,
    seller_id VARCHAR2(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE product_attributes (
    id VARCHAR2(36) PRIMARY KEY,
    product_id VARCHAR2(36) NOT NULL,
    attribute_name VARCHAR2(100) NOT NULL,
    attribute_value VARCHAR2(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_images (
    id VARCHAR2(36) PRIMARY KEY,
    product_id VARCHAR2(36) NOT NULL,
    image_url VARCHAR2(500) NOT NULL,
    alt_text VARCHAR2(255),
    is_primary NUMBER(1) DEFAULT 0,
    sort_order NUMBER(3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    id VARCHAR2(36) PRIMARY KEY,
    product_id VARCHAR2(36) NOT NULL,
    user_id VARCHAR2(36) NOT NULL,
    rating NUMBER(1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR2(255),
    comment CLOB,
    is_verified_purchase NUMBER(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    product_id VARCHAR2(36) NOT NULL,
    quantity NUMBER(10) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

CREATE TABLE orders (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    status VARCHAR2(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount NUMBER(10,2) NOT NULL,
    shipping_address VARCHAR2(500) NOT NULL,
    billing_address VARCHAR2(500) NOT NULL,
    payment_method VARCHAR2(50) NOT NULL,
    payment_status VARCHAR2(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    tracking_number VARCHAR2(100),
    notes CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id VARCHAR2(36) PRIMARY KEY,
    order_id VARCHAR2(36) NOT NULL,
    product_id VARCHAR2(36) NOT NULL,
    quantity NUMBER(10) NOT NULL,
    unit_price NUMBER(10,2) NOT NULL,
    total_price NUMBER(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE sessions (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    refresh_token VARCHAR2(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR2(45),
    user_agent VARCHAR2(500),
    is_active NUMBER(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);

-- Create sequences for auto-incrementing IDs (Oracle style)
CREATE SEQUENCE seq_users START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_products START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_orders START WITH 1 INCREMENT BY 1;

-- PL/SQL Procedures

-- Procedure to register a new user
CREATE OR REPLACE PROCEDURE proc_register_user(
    p_id IN VARCHAR2,
    p_email IN VARCHAR2,
    p_password_hash IN VARCHAR2,
    p_first_name IN VARCHAR2,
    p_last_name IN VARCHAR2,
    p_phone IN VARCHAR2 DEFAULT NULL,
    p_address IN VARCHAR2 DEFAULT NULL,
    p_city IN VARCHAR2 DEFAULT NULL,
    p_state IN VARCHAR2 DEFAULT NULL,
    p_zip_code IN VARCHAR2 DEFAULT NULL,
    p_country IN VARCHAR2 DEFAULT NULL,
    p_result OUT VARCHAR2
) AS
    v_count NUMBER;
BEGIN
    -- Check if email already exists
    SELECT COUNT(*) INTO v_count FROM users WHERE email = p_email;
    
    IF v_count > 0 THEN
        p_result := 'EMAIL_EXISTS';
        RETURN;
    END IF;
    
    -- Insert new user
    INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        phone, address, city, state, zip_code, country
    ) VALUES (
        p_id, p_email, p_password_hash, p_first_name, p_last_name,
        p_phone, p_address, p_city, p_state, p_zip_code, p_country
    );
    
    COMMIT;
    p_result := 'SUCCESS';
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'ERROR: ' || SQLERRM;
END;
/

-- Procedure to authenticate user
CREATE OR REPLACE PROCEDURE proc_authenticate_user(
    p_email IN VARCHAR2,
    p_password_hash IN VARCHAR2,
    p_user_id OUT VARCHAR2,
    p_first_name OUT VARCHAR2,
    p_last_name OUT VARCHAR2,
    p_is_admin OUT NUMBER,
    p_result OUT VARCHAR2
) AS
    v_count NUMBER;
BEGIN
    -- Check credentials
    SELECT COUNT(*) INTO v_count 
    FROM users 
    WHERE email = p_email 
    AND password_hash = p_password_hash 
    AND is_active = 1;
    
    IF v_count = 0 THEN
        p_result := 'INVALID_CREDENTIALS';
        RETURN;
    END IF;
    
    -- Get user details
    SELECT id, first_name, last_name, is_admin
    INTO p_user_id, p_first_name, p_last_name, p_is_admin
    FROM users
    WHERE email = p_email
    AND password_hash = p_password_hash
    AND is_active = 1;
    
    p_result := 'SUCCESS';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_result := 'INVALID_CREDENTIALS';
    WHEN OTHERS THEN
        p_result := 'ERROR: ' || SQLERRM;
END;
/

-- Procedure to search products
CREATE OR REPLACE PROCEDURE proc_search_products(
    p_search_term IN VARCHAR2,
    p_category IN VARCHAR2 DEFAULT NULL,
    p_min_price IN NUMBER DEFAULT NULL,
    p_max_price IN NUMBER DEFAULT NULL,
    p_limit IN NUMBER DEFAULT 20,
    p_offset IN NUMBER DEFAULT 0,
    p_cursor OUT SYS_REFCURSOR
) AS
    v_sql VARCHAR2(4000);
BEGIN
    v_sql := 'SELECT p.*, u.first_name || '' '' || u.last_name as seller_name
              FROM products p
              JOIN users u ON p.seller_id = u.id
              WHERE p.is_active = 1';
    
    -- Add search term filter
    IF p_search_term IS NOT NULL AND LENGTH(TRIM(p_search_term)) > 0 THEN
        v_sql := v_sql || ' AND (LOWER(p.name) LIKE LOWER(''%' || p_search_term || '%'') 
                              OR LOWER(p.description) LIKE LOWER(''%' || p_search_term || '%'')
                              OR LOWER(p.brand) LIKE LOWER(''%' || p_search_term || '%''))';
    END IF;
    
    -- Add category filter
    IF p_category IS NOT NULL THEN
        v_sql := v_sql || ' AND p.category = ''' || p_category || '''';
    END IF;
    
    -- Add price filters
    IF p_min_price IS NOT NULL THEN
        v_sql := v_sql || ' AND p.price >= ' || p_min_price;
    END IF;
    
    IF p_max_price IS NOT NULL THEN
        v_sql := v_sql || ' AND p.price <= ' || p_max_price;
    END IF;
    
    -- Add ordering and pagination
    v_sql := v_sql || ' ORDER BY p.created_at DESC
                       OFFSET ' || p_offset || ' ROWS
                       FETCH NEXT ' || p_limit || ' ROWS ONLY';
    
    OPEN p_cursor FOR v_sql;
    
EXCEPTION
    WHEN OTHERS THEN
        p_cursor := NULL;
END;
/

-- Procedure to create order
CREATE OR REPLACE PROCEDURE proc_create_order(
    p_order_id IN VARCHAR2,
    p_user_id IN VARCHAR2,
    p_total_amount IN NUMBER,
    p_shipping_address IN VARCHAR2,
    p_billing_address IN VARCHAR2,
    p_payment_method IN VARCHAR2,
    p_notes IN CLOB DEFAULT NULL,
    p_result OUT VARCHAR2
) AS
    v_count NUMBER;
BEGIN
    -- Check if user exists and is active
    SELECT COUNT(*) INTO v_count 
    FROM users 
    WHERE id = p_user_id AND is_active = 1;
    
    IF v_count = 0 THEN
        p_result := 'USER_NOT_FOUND';
        RETURN;
    END IF;
    
    -- Create order
    INSERT INTO orders (
        id, user_id, total_amount, shipping_address, 
        billing_address, payment_method, notes
    ) VALUES (
        p_order_id, p_user_id, p_total_amount, p_shipping_address,
        p_billing_address, p_payment_method, p_notes
    );
    
    COMMIT;
    p_result := 'SUCCESS';
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'ERROR: ' || SQLERRM;
END;
/

-- Procedure to add order items
CREATE OR REPLACE PROCEDURE proc_add_order_item(
    p_id IN VARCHAR2,
    p_order_id IN VARCHAR2,
    p_product_id IN VARCHAR2,
    p_quantity IN NUMBER,
    p_unit_price IN NUMBER,
    p_total_price IN NUMBER,
    p_result OUT VARCHAR2
) AS
    v_count NUMBER;
BEGIN
    -- Check if order exists
    SELECT COUNT(*) INTO v_count FROM orders WHERE id = p_order_id;
    
    IF v_count = 0 THEN
        p_result := 'ORDER_NOT_FOUND';
        RETURN;
    END IF;
    
    -- Check if product exists and is active
    SELECT COUNT(*) INTO v_count 
    FROM products 
    WHERE id = p_product_id AND is_active = 1;
    
    IF v_count = 0 THEN
        p_result := 'PRODUCT_NOT_FOUND';
        RETURN;
    END IF;
    
    -- Add order item
    INSERT INTO order_items (
        id, order_id, product_id, quantity, unit_price, total_price
    ) VALUES (
        p_id, p_order_id, p_product_id, p_quantity, p_unit_price, p_total_price
    );
    
    COMMIT;
    p_result := 'SUCCESS';
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'ERROR: ' || SQLERRM;
END;
/

-- Grant permissions
GRANT EXECUTE ON proc_register_user TO marketplace;
GRANT EXECUTE ON proc_authenticate_user TO marketplace;
GRANT EXECUTE ON proc_search_products TO marketplace;
GRANT EXECUTE ON proc_create_order TO marketplace;
GRANT EXECUTE ON proc_add_order_item TO marketplace;
