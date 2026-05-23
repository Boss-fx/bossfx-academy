-- ============================================================
-- BossFx Academy — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Orders: single source of truth for all purchases
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flw_transaction_id  TEXT UNIQUE,
    flw_ref             TEXT,
    tx_ref              TEXT NOT NULL,
    product_id          TEXT NOT NULL,
    product_name        TEXT NOT NULL,
    product_type        TEXT NOT NULL,
    amount              NUMERIC(12,2) NOT NULL,
    currency            TEXT DEFAULT 'NGN',
    status              TEXT DEFAULT 'completed',
    customer_email      TEXT NOT NULL,
    customer_name       TEXT,
    customer_phone      TEXT,
    payment_method      TEXT,
    meta                JSONB DEFAULT '{}',
    fulfilled           BOOLEAN DEFAULT FALSE,
    fulfilled_at        TIMESTAMPTZ,
    email_sent          BOOLEAN DEFAULT FALSE,
    email_error         TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_flw_id ON orders(flw_transaction_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Access tokens: persistent download/access tokens
CREATE TABLE access_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
    token           TEXT UNIQUE NOT NULL,
    customer_email  TEXT NOT NULL,
    product_id      TEXT NOT NULL,
    product_type    TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_token ON access_tokens(token);
CREATE INDEX idx_tokens_email ON access_tokens(customer_email);
CREATE INDEX idx_tokens_order ON access_tokens(order_id);

-- Downloads: track every file download
CREATE TABLE downloads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id),
    token_id        UUID REFERENCES access_tokens(id),
    customer_email  TEXT NOT NULL,
    product_id      TEXT NOT NULL,
    file_key        TEXT NOT NULL,
    file_name       TEXT NOT NULL,
    ip_address      TEXT,
    user_agent      TEXT,
    downloaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_downloads_order ON downloads(order_id);
CREATE INDEX idx_downloads_email ON downloads(customer_email);
CREATE INDEX idx_downloads_product ON downloads(product_id);

-- Product files: maps products to downloadable files in Supabase Storage
CREATE TABLE product_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  TEXT NOT NULL,
    file_key    TEXT NOT NULL,
    file_name   TEXT NOT NULL,
    file_type   TEXT,
    file_size   BIGINT,
    sort_order  INTEGER DEFAULT 0,
    active      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_files_product ON product_files(product_id);

-- Mentorship bookings
CREATE TABLE mentorship_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id),
    customer_email  TEXT NOT NULL,
    customer_name   TEXT,
    product_id      TEXT NOT NULL,
    preferred_day   TEXT,
    preferred_time  TEXT,
    timezone        TEXT DEFAULT 'Africa/Lagos',
    communication   TEXT DEFAULT 'telegram',
    focus_area      TEXT,
    experience      TEXT,
    notes           TEXT,
    status          TEXT DEFAULT 'pending',
    confirmed_at    TIMESTAMPTZ,
    session_date    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_email ON mentorship_bookings(customer_email);
CREATE INDEX idx_bookings_status ON mentorship_bookings(status);
CREATE INDEX idx_bookings_order ON mentorship_bookings(order_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_bookings ENABLE ROW LEVEL SECURITY;

-- Service role (API functions) has full access
CREATE POLICY "service_role_all" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON access_tokens FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON downloads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON product_files FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON mentorship_bookings FOR ALL USING (auth.role() = 'service_role');

-- Authenticated admin can read all tables
CREATE POLICY "admin_read" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_read" ON access_tokens FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_read" ON downloads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_read" ON product_files FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_read" ON mentorship_bookings FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can update bookings (confirm, cancel, reschedule)
CREATE POLICY "admin_update_bookings" ON mentorship_bookings FOR UPDATE USING (auth.role() = 'authenticated');

-- Product files are publicly readable (metadata only, not the actual files)
CREATE POLICY "public_read_files" ON product_files FOR SELECT USING (true);

-- ============================================================
-- Seed product files
-- ============================================================

INSERT INTO product_files (product_id, file_key, file_name, file_type, sort_order) VALUES
    ('forex-101', 'forex-101/Forex_101_Beginner_Starter_Pack.pdf', 'Forex 101 Beginner Starter Pack', 'pdf', 1);

-- ============================================================
-- Supabase Storage bucket (run separately in Storage settings)
-- Or use this SQL:
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: only service_role can upload/manage
CREATE POLICY "service_upload" ON storage.objects FOR ALL USING (bucket_id = 'product-files' AND auth.role() = 'service_role');
