CREATE TABLE IF NOT EXISTS checkout_otps (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  method VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  product_id INTEGER NOT NULL,
  package_id INTEGER NOT NULL,
  game_user_id VARCHAR(255) NOT NULL,
  game_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkout_otps_transaction_id ON checkout_otps(transaction_id);
CREATE INDEX idx_checkout_otps_user_id ON checkout_otps(user_id);
