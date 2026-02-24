/*
  =============================================================================
  RESTAURANT ORDERING SYSTEM - COMPLETE DATABASE SCHEMA
  =============================================================================
  
  A full-featured restaurant/cafe ordering system built for Supabase (PostgreSQL)
  
  Features:
  - Menu items with variations and add-ons
  - Discount pricing with date ranges
  - Inventory tracking with automatic availability
  - Orders with order items
  - Payment methods with QR codes
  - Site settings for dynamic configuration
  - Tables management for QR-based dine-in ordering
  - Row Level Security (RLS) policies
  - Real-time subscriptions support
  
  =============================================================================
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- MENU ITEMS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  category text NOT NULL,
  popular boolean DEFAULT false,
  available boolean DEFAULT true,
  image_url text,
  
  -- Discount pricing
  discount_price decimal(10,2),
  discount_start_date timestamptz,
  discount_end_date timestamptz,
  discount_active boolean DEFAULT false,
  
  -- Inventory tracking
  track_inventory boolean NOT NULL DEFAULT false,
  stock_quantity integer,
  low_stock_threshold integer NOT NULL DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory constraints
ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_stock_quantity_non_negative
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_low_stock_threshold_non_negative
  CHECK (low_stock_threshold >= 0);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read menu items"
  ON menu_items FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_active ON menu_items(discount_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_dates ON menu_items(discount_start_date, discount_end_date);

-- =============================================================================
-- VARIATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read variations"
  ON variations FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage variations"
  ON variations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- ADD-ONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read add-ons"
  ON add_ons FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage add-ons"
  ON add_ons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ORDERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number serial,
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('dine-in','pickup','delivery')),
  address text,
  pickup_time text,
  party_size integer,
  dine_in_time timestamptz,
  payment_method text NOT NULL,
  reference_number text,
  notes text,
  total numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  ip_address text,
  receipt_url text,
  table_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert orders"
  ON orders FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can select orders"
  ON orders FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage orders"
  ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON orders(table_number);

-- =============================================================================
-- ORDER ITEMS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  name text NOT NULL,
  variation jsonb,
  add_ons jsonb,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert order items"
  ON order_items FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can select order items"
  ON order_items FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage order items"
  ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =============================================================================
-- PAYMENT METHODS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  qr_code_url text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active payment methods"
  ON payment_methods FOR SELECT TO public USING (active = true);

CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SITE SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage site settings"
  ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLES (FOR QR CODE DINE-IN)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  qr_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tables"
  ON tables FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage tables"
  ON tables FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tables_qr_url ON tables(qr_url);

-- =============================================================================
-- MATERIALS TABLE (INVENTORY ITEMS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT '',
  unit text NOT NULL DEFAULT 'pc',
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read materials"
  ON materials FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage materials"
  ON materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SUPPLIERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL DEFAULT '',
  supplier_name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read suppliers"
  ON suppliers FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PURCHASES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 0,
  price_per_unit numeric(12,2) NOT NULL DEFAULT 0,
  total_paid numeric(12,2) NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read purchases"
  ON purchases FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage purchases"
  ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- RECIPES TABLE (COST PER SERVING)
-- =============================================================================

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  quantity_used numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recipes"
  ON recipes FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage recipes"
  ON recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- INVENTORY MANAGEMENT FUNCTIONS
-- =============================================================================

-- Auto-sync availability based on inventory
CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, false) THEN
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);

    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
      NEW.available := false;
    ELSE
      NEW.available := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_menu_item_availability ON menu_items;
CREATE TRIGGER trg_sync_menu_item_availability
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW EXECUTE FUNCTION sync_menu_item_availability();

-- Batch decrement stock quantities
CREATE OR REPLACE FUNCTION decrement_menu_item_stock(items jsonb)
RETURNS void AS $$
DECLARE
  entry jsonb;
  qty integer;
BEGIN
  IF items IS NULL THEN RETURN; END IF;

  FOR entry IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    qty := GREATEST(COALESCE((entry->>'quantity')::integer, 0), 0);
    IF qty <= 0 THEN CONTINUE; END IF;

    UPDATE menu_items
    SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - qty, 0)
    WHERE track_inventory = true AND id::text = entry->>'id';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION decrement_menu_item_stock(jsonb) TO anon, authenticated;

-- =============================================================================
-- DISCOUNT PRICING FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION is_discount_active(
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS boolean AS $$
BEGIN
  IF NOT discount_active THEN RETURN false; END IF;
  IF discount_start_date IS NULL AND discount_end_date IS NULL THEN RETURN discount_active; END IF;
  RETURN (
    (discount_start_date IS NULL OR now() >= discount_start_date) AND
    (discount_end_date IS NULL OR now() <= discount_end_date)
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_effective_price(
  base_price decimal,
  discount_price decimal,
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS decimal AS $$
BEGIN
  IF is_discount_active(discount_active, discount_start_date, discount_end_date) AND discount_price IS NOT NULL THEN
    RETURN discount_price;
  END IF;
  RETURN base_price;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ORDER SEARCH FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION search_orders(search_term text)
RETURNS SETOF orders AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM orders
  WHERE 
    customer_name ILIKE '%' || search_term || '%'
    OR contact_number ILIKE '%' || search_term || '%'
    OR reference_number ILIKE '%' || search_term || '%'
    OR CAST(order_number AS text) ILIKE '%' || search_term || '%'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DEFAULT SITE SETTINGS (RUN ONCE)
-- =============================================================================

INSERT INTO site_settings (id, value, type, description) VALUES
  ('site_name', 'My Restaurant', 'text', 'The name of the restaurant'),
  ('site_logo', '', 'image', 'The logo image URL for the site'),
  ('site_description', 'Welcome to our restaurant!', 'text', 'Short description'),
  ('currency', '₱', 'text', 'Currency symbol for prices'),
  ('currency_code', 'PHP', 'text', 'Currency code for payments')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DEFAULT PAYMENT METHODS (RUN ONCE)
-- =============================================================================

INSERT INTO payment_methods (id, name, account_number, account_name, qr_code_url, sort_order, active) VALUES
  ('cash', 'Cash', 'N/A', 'Pay at counter', '', 0, true),
  ('gcash', 'GCash', '09XX XXX XXXX', 'Your Name', '', 1, true),
  ('maya', 'Maya', '09XX XXX XXXX', 'Your Name', '', 2, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- REALTIME SUBSCRIPTIONS (Enable in Supabase Dashboard)
-- =============================================================================
-- Go to Database > Replication and enable the following tables:
-- - orders
-- - order_items
-- - menu_items
-- - categories

-- =============================================================================
-- STORAGE BUCKET FOR IMAGES (Run via Supabase Dashboard SQL Editor)
-- =============================================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'menu-images',
--   'menu-images',
--   true,
--   5242880,
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- ) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
