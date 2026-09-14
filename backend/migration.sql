CREATE TABLE IF NOT EXISTS price_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price_per_km DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO price_rates (name, price_per_km) VALUES ('Tarifa Normal', 150.00);

ALTER TABLE routes ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS price_rate_id UUID REFERENCES price_rates(id);

ALTER TABLE trips ADD COLUMN IF NOT EXISTS price_rate_id UUID REFERENCES price_rates(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);
