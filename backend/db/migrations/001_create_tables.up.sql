CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  icon_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE packages (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount BIGINT NOT NULL,
  unit TEXT NOT NULL,
  price BIGINT NOT NULL,
  discount_price BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  fee_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  fee_fixed BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  package_id BIGINT NOT NULL REFERENCES packages(id),
  payment_method_id BIGINT NOT NULL REFERENCES payment_methods(id),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  amount BIGINT NOT NULL,
  price BIGINT NOT NULL,
  fee BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_packages_product_id ON packages(product_id);

INSERT INTO products (name, slug, category, description, icon_url) VALUES
  ('Mobile Legends', 'mobile-legends', 'MOBA', 'Top up Diamond Mobile Legends dengan cepat dan aman', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200'),
  ('Free Fire', 'free-fire', 'Battle Royale', 'Top up Diamond Free Fire instant', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200'),
  ('PUBG Mobile', 'pubg-mobile', 'Battle Royale', 'Top up UC PUBG Mobile terpercaya', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200'),
  ('Genshin Impact', 'genshin-impact', 'RPG', 'Top up Genesis Crystal Genshin Impact', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200');

INSERT INTO packages (product_id, name, amount, unit, price) VALUES
  (1, '86 Diamonds', 86, 'Diamonds', 20000),
  (1, '172 Diamonds', 172, 'Diamonds', 40000),
  (1, '257 Diamonds', 257, 'Diamonds', 60000),
  (1, '344 Diamonds', 344, 'Diamonds', 80000),
  (1, '429 Diamonds', 429, 'Diamonds', 100000),
  (2, '50 Diamonds', 50, 'Diamonds', 10000),
  (2, '100 Diamonds', 100, 'Diamonds', 20000),
  (2, '210 Diamonds', 210, 'Diamonds', 40000),
  (3, '60 UC', 60, 'UC', 15000),
  (3, '325 UC', 325, 'UC', 75000),
  (4, '60 Genesis Crystals', 60, 'Genesis Crystals', 15000),
  (4, '330 Genesis Crystals', 330, 'Genesis Crystals', 75000);

INSERT INTO payment_methods (name, code, fee_percent, fee_fixed) VALUES
  ('QRIS', 'QRIS', 0.7, 0),
  ('Virtual Account BCA', 'VA_BCA', 0, 4000),
  ('Virtual Account BNI', 'VA_BNI', 0, 4000),
  ('Virtual Account Mandiri', 'VA_MANDIRI', 0, 4000),
  ('GoPay', 'GOPAY', 2, 0),
  ('OVO', 'OVO', 2, 0),
  ('DANA', 'DANA', 1.5, 0);
