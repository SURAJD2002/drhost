-- ========================================
-- 🎯 PRICE VALIDATION CONSTRAINTS
-- Add constraints to prevent negative prices
-- ========================================

-- Add constraint to products table to ensure final price is not negative
ALTER TABLE products
ADD CONSTRAINT chk_products_final_price_not_negative
CHECK (
  price - COALESCE(discount_amount, 0) - COALESCE(commission_amount, 0) >= 0
);

-- Add constraint to product_variants table to ensure final price is not negative
ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_final_price_not_negative
CHECK (
  price - COALESCE(discount_amount, 0) - COALESCE(commission_amount, 0) >= 0
);

-- Add constraint to ensure price is not negative
ALTER TABLE products
ADD CONSTRAINT chk_products_price_not_negative
CHECK (price >= 0);

-- Add constraint to ensure discount_amount is not negative
ALTER TABLE products
ADD CONSTRAINT chk_products_discount_amount_not_negative
CHECK (COALESCE(discount_amount, 0) >= 0);

-- Add constraint to ensure commission_amount is not negative
ALTER TABLE products
ADD CONSTRAINT chk_products_commission_amount_not_negative
CHECK (COALESCE(commission_amount, 0) >= 0);

-- Add constraint to ensure original_price is not negative
ALTER TABLE products
ADD CONSTRAINT chk_products_original_price_not_negative
CHECK (COALESCE(original_price, 0) >= 0);

-- Add similar constraints for product_variants
ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_price_not_negative
CHECK (price >= 0);

ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_discount_amount_not_negative
CHECK (COALESCE(discount_amount, 0) >= 0);

ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_commission_amount_not_negative
CHECK (COALESCE(commission_amount, 0) >= 0);

ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_original_price_not_negative
CHECK (COALESCE(original_price, 0) >= 0);

-- Add constraint to ensure stock is not negative
ALTER TABLE products
ADD CONSTRAINT chk_products_stock_not_negative
CHECK (COALESCE(stock, 0) >= 0);

ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_stock_not_negative
CHECK (COALESCE(stock, 0) >= 0);

-- Add constraint to ensure commission doesn't exceed price
ALTER TABLE products
ADD CONSTRAINT chk_products_commission_not_exceed_price
CHECK (COALESCE(commission_amount, 0) <= price);

ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_commission_not_exceed_price
CHECK (COALESCE(commission_amount, 0) <= price);

-- Add constraint to ensure discount doesn't exceed price
ALTER TABLE products
ADD CONSTRAINT chk_products_discount_not_exceed_price
CHECK (COALESCE(discount_amount, 0) <= price);

ALTER TABLE product_variants
ADD CONSTRAINT chk_product_variants_discount_not_exceed_price
CHECK (COALESCE(discount_amount, 0) <= price);

-- Create a function to validate price calculations
CREATE OR REPLACE FUNCTION validate_price_calculation(
  p_price DECIMAL,
  p_discount_amount DECIMAL DEFAULT 0,
  p_commission_amount DECIMAL DEFAULT 0
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if any value is negative
  IF p_price < 0 OR p_discount_amount < 0 OR p_commission_amount < 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if commission exceeds price
  IF p_commission_amount > p_price THEN
    RETURN FALSE;
  END IF;
  
  -- Check if discount exceeds price
  IF p_discount_amount > p_price THEN
    RETURN FALSE;
  END IF;
  
  -- Check if final price would be negative
  IF (p_price - p_discount_amount - p_commission_amount) < 0 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to validate prices before insert/update
CREATE OR REPLACE FUNCTION validate_product_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate main product price
  IF NOT validate_price_calculation(
    NEW.price,
    COALESCE(NEW.discount_amount, 0),
    COALESCE(NEW.commission_amount, 0)
  ) THEN
    RAISE EXCEPTION 'Invalid price calculation: Final price cannot be negative or commission/discount exceeds price';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function for product_variants
CREATE OR REPLACE FUNCTION validate_variant_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate variant price
  IF NOT validate_price_calculation(
    NEW.price,
    COALESCE(NEW.discount_amount, 0),
    COALESCE(NEW.commission_amount, 0)
  ) THEN
    RAISE EXCEPTION 'Invalid variant price calculation: Final price cannot be negative or commission/discount exceeds price';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_validate_product_prices ON products;
CREATE TRIGGER trigger_validate_product_prices
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_prices();

DROP TRIGGER IF EXISTS trigger_validate_variant_prices ON product_variants;
CREATE TRIGGER trigger_validate_variant_prices
  BEFORE INSERT OR UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION validate_variant_prices();

-- Add comments for documentation
COMMENT ON CONSTRAINT chk_products_final_price_not_negative ON products IS 'Ensures final price (price - discount - commission) is not negative';
COMMENT ON CONSTRAINT chk_product_variants_final_price_not_negative ON product_variants IS 'Ensures final price (price - discount - commission) is not negative';
COMMENT ON FUNCTION validate_price_calculation IS 'Validates price calculations to prevent negative final prices';
COMMENT ON FUNCTION validate_product_prices IS 'Trigger function to validate product prices before insert/update';
COMMENT ON FUNCTION validate_variant_prices IS 'Trigger function to validate variant prices before insert/update';






