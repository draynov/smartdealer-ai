-- Migration: Refactor vehicle_features to use master features table
-- Date: 2026-08-14

-- ================================================
-- 1. CREATE FEATURES MASTER TABLE
-- ================================================
CREATE TABLE features (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('safety', 'comfort', 'exterior', 'interior', 'protection', 'other'))
);

-- ================================================
-- 2. INSERT ALL 96 FEATURES FROM Mobile.bg
-- ================================================

-- Safety (15)
INSERT INTO features (name, category) VALUES
  ('GPS система за проследяване', 'safety'),
  ('Адаптивни предни светлини', 'safety'),
  ('Антиблокираща система', 'safety'),
  ('Въздушни възглавници - Задни', 'safety'),
  ('Въздушни възглавници - Предни', 'safety'),
  ('Въздушни възглавници - Странични', 'safety'),
  ('Ел. разпределяне на спирачното усилие', 'safety'),
  ('Електронна програма за стабилизиране', 'safety'),
  ('Контрол на налягането на гумите', 'safety'),
  ('Парктроник', 'safety'),
  ('Система ISOFIX', 'safety'),
  ('Система за динамична устойчивост', 'safety'),
  ('Система за защита от пробуксуване', 'safety'),
  ('Система за контрол на дистанцията', 'safety'),
  ('Система за контрол на спускането', 'safety');

-- Comfort (35)
INSERT INTO features (name, category) VALUES
  ('360 camera \ Задна камера', 'comfort'),
  ('Apple CarPlay \ Android Auto', 'comfort'),
  ('Auto Start Stop function', 'comfort'),
  ('Bluetooth \ handsfree система', 'comfort'),
  ('DVD, TV', 'comfort'),
  ('Head up display', 'comfort'),
  ('Steptronic, Tiptronic', 'comfort'),
  ('USB, audio\video, IN\AUX изводи', 'comfort'),
  ('Автоматично затваряне на багажника', 'comfort'),
  ('Адаптивно въздушно окачване', 'comfort'),
  ('Безключово палене', 'comfort'),
  ('Блокаж на диференциала', 'comfort'),
  ('Бордкомпютър', 'comfort'),
  ('Бързи/бавни скорости', 'comfort'),
  ('Вентилация на седалките', 'comfort'),
  ('Датчик за светлина', 'comfort'),
  ('Ел. Огледала', 'comfort'),
  ('Ел. Стъкла', 'comfort'),
  ('Ел. регулиране на седалките', 'comfort'),
  ('Ел. усилвател на волана', 'comfort'),
  ('Климатик', 'comfort'),
  ('Климатроник', 'comfort'),
  ('Мултифункционален волан', 'comfort'),
  ('Навигация', 'comfort'),
  ('Отопление на волана', 'comfort'),
  ('Печка', 'comfort'),
  ('Подгряване на предното стъкло', 'comfort'),
  ('Подгряване на седалките', 'comfort'),
  ('Регулиране на волана', 'comfort'),
  ('Сензор за дъжд', 'comfort'),
  ('Серво усилвател на волана', 'comfort'),
  ('Система за измиване на фаровете', 'comfort'),
  ('Система за контрол на скоростта (автопилот)', 'comfort'),
  ('Термопомпа', 'comfort'),
  ('Хладилна жабка', 'comfort');

-- Other (17)
INSERT INTO features (name, category) VALUES
  ('4x4', 'other'),
  ('7 места', 'other'),
  ('Buy back', 'other'),
  ('Бартер', 'other'),
  ('Газова уредба', 'other'),
  ('Дълга база', 'other'),
  ('Капариран\Продаден', 'other'),
  ('Катастрофирал', 'other'),
  ('Къса база', 'other'),
  ('Лизинг', 'other'),
  ('Метанова уредба', 'other'),
  ('На части', 'other'),
  ('Напълно обслужен', 'other'),
  ('Нов внос', 'other'),
  ('С регистрация', 'other'),
  ('Сервизна книжка', 'other'),
  ('Тунинг', 'other');

-- Exterior (12)
INSERT INTO features (name, category) VALUES
  ('2(3) Врати', 'exterior'),
  ('4(5) Врати', 'exterior'),
  ('LED фарове', 'exterior'),
  ('Ксенонови фарове', 'exterior'),
  ('Лети джанти', 'exterior'),
  ('Металик', 'exterior'),
  ('Панорамен люк', 'exterior'),
  ('Рейлинг на покрива', 'exterior'),
  ('Спойлери', 'exterior'),
  ('Теглич', 'exterior'),
  ('Халогенни фарове', 'exterior'),
  ('Шибедах', 'exterior');

-- Protection (6)
INSERT INTO features (name, category) VALUES
  ('OFFROAD пакет', 'protection'),
  ('Аларма', 'protection'),
  ('Брониран', 'protection'),
  ('Каско', 'protection'),
  ('Лебедка', 'protection'),
  ('Централно заключване', 'protection');

-- Interior (4)
INSERT INTO features (name, category) VALUES
  ('Велурен салон', 'interior'),
  ('Десен волан', 'interior'),
  ('Кожен салон', 'interior'),
  ('Светъл салон', 'interior');

-- ================================================
-- 3. DROP OLD VEHICLE_FEATURES TABLE
-- ================================================
DROP TABLE IF EXISTS vehicle_features CASCADE;

-- ================================================
-- 4. CREATE NEW VEHICLE_FEATURES WITH FEATURE_ID
-- ================================================
CREATE TABLE vehicle_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vehicle_id, feature_id)
);

-- ================================================
-- 5. INDEXES
-- ================================================
CREATE INDEX idx_vehicle_features_vehicle_id ON vehicle_features(vehicle_id);
CREATE INDEX idx_vehicle_features_feature_id ON vehicle_features(feature_id);
CREATE INDEX idx_features_category ON features(category);
CREATE INDEX idx_features_name ON features(name);

-- ================================================
-- 6. COMMENTS
-- ================================================
COMMENT ON TABLE features IS 'Master таблица с всички 96 възможни екстри от Mobile.bg';
COMMENT ON TABLE vehicle_features IS 'Връзка между автомобили и екстри (само избраните)';
