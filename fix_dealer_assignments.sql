-- 1. Виж дилъра katanaauto
SELECT id, name, slug, created_at 
FROM dealers 
WHERE slug = 'katanaauto';

-- 2. Виж последните 39 обяви и техните dealer_id
SELECT id, title, dealer_id, created_at, source_url
FROM vehicles 
ORDER BY created_at DESC 
LIMIT 39;

-- 3. Update последните 39 обяви да имат dealer_id на katanaauto (a4760aa3-ea4c-4688-9a4d-87a68b4ea792)

UPDATE vehicles
SET dealer_id = 'a4760aa3-ea4c-4688-9a4d-87a68b4ea792'
WHERE id IN (
  SELECT id 
  FROM vehicles 
  ORDER BY created_at DESC 
  LIMIT 39
);
