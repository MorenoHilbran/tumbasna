-- Migration: Add delivery scheduling and multi-supplier support
-- Date: 2026-07-13

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(50),
ADD COLUMN IF NOT EXISTS buyer_address TEXT,
ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS buyer_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS supplier_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_zone VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_group_id UUID;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_city ON orders(buyer_city);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_city ON orders(supplier_city);
CREATE INDEX IF NOT EXISTS idx_orders_payment_group ON orders(payment_group_id);

-- Create payment_groups table for multi-supplier checkout
CREATE TABLE IF NOT EXISTS payment_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  service_fee DECIMAL(12,2) DEFAULT 2000,
  payment_method VARCHAR(50) DEFAULT 'QRIS',
  status VARCHAR(50) DEFAULT 'PENDING',
  midtrans_order_id VARCHAR(255) UNIQUE,
  qr_string TEXT,
  va_number VARCHAR(100),
  expired_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_groups_buyer ON payment_groups(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_groups_midtrans ON payment_groups(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_groups_status ON payment_groups(status);

-- Add foreign key constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_payment_group 
FOREIGN KEY (payment_group_id) 
REFERENCES payment_groups(id) 
ON DELETE SET NULL;

-- Create supplier_delivery_settings table
CREATE TABLE IF NOT EXISTS supplier_delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  daily_capacity INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_user_id, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_supplier_delivery_user ON supplier_delivery_settings(supplier_user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_delivery_slot ON supplier_delivery_settings(time_slot);

-- Insert default delivery time slots for existing suppliers
INSERT INTO supplier_delivery_settings (supplier_user_id, time_slot, start_time, end_time, daily_capacity, is_enabled)
SELECT 
  id,
  'morning',
  '05:00:00'::TIME,
  '09:00:00'::TIME,
  10,
  true
FROM users 
WHERE role = 'PETANI'
ON CONFLICT (supplier_user_id, time_slot) DO NOTHING;

INSERT INTO supplier_delivery_settings (supplier_user_id, time_slot, start_time, end_time, daily_capacity, is_enabled)
SELECT 
  id,
  'midday',
  '10:00:00'::TIME,
  '13:00:00'::TIME,
  15,
  true
FROM users 
WHERE role = 'PETANI'
ON CONFLICT (supplier_user_id, time_slot) DO NOTHING;

INSERT INTO supplier_delivery_settings (supplier_user_id, time_slot, start_time, end_time, daily_capacity, is_enabled)
SELECT 
  id,
  'afternoon',
  '14:00:00'::TIME,
  '18:00:00'::TIME,
  12,
  true
FROM users 
WHERE role = 'PETANI'
ON CONFLICT (supplier_user_id, time_slot) DO NOTHING;

INSERT INTO supplier_delivery_settings (supplier_user_id, time_slot, start_time, end_time, daily_capacity, is_enabled)
SELECT 
  id,
  'evening',
  '19:00:00'::TIME,
  '21:00:00'::TIME,
  8,
  true
FROM users 
WHERE role = 'PETANI'
ON CONFLICT (supplier_user_id, time_slot) DO NOTHING;

-- Create supplier_blocked_dates table
CREATE TABLE IF NOT EXISTS supplier_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_user_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_user ON supplier_blocked_dates(supplier_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON supplier_blocked_dates(blocked_date);

-- Add payment_method column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'QRIS',
ADD COLUMN IF NOT EXISTS admin_fee DECIMAL(12,2) DEFAULT 0;

-- Create notification_queue table (for failed WA notifications)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(type);

-- Update existing orders with default values
UPDATE orders 
SET 
  buyer_city = COALESCE(
    SPLIT_PART(supplier_location, ',', 1),
    'Banyumas'
  ),
  supplier_city = COALESCE(
    SPLIT_PART(supplier_location, ',', 1),
    'Banyumas'
  ),
  shipping_zone = 'same_city'
WHERE buyer_city IS NULL OR supplier_city IS NULL;

COMMENT ON TABLE payment_groups IS 'Groups multiple orders into single payment transaction';
COMMENT ON TABLE supplier_delivery_settings IS 'Supplier delivery time slot configuration';
COMMENT ON TABLE supplier_blocked_dates IS 'Dates when supplier cannot deliver';
COMMENT ON TABLE notification_queue IS 'Queue for failed WhatsApp notifications';

-- Migration completed
