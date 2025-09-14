-- Seed data for Marketplace Database
-- This script populates the database with sample data for testing

-- Insert sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, address, city, state, zip_code, country, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@marketplace.com', '$2a$10$rQZ8K9LmN2pQ3rS4tU5vW.abcdefghijklmnopqrstuvwxyz123456', 'Admin', 'User', '+1234567890', '123 Admin St', 'Admin City', 'AC', '12345', 'USA', 1);

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, address, city, state, zip_code, country, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'john.doe@example.com', '$2a$10$rQZ8K9LmN2pQ3rS4tU5vW.abcdefghijklmnopqrstuvwxyz123456', 'John', 'Doe', '+1234567891', '456 Main St', 'New York', 'NY', '10001', 'USA', 0);

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, address, city, state, zip_code, country, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'jane.smith@example.com', '$2a$10$rQZ8K9LmN2pQ3rS4tU5vW.abcdefghijklmnopqrstuvwxyz123456', 'Jane', 'Smith', '+1234567892', '789 Oak Ave', 'Los Angeles', 'CA', '90210', 'USA', 0);

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, address, city, state, zip_code, country, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'bob.wilson@example.com', '$2a$10$rQZ8K9LmN2pQ3rS4tU5vW.abcdefghijklmnopqrstuvwxyz123456', 'Bob', 'Wilson', '+1234567893', '321 Pine St', 'Chicago', 'IL', '60601', 'USA', 0);

-- Insert sample products
INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro', 'Latest iPhone with advanced camera system and A17 Pro chip', 999.99, 'Electronics', 'Apple', 'IPH15PRO-001', 50, '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'Samsung Galaxy S24', 'Premium Android smartphone with AI features', 899.99, 'Electronics', 'Samsung', 'SGS24-001', 30, '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'MacBook Pro 16"', 'Professional laptop with M3 Pro chip', 2499.99, 'Electronics', 'Apple', 'MBP16-001', 20, '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'Nike Air Max 270', 'Comfortable running shoes with Air Max technology', 150.00, 'Fashion', 'Nike', 'NAM270-001', 100, '550e8400-e29b-41d4-a716-446655440003');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440005', 'Adidas Ultraboost 22', 'High-performance running shoes', 180.00, 'Fashion', 'Adidas', 'AUB22-001', 75, '550e8400-e29b-41d4-a716-446655440003');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440006', 'Levi''s 501 Jeans', 'Classic straight-fit jeans', 89.99, 'Fashion', 'Levi''s', 'L501-001', 200, '550e8400-e29b-41d4-a716-446655440003');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440007', 'KitchenAid Stand Mixer', 'Professional stand mixer for baking', 299.99, 'Home & Kitchen', 'KitchenAid', 'KSM-001', 25, '550e8400-e29b-41d4-a716-446655440004');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440008', 'Dyson V15 Vacuum', 'Cordless vacuum with laser dust detection', 649.99, 'Home & Kitchen', 'Dyson', 'DV15-001', 15, '550e8400-e29b-41d4-a716-446655440004');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440009', 'Sony WH-1000XM5 Headphones', 'Noise-canceling wireless headphones', 399.99, 'Electronics', 'Sony', 'SWH1000XM5-001', 40, '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO products (id, name, description, price, category, brand, sku, stock_quantity, seller_id) VALUES
('660e8400-e29b-41d4-a716-446655440010', 'Patagonia Down Jacket', 'Warm and sustainable down jacket', 199.99, 'Fashion', 'Patagonia', 'PDJ-001', 60, '550e8400-e29b-41d4-a716-446655440003');

-- Insert product attributes
INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Color', 'Space Black');
INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Storage', '256GB');
INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Screen Size', '6.1 inch');

INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'Color', 'Titanium Black');
INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'Storage', '512GB');
INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', 'Screen Size', '6.2 inch');

INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440004', 'Size', '10');
INSERT INTO product_attributes (id, product_id, attribute_name, attribute_value) VALUES
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440004', 'Color', 'Black/White');

-- Insert product images
INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'https://example.com/images/iphone15pro-1.jpg', 'iPhone 15 Pro front view', 1, 1);
INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'https://example.com/images/iphone15pro-2.jpg', 'iPhone 15 Pro back view', 0, 2);

INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'https://example.com/images/galaxys24-1.jpg', 'Samsung Galaxy S24 front view', 1, 1);

INSERT INTO product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'https://example.com/images/nike-airmax-1.jpg', 'Nike Air Max 270 side view', 1, 1);

-- Insert sample reviews
INSERT INTO reviews (id, product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 5, 'Amazing phone!', 'The camera quality is incredible and the performance is smooth.', 1);

INSERT INTO reviews (id, product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 4, 'Great device', 'Love the new features, battery life could be better.', 1);

INSERT INTO reviews (id, product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 5, 'Very comfortable', 'Perfect for running, great cushioning and support.', 1);

INSERT INTO reviews (id, product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
('990e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 5, 'Excellent mixer', 'Makes baking so much easier, very powerful motor.', 1);

-- Insert sample cart items
INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 1);
INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440009', 2);

INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 1);
INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES
('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 1);

-- Insert sample orders
INSERT INTO orders (id, user_id, status, total_amount, shipping_address, billing_address, payment_method, payment_status, tracking_number) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'delivered', 1399.98, '456 Main St, New York, NY 10001', '456 Main St, New York, NY 10001', 'credit_card', 'paid', 'TRK123456789');

INSERT INTO orders (id, user_id, status, total_amount, shipping_address, billing_address, payment_method, payment_status, tracking_number) VALUES
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'shipped', 330.00, '789 Oak Ave, Los Angeles, CA 90210', '789 Oak Ave, Los Angeles, CA 90210', 'paypal', 'paid', 'TRK987654321');

-- Insert sample order items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1, 999.99, 999.99);
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
('cc0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440009', 1, 399.99, 399.99);

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
('cc0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 1, 150.00, 150.00);
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
('cc0e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440005', 1, 180.00, 180.00);

COMMIT;
