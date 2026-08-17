# План: Импорт на всички обяви от Mobile.bg автокъща

## Архитектура на Mobile.bg dealer профили

### URL структура:
```
Dealer Profile: https://{dealer-slug}.mobile.bg/
Listing Page:   https://{dealer-slug}.mobile.bg/obiavi
Car Detail:     https://{dealer-slug}.mobile.bg/obiavi/{car-id}

Примери:
https://avtomarket.mobile.bg/
https://avtomarket.mobile.bg/obiavi
https://avtomarket.mobile.bg/obiavi/mercedes-benz-c-220-id11786020793638529
```

### Pagination:
```
Страница 1: https://{dealer-slug}.mobile.bg/obiavi
Страница 2: https://{dealer-slug}.mobile.bg/obiavi?currentPage=2
Страница 3: https://{dealer-slug}.mobile.bg/obiavi?currentPage=3
```

---

## Етапи на разработка

### 1. Research & Discovery (10-15 мин)
**Цел:** Разбери HTML структурата на листинг страницата

**Задачи:**
- [ ] Отвори примерен dealer профил в browser
- [ ] Inspect HTML на `/obiavi` страницата
- [ ] Намери CSS селектори за:
  - Линкове към обяви (`.obiaviListItem a` или подобен)
  - Pagination (`.pages`, `.pager`, или подобен)
  - Брой обяви (може да пише "Показани 1-20 от 45" и т.н.)

**Expected HTML patterns:**
```html
<!-- Списък с обяви -->
<div class="obiaviListItem">
  <a href="/obiavi/mercedes-c-300-id123456">...</a>
</div>

<!-- Pagination -->
<div class="pages">
  <a href="?currentPage=2">2</a>
  <a href="?currentPage=3">3</a>
</div>
```

---

### 2. API Endpoint: `/api/scrape-dealer-listing`
**Цел:** Scrape списъка с обяви от dealer профил

**Input:**
```typescript
{
  "dealerUrl": "https://avtomarket.mobile.bg/",
  "page": 1  // optional, default 1
}
```

**Output:**
```typescript
{
  "dealerSlug": "avtomarket",
  "carUrls": [
    "https://avtomarket.mobile.bg/obiavi/mercedes-c-300-id123456",
    "https://avtomarket.mobile.bg/obiavi/bmw-x5-id789012",
    ...
  ],
  "totalCars": 45,
  "currentPage": 1,
  "totalPages": 3,
  "hasNextPage": true
}
```

**Implementation:**
```typescript
// src/app/api/scrape-dealer-listing/route.ts
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  const { dealerUrl, page = 1 } = await request.json();
  
  // 1. Parse dealer slug from URL
  const dealerSlug = new URL(dealerUrl).hostname.split('.')[0];
  
  // 2. Construct listing URL with pagination
  const listingUrl = `https://${dealerSlug}.mobile.bg/obiavi?currentPage=${page}`;
  
  // 3. Fetch with windows-1251 encoding
  const response = await fetch(listingUrl);
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('windows-1251');
  const html = decoder.decode(buffer);
  
  // 4. Parse with Cheerio
  const $ = cheerio.load(html);
  
  // 5. Extract car URLs (adjust selector based on research)
  const carUrls: string[] = [];
  $('.obiaviListItem a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/obiavi/')) {
      const fullUrl = href.startsWith('http') 
        ? href 
        : `https://${dealerSlug}.mobile.bg${href}`;
      carUrls.push(fullUrl);
    }
  });
  
  // 6. Extract pagination info (adjust selector)
  const totalPages = $('.pages a').length || 1;
  const hasNextPage = page < totalPages;
  
  return NextResponse.json({
    dealerSlug,
    carUrls,
    totalCars: carUrls.length * totalPages, // estimate
    currentPage: page,
    totalPages,
    hasNextPage
  });
}
```

---

### 3. API Endpoint: `/api/import-dealer`
**Цел:** Импорт на всички обяви от dealer профил

**Input:**
```typescript
{
  "dealerUrl": "https://avtomarket.mobile.bg/"
}
```

**Output (streaming progress):**
```typescript
// Server-Sent Events (SSE) за real-time progress
{
  "status": "listing",
  "message": "Зареждане на списък с обяви..."
}
{
  "status": "found",
  "totalCars": 45,
  "message": "Открити 45 обяви"
}
{
  "status": "progress",
  "current": 5,
  "total": 45,
  "message": "Импортирани 5 от 45..."
}
{
  "status": "complete",
  "imported": 45,
  "updated": 3,
  "new": 42,
  "errors": 0
}
```

**Implementation Strategy:**
```typescript
// Псевдокод
1. Call /api/scrape-dealer-listing for page 1
2. Get all car URLs from all pages (loop if pagination exists)
3. For each car URL:
   - Call existing /api/import-vehicle
   - Track success/failure
   - Send progress update to client
