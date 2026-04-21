-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INT,
    used_count INT DEFAULT 0,
    min_order_value DECIMAL(10, 2),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create deals_of_day table
CREATE TABLE IF NOT EXISTS deals_of_day (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    original_price DECIMAL(10, 2) NOT NULL,
    deal_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(5, 2) NOT NULL, -- percentage
    deal_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create product_recommendations table
CREATE TABLE IF NOT EXISTS product_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reason_type VARCHAR(50) NOT NULL, -- 'viewed', 'similar', 'popular', 'trending'
    score DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create analytics_data table
CREATE TABLE IF NOT EXISTS analytics_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_orders INT DEFAULT 0,
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    total_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    average_order_value DECIMAL(10, 2) DEFAULT 0,
    cart_abandonment_rate DECIMAL(5, 2) DEFAULT 0,
    top_product VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create inventory_log table
CREATE TABLE IF NOT EXISTS inventory_log (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_stock INT NOT NULL,
    new_stock INT NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'order', 'restock', 'adjustment', 'damage'
    reason TEXT,
    changed_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_discount_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_deals_product_id ON deals_of_day(product_id);
CREATE INDEX IF NOT EXISTS idx_deals_date ON deals_of_day(deal_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON product_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_product_id ON inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_date ON inventory_log(created_at);
