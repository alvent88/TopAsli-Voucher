UPDATE users 
SET phone_number = '62' || phone_number 
WHERE phone_number IS NOT NULL 
  AND phone_number != '' 
  AND phone_number NOT LIKE '62%'
  AND phone_number NOT LIKE '+%';