4. Return summary
```

**Options:**
- **Option A:** Server-Sent Events (SSE) за real-time streaming
- **Option B:** Background job + polling endpoint за status
- **Option C:** Simple batch import + final summary (simplest)

**Recommended:** Option C за MVP, Option A за production

---

### 4. UI: Страница `/import-dealer`
**Цел:** Form за импорт на dealer профил

**Layout:**
```
┌─────────────────────────────────────┐
│  Импорт от Mobile.bg автокъща       │
├─────────────────────────────────────┤
│                                     │
│  [Input: Dealer URL]                │
│  https://avtomarket.mobile.bg/      │
│                                     │
│  [Бутон: Импортирай всички обяви]   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Progress Bar: 15 / 45       │   │
│  │ ████████░░░░░░░░ 33%        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Нови:         12                   │
│  Актуализирани: 3                   │
│  Грешки:        0                   │
│                                     │
└─────────────────────────────────────┘
```

**Code structure:**
```typescript
// src/app/import-dealer/page.tsx
'use client';

export default function ImportDealerPage() {
  const [dealerUrl, setDealerUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);
  
  const handleImport = async () => {
    setImporting(true);
    
    // Call import API
    const response = await fetch('/api/import-dealer', {
      method: 'POST',
      body: JSON.stringify({ dealerUrl })
    });
    
    const data = await response.json();
    setResults(data);
    setImporting(false);
  };
  
  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Form + Progress + Results */}
    </div>
  );
}
```

---

### 5. Database: Dealer Management

**Задача:** Автоматично създаване/актуализиране на dealer запис

**Logic:**
```typescript
// При импорт на dealer профил:
1. Extract dealer slug от URL (напр. "avtomarket")
2. Scrape dealer info от профил страницата (име, лого, телефон)
3. Upsert в dealers таблица (INSERT or UPDATE based on slug)
4. Свързване на vehicles с dealer_id
```

**Schema reminder:**
```sql
CREATE TABLE dealers (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,  -- 'avtomarket'
  mobile_profile_url TEXT,   -- 'https://avtomarket.mobile.bg/'
  phone VARCHAR(50),
  email VARCHAR(255),
  city VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Опционални подобрения

### Rate Limiting
**Проблем:** Mobile.bg може да блокира при много заявки

**Решение:**
```typescript
// Delay между заявките
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sec delay

// Batch processing (напр. 10 наведнъж, после пауза)
for (let i = 0; i < urls.length; i += 10) {
  const batch = urls.slice(i, i + 10);
  await Promise.all(batch.map(url => importVehicle(url)));
  await sleep(5000); // 5 sec между batch-овете
}
```

### Error Handling
- Skip обяви с грешка, продължи със следващите
- Log failed URLs за retry
- Show summary: "42 успешни, 3 неуспешни"

### Dealer Auto-detection
```typescript
// Ако user подаде car URL вместо dealer URL:
if (url.includes('/obiavi/') && url.includes('-id')) {
  // Extract dealer slug
  const dealerSlug = new URL(url).hostname.split('.')[0];
  // Redirect to dealer import
  const dealerUrl = `https://${dealerSlug}.mobile.bg/`;
}
```

---

## Testing Plan

### Manual Testing:
1. [ ] Намери 2-3 dealer профила с малко обяви (5-10 коли)
2. [ ] Test scraping на listing страница
3. [ ] Test pagination (ако има повече от 1 страница)
4. [ ] Test full import
5. [ ] Verify данните в Supabase
6. [ ] Test re-import (UPDATE existing vehicles)

### Edge Cases:
- [ ] Dealer с 0 обяви
- [ ] Dealer с 1 обява
- [ ] Dealer с 100+ обяви (pagination)
- [ ] Невалиден dealer URL
- [ ] Mobile.bg rate limiting

---

## Timeline Estimate

**Total: 2-3 часа**

1. Research (HTML structure): 15 мин
2. `/api/scrape-dealer-listing`: 30 мин
3. `/api/import-dealer`: 45 мин
4. UI `/import-dealer` page: 30 мин
5. Testing: 30 мин

---

## Next Steps

1. **Research Mobile.bg HTML** - отвори dealer профил, inspect
2. **Start with scrape-dealer-listing** - извлечи списък с URLs
3. **Build import-dealer endpoint** - loop + existing parser
4. **Create UI** - simple form + progress
5. **Test with real dealer** - малка автокъща за първи тест

---

## Success Criteria

✅ Успех ако:
- Подаване на `https://dealer.mobile.bg/` → импортира всички обяви
- UPDATE при existing vehicles (по mobile_id)
- UI показва progress
- Може да се re-import за sync

🎯 **Goal:** Автокъщата подава своя Mobile.bg профил 1 път → всички коли в SmartDealer!
