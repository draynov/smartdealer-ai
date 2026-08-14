import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface CarData {
  // Идентификация
  mobileId: string;
  url: string;
  
  // Основна информация
  brand: string;
  model: string;
  modification: string;
  title: string;
  price: string;
  priceEur: string;
  hasVat: boolean;
  
  // Местоположение и продавач
  location: string;
  sellerType: string; // Частно лице / Автокъща
  sellerName: string;
  phone: string;
  
  // Статус на обявата
  lastEdit: string;
  views: number;
  priceHistory: Array<{ date: string; price: string }>;
  
  // Технически данни
  productionDate: string; // Дата на производство
  year: string; // Година
  mileage: string; // Пробег
  engine: string; // Двигател
  cylinderVolume: string; // Кубатура [куб.см]
  power: string; // Мощност
  powerKw: string; // Мощност в kW
  euroStandard: string; // Евростандарт
  transmission: string; // Скоростна кутия
  category: string; // Категория (Комби, Седан и т.н.)
  condition: string; // Състояние (Нов/Употребяван/За части)
  color: string; // Цвят
  vin: string; // VIN номер
  
  // Хибрид/Електрически специфични
  electricRange: string; // Пробег с едно зареждане
  batteryCapacity: string; // Капацитет на батерията
  
  // Горива
  fuelType: string;
  fuelConsumption: string;
  
  // Описание
  description: string;
  descriptionRaw: string;
  
  // Екстри по категории
  features: {
    safety: string[]; // Безопасност
    other: string[]; // Други
    exterior: string[]; // Екстериор
    protection: string[]; // Защита
    interior: string[]; // Интериор
    comfort: string[]; // Комфорт
  };
  
  // Всички екстри (flat list)
  allFeatures: string[];
  
  // Снимки
  images: string[]; // Full-size versions
  thumbnails: string[]; // Small versions for grid
  imageCount: number;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('mobile.bg')) {
      return NextResponse.json(
        { error: 'Моля, предоставете валиден Mobile.bg URL' },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Charset': 'utf-8',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Не може да се зареди обявата' },
        { status: 500 }
      );
    }

    // Get the buffer and decode as windows-1251 (Mobile.bg uses this encoding)
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const html = decoder.decode(buffer);
    const $ = cheerio.load(html);

    // Extract car data with all fields
    const carData: CarData = {
      // Идентификация
      mobileId: 'Няма данни',
      url: url,
      
      // Основна информация
      brand: 'Няма данни',
      model: 'Няма данни',
      modification: 'Няма данни',
      title: 'Няма данни',
      price: 'Няма данни',
      priceEur: 'Няма данни',
      hasVat: false,
      
      // Местоположение и продавач
      location: 'Няма данни',
      sellerType: 'Няма данни',
      sellerName: 'Няма данни',
      phone: 'Няма данни',
      
      // Статус на обявата
      lastEdit: 'Няма данни',
      views: 0,
      priceHistory: [],
      
      // Технически данни
      productionDate: 'Няма данни',
      year: 'Няма данни',
      mileage: 'Няма данни',
      engine: 'Няма данни',
      cylinderVolume: 'Няма данни',
      power: 'Няма данни',
      powerKw: 'Няма данни',
      euroStandard: 'Няма данни',
      transmission: 'Няма данни',
      category: 'Няма данни',
      condition: 'Няма данни',
      color: 'Няма данни',
      vin: 'Няма данни',
      
      // Хибрид/Електрически
      electricRange: 'Няма данни',
      batteryCapacity: 'Няма данни',
      
      // Горива
      fuelType: 'Няма данни',
      fuelConsumption: 'Няма данни',
      
      // Описание
      description: 'Няма данни',
      descriptionRaw: 'Няма данни',
      
      // Екстри
      features: {
        safety: [],
        other: [],
        exterior: [],
        protection: [],
        interior: [],
        comfort: [],
      },
      allFeatures: [],
      
      // Снимки
      images: [],
      thumbnails: [],
      imageCount: 0,
    };

    // Mobile ID - извличаме от URL или от .obiava div
    const urlMatch = url.match(/obiava-(\d+)/);
    if (urlMatch) {
      carData.mobileId = urlMatch[1];
    }
    const obavaDiv = $('.obiava').first().text();
    const obavaMatch = obavaDiv.match(/Обява:\s*(\d+)/);
    if (obavaMatch) {
      carData.mobileId = obavaMatch[1];
    }

    // Title - Mobile.bg uses h1 with specific structure:
    // h1 contains: "Brand Model" as text node + span with modification
    const titleElement = $('h1').first();
    if (titleElement.length > 0) {
      // Get full title from h1 text (includes everything)
      let fullTitle = titleElement.text().trim();
      fullTitle = fullTitle.replace(/Обява:\s*\d+/g, '').trim();
      carData.title = fullTitle;

      // Extract brand + model from h1 text node (before span)
      const h1Html = titleElement.html() || '';
      const textBeforeSpan = h1Html.split('<span')[0].trim();
      if (textBeforeSpan) {
        // Split brand and model - first word (or hyphenated phrase) is brand
        const parts = textBeforeSpan.split(' ');
        if (parts.length >= 2) {
          // Handle brands like "Mercedes-Benz" (with hyphen)
          if (parts[0].includes('-')) {
            carData.brand = parts[0];
            carData.model = parts.slice(1).join(' ');
          } else {
            carData.brand = parts[0];
            carData.model = parts.slice(1).join(' ');
          }
        }
      }

      // Extract modification from span inside h1
      const modificationSpan = titleElement.find('span').first();
      if (modificationSpan.length > 0) {
        const modification = modificationSpan.text().trim();
        if (modification) {
          carData.modification = modification;
        }
      }
    }

    // Price - Mobile.bg uses .Price class (with capital P)
    const priceElement = $('.Price').first();
    if (priceElement.length > 0) {
      const priceText = priceElement.text().trim();
      carData.price = priceText;
      
      // Извличане на цена в EUR
      const eurMatch = priceText.match(/([\d\s]+)\s*€/);
      if (eurMatch) {
        carData.priceEur = eurMatch[1].trim();
      }
    }
    
    // Проверка за ДДС - в същата секция с цената
    const vatInfo = $('.PriceInfo, .Price').text();
    if (vatInfo.includes('ДДС') || vatInfo.includes('с включено ДДС') || vatInfo.includes('включено')) {
      carData.hasVat = true;
    }

    // Местоположение
    const locationElement = $('.carLocation, [class*="location"]').first();
    if (locationElement.length > 0) {
      carData.location = locationElement.text().replace(/намира се в|Намира се в/gi, '').trim();
    }

    // Информация за продавача
    const sellerInfo = $('.dealer2023, .contactsBox').first();
    const sellerTypeText = sellerInfo.text();
    if (sellerTypeText.includes('Частно лице')) {
      carData.sellerType = 'Частно лице';
    } else if (sellerTypeText.includes('Автокъща')) {
      carData.sellerType = 'Автокъща';
      const dealerName = sellerInfo.find('a').first().attr('title') || sellerInfo.find('a').first().text().trim();
      if (dealerName) carData.sellerName = dealerName;
    }
    
    // Телефон
    const phoneElement = $('.phone, [class*="phone"]').first();
    if (phoneElement.length > 0) {
      carData.phone = phoneElement.text().trim();
    }

    // Последна редакция и прегледи
    const statsText = $('.statistiki, .statistiki .text').first().text();
    const editMatch = statsText.match(/Редактирана\s+в\s+(\d{1,2}:\d{2}\s+часа\s+на\s+\d{2}\.\d{2}\.\d{4})/i);
    if (editMatch) {
      carData.lastEdit = editMatch[1];
    }
    const viewsMatch = statsText.match(/(\d+)\s*пъти/);
    if (viewsMatch) {
      carData.views = parseInt(viewsMatch[1]);
    }

    // Extract data from .item divs with .mpLabel and .mpInfo
    $('.item').each((_, element) => {
      const label = $(element).find('.mpLabel').text().trim();
      const value = $(element).find('.mpInfo').text().trim();

      if (label && value) {
        // Дата на производство / Година
        if (label.includes('Дата на производство') || label.includes('производство')) {
          carData.productionDate = value;
          if (carData.year === 'Няма данни') carData.year = value;
        } 
        // Пробег
        else if (label.includes('Пробег') || label.includes('[км]')) {
          carData.mileage = value;
        } 
        // Двигател
        else if (label.includes('Двигател')) {
          carData.engine = value;
          // Извличане на тип гориво
          if (value.includes('Дизел')) carData.fuelType = 'Дизел';
          else if (value.includes('Бензин')) carData.fuelType = 'Бензин';
          else if (value.includes('Хибрид')) carData.fuelType = 'Хибрид';
          else if (value.includes('Електро')) carData.fuelType = 'Електрически';
          else if (value.includes('Газ')) carData.fuelType = 'Газ';
        } 
        // Мощност
        else if (label.includes('Мощност')) {
          carData.power = value;
          // Извличане на kW ако има
          const kwMatch = value.match(/(\d+)\s*kW/i);
          if (kwMatch) {
            carData.powerKw = kwMatch[1] + ' kW';
          } else {
            // Конвертиране от к.с. в kW ако няма kW в текста
            const hpMatch = value.match(/(\d+)\s*к\.с\./i);
            if (hpMatch) {
              const hp = parseInt(hpMatch[1]);
              const kw = Math.round(hp * 0.7355); // 1 к.с. = 0.7355 kW
              carData.powerKw = kw + ' kW';
            }
          }
        } 
        // Скоростна кутия
        else if (label.includes('Скоростна') || label.includes('кутия')) {
          carData.transmission = value;
        }
        // Евростандарт
        else if (label.includes('Евростандарт')) {
          carData.euroStandard = value;
        }
        // Категория
        else if (label.includes('Категория')) {
          carData.category = value;
        }
        // Кубатура [куб.см]
        else if (label.includes('Кубатура') || label.includes('куб.см')) {
          carData.cylinderVolume = value;
        }
        // Състояние
        else if (label.includes('Състояние')) {
          carData.condition = value;
        }
        // Модификация
        else if (label.includes('Модификация')) {
          carData.modification = value;
        }
        // Електрически пробег
        else if (label.includes('едно зареждане') || label.includes('WLTP')) {
          carData.electricRange = value;
        }
        // Батерия
        else if (label.includes('Капацитет на батерията') || label.includes('kWh')) {
          carData.batteryCapacity = value;
        }
      }
    });

    // Also check technical data section (different structure - simple divs)
    $('.borderBox .item').each((_, element) => {
      const divs = $(element).find('div');
      if (divs.length === 2) {
        const label = $(divs[0]).text().trim();
        const value = $(divs[1]).text().trim();

        if (label && value) {
          if (label.includes('Цвят')) {
            carData.color = value;
          } else if (label.includes('VIN')) {
            carData.vin = value;
          } else if (label.includes('Категория')) {
            carData.category = value;
          } else if (label.includes('Дата на производство') && carData.productionDate === 'Няма данни') {
            carData.productionDate = value;
            if (carData.year === 'Няма данни') carData.year = value;
          } else if (label.includes('Пробег') && !label.includes('зареждане') && carData.mileage === 'Няма данни') {
            carData.mileage = value;
          } else if (label.includes('Двигател') && carData.engine === 'Няма данни') {
            carData.engine = value;
          } else if (label.includes('Мощност') && carData.power === 'Няма данни') {
            carData.power = value;
            // Конвертиране от к.с. в kW ако powerKw все още е "Няма данни"
            if (carData.powerKw === 'Няма данни') {
              const kwMatch = value.match(/(\d+)\s*kW/i);
              if (kwMatch) {
                carData.powerKw = kwMatch[1] + ' kW';
              } else {
                const hpMatch = value.match(/(\d+)\s*к\.с\./i);
                if (hpMatch) {
                  const hp = parseInt(hpMatch[1]);
                  const kw = Math.round(hp * 0.7355);
                  carData.powerKw = kw + ' kW';
                }
              }
            }
          } else if (label.includes('Скоростна') && carData.transmission === 'Няма данни') {
            carData.transmission = value;
          } else if (label.includes('едно зареждане') || label.includes('WLTP')) {
            carData.electricRange = value;
          } else if (label.includes('Капацитет на батерията')) {
            carData.batteryCapacity = value;
          } else if (label.includes('Състояние')) {
            carData.condition = value;
          } else if (label.includes('Кубатура') || label.includes('куб.см')) {
            carData.cylinderVolume = value;
          }
        }
      }
    });

    // Description - "Допълнителна информация" section
    const moreInfoSection = $('.moreInfo').first();
    if (moreInfoSection.length > 0) {
      // Get the full text content
      let descText = moreInfoSection.text().trim();
      // Remove the "Допълнителна информация" heading if present
      descText = descText.replace(/^Допълнителна информация\s*/i, '').trim();
      carData.descriptionRaw = descText;
      carData.description = descText || 'Няма данни';
    }

    // Екстри - Mobile.bg shows all features in one list without categories
    // We'll extract all features and categorize them in the UI based on our master list
    $('.carExtri .items > div').each((_, item) => {
      const feature = $(item).text().trim();
      if (feature) {
        carData.allFeatures.push(feature);
      }
    });
    
    // Categorize features based on our master list
    const {ALL_FEATURES} = await import('../../constants/features');
    
    carData.allFeatures.forEach(feature => {
      const normalized = feature.toLowerCase().trim();
      
      // Check which category this feature belongs to
      if (ALL_FEATURES.safety.some(f => f.toLowerCase().trim() === normalized)) {
        if (!carData.features.safety.includes(feature)) carData.features.safety.push(feature);
      } else if (ALL_FEATURES.comfort.some(f => f.toLowerCase().trim() === normalized)) {
        if (!carData.features.comfort.includes(feature)) carData.features.comfort.push(feature);
      } else if (ALL_FEATURES.exterior.some(f => f.toLowerCase().trim() === normalized)) {
        if (!carData.features.exterior.includes(feature)) carData.features.exterior.push(feature);
      } else if (ALL_FEATURES.interior.some(f => f.toLowerCase().trim() === normalized)) {
        if (!carData.features.interior.includes(feature)) carData.features.interior.push(feature);
      } else if (ALL_FEATURES.protection.some(f => f.toLowerCase().trim() === normalized)) {
        if (!carData.features.protection.includes(feature)) carData.features.protection.push(feature);
      } else if (ALL_FEATURES.other.some(f => f.toLowerCase().trim() === normalized)) {
        if (!carData.features.other.includes(feature)) carData.features.other.push(feature);
      }
    });

    // Images - extract both thumbnails and full-size versions
    // Get thumbnails from gallery and convert to full-size URLs
    $('.smallPicturesGallery img, #pictures_moving_details_small img').each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src');
      if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('captcha')) {
        // Convert relative URLs to absolute
        let thumbnailUrl = src;
        if (src.startsWith('//')) {
          thumbnailUrl = `https:${src}`;
        } else if (!src.startsWith('http')) {
          thumbnailUrl = `https://www.mobile.bg${src}`;
        }
        
        // Try to find corresponding full-size image or convert URL
        // FROM: https://mobistatic4.focus.bg/mobile/photosorg/529/1/11786020793638529_WW.webp
        // TO:   https://mobistatic4.focus.bg/mobile/photosorg/529/1/big1/11786020793638529_WW.webp
        // Just add /big1/ before the filename
        const parts = thumbnailUrl.split('/');
        const filename = parts.pop();
        const fullSizeUrl = parts.join('/') + '/big1/' + filename;
        
        if (!carData.thumbnails.includes(thumbnailUrl)) {
          carData.thumbnails.push(thumbnailUrl);
          carData.images.push(fullSizeUrl);
        }
      }
    });
    
    carData.imageCount = carData.images.length;

    return NextResponse.json(carData);
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Грешка при извличане на данните' },
      { status: 500 }
    );
  }
}
