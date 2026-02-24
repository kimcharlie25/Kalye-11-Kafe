-- =============================================================================
-- INVENTORY MANAGEMENT REDESIGN MIGRATION
-- =============================================================================
-- Run this in the Supabase SQL Editor.
-- Adds: category column to materials, suppliers table, purchases table, recipes table

-- 1. Add category column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS category text DEFAULT '';

-- 2. Create suppliers table
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

-- 3. Create purchases table
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

-- 4. Create recipes table (for Cost Per Serving)
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
-- END OF MIGRATION
-- =============================================================================
