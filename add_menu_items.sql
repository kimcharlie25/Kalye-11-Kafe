-- =============================================================================
-- KALYE 11 KAFE - MENU ITEMS SQL
-- =============================================================================
-- Run this in Supabase SQL Editor to add all menu items
-- IDs are auto-generated using gen_random_uuid()
-- =============================================================================

-- First, add the categories (if they don't exist)
INSERT INTO categories (name, icon, sort_order, active) VALUES
  ('Pizza', '🍕', 1, true),
  ('Munchies', '🍟', 2, true),
  ('Burgers', '🍔', 3, true),
  ('Pasta', '🍝', 4, true),
  ('Wraps', '🌯', 5, true),
  ('Waffles', '🧇', 6, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- PIZZA
-- =============================================================================
INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
  ('Creamy Spinach Pizza', 'Delicious pizza topped with creamy spinach', 190, 'Pizza', false, true),
  ('Chicken BBQ Pizza', 'BBQ chicken pizza with tangy sauce', 190, 'Pizza', true, true),
  ('Pizza Margherita', 'Classic Italian pizza with tomato and mozzarella', 180, 'Pizza', false, true),
  ('Spanish Sardines Pizza', 'Unique pizza topped with Spanish sardines', 190, 'Pizza', false, true),
  ('Stuffed Pizza', 'Loaded stuffed crust pizza', 190, 'Pizza', false, true),
  ('Apple & Sausage Pizza', 'Sweet and savory apple sausage combination', 200, 'Pizza', false, true),
  ('Ham & Queso de Bola', 'Ham pizza with Filipino cheese topping', 220, 'Pizza', true, true),
  ('Quatro Formaggi', 'Four cheese pizza delight', 180, 'Pizza', false, true),
  ('Nutella Campfire Pizza', 'Sweet dessert pizza with Nutella', 160, 'Pizza', false, true);

-- =============================================================================
-- MUNCHIES
-- =============================================================================
INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
  ('Parmesan Fries', 'Crispy fries with parmesan cheese', 120, 'Munchies', false, true),
  ('Baked Nachos', 'Loaded baked nachos with toppings', 160, 'Munchies', true, true),
  ('Spam Fritters', 'Crispy fried spam fritters', 150, 'Munchies', false, true),
  ('Chix Spam Fritters', 'Chicken and spam fritters combo', 160, 'Munchies', false, true),
  ('Mozzarella Sticks', 'Golden fried mozzarella sticks', 170, 'Munchies', true, true),
  ('Nuggets & Fries', 'Chicken nuggets served with fries', 180, 'Munchies', false, true),
  ('Mojos', 'Seasoned potato mojos', 180, 'Munchies', false, true),
  ('Dirty Fries', 'Fries with beef, cheese sauce, and BBQ sauce', 220, 'Munchies', true, true);

-- =============================================================================
-- BURGERS
-- =============================================================================
INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
  ('Chicken Burger', 'Classic chicken patty burger', 130, 'Burgers', false, true),
  ('Sriracha Chicken Burger', 'Spicy sriracha chicken burger', 140, 'Burgers', false, true),
  ('Chicken Nuggets Burger', 'Burger with crispy chicken nuggets', 140, 'Burgers', false, true),
  ('Chicken Chicken Burger', 'Double chicken patty burger', 160, 'Burgers', true, true),
  ('Grilled Chicken Aloha Burger', 'Hawaiian style grilled chicken burger', 150, 'Burgers', false, true),
  ('Smash Burger', 'Crispy smashed beef patty burger', 140, 'Burgers', true, true),
  ('Meatless Burger', 'Plant-based vegetarian burger 🌱', 140, 'Burgers', false, true),
  ('Italian Garlic Sausage', 'Italian sausage with garlic', 150, 'Burgers', false, true);

-- =============================================================================
-- PASTA
-- =============================================================================
INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
  ('Meatball Spaghetti', 'Classic spaghetti with meatballs', 140, 'Pasta', true, true),
  ('Chicken Pesto Pasta', 'Creamy pesto pasta with chicken', 140, 'Pasta', false, true),
  ('Creamy Sausage Pasta', 'Rich creamy pasta with sausage', 160, 'Pasta', false, true),
  ('Charlie Chan Pasta', 'Asian-inspired Charlie Chan pasta', 140, 'Pasta', true, true),
  ('Spanish Sardines Pasta', 'Pasta with Spanish sardines', 140, 'Pasta', false, true),
  ('Mac & Cheese', 'Creamy macaroni and cheese', 160, 'Pasta', true, true),
  ('Salted Egg Carbonara', 'Carbonara with salted egg twist', 140, 'Pasta', false, true);

-- =============================================================================
-- WRAPS
-- =============================================================================
INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
  ('Beef Tacos', 'Seasoned beef tacos', 65, 'Wraps', false, true),
  ('Breakfast Quesadilla', 'Morning quesadilla with eggs and cheese', 150, 'Wraps', false, true),
  ('4 Cheese Quesadilla', 'Four cheese loaded quesadilla', 160, 'Wraps', true, true),
  ('Beef & Bean Quesadilla', 'Hearty beef and bean quesadilla', 140, 'Wraps', false, true),
  ('Fried Chicken Quesadilla', 'Crispy fried chicken quesadilla', 140, 'Wraps', false, true),
  ('Spicy Tuna Quesadilla', 'Spicy tuna filled quesadilla', 140, 'Wraps', false, true),
  ('French Tacos', 'French-style tacos wrap', 160, 'Wraps', false, true);

-- =============================================================================
-- WAFFLES
-- =============================================================================
INSERT INTO menu_items (name, description, base_price, category, popular, available) VALUES
  ('Strawberry Matcha', 'Waffle with strawberry and matcha', 130, 'Waffles', false, true),
  ('Caramelized Spam & Waffles', 'Sweet caramelized spam with waffles', 160, 'Waffles', true, true),
  ('Chicken & Waffles', 'Classic chicken and waffles combo', 160, 'Waffles', true, true),
  ('Ham & Cheese Waffle', 'Savory ham and cheese waffle', 160, 'Waffles', false, true),
  ('Choco Chip Waffle', 'Sweet chocolate chip waffle', 120, 'Waffles', false, true),
  ('Oreo Waffle', 'Waffle topped with Oreo cookies', 120, 'Waffles', false, true),
  ('Blueberry Waffle', 'Fresh blueberry topped waffle', 120, 'Waffles', false, true);

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Categories added: 6 (Pizza, Munchies, Burgers, Pasta, Wraps, Waffles)
-- Menu items added: 48 total
--   - Pizza: 9 items
--   - Munchies: 8 items
--   - Burgers: 8 items
--   - Pasta: 7 items
--   - Wraps: 7 items
--   - Waffles: 7 items
-- =============================================================================
