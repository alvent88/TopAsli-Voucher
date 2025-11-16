ALTER TABLE vouchers RENAME COLUMN claimed_by_email TO claimed_by_phone;

UPDATE vouchers 
SET claimed_by_phone = NULL 
WHERE claimed_by_phone LIKE '%@%';
