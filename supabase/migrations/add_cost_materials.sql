-- Migration: Add materials inventory table for tracking raw materials/supplies
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  stock_quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'pc',
  low_stock_threshold NUMERIC DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON materials
  FOR ALL USING (true) WITH CHECK (true);
