import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface DealerData {
  name: string;
  slug: string;
  mobile_profile_url: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  member_since: number | null;
  working_hours: Record<string, string> | null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL е задължителен' },
        { status: 400 }
      );
    }

    // Extract dealer slug from URL
    const urlObj = new URL(url);
    const dealerSlug = urlObj.hostname.split('.')[0];

    if (dealerSlug === 'www' || dealerSlug === 'mobile') {
      return NextResponse.json(
        { error: 'Невалиден Mobile.bg dealer URL. Използвайте формат: https://dealername.mobile.bg/' },
        { status: 400 }
      );
    }

    const dealerData: DealerData = {
      name: '',
      slug: dealerSlug,
      mobile_profile_url: `https://${dealerSlug}.mobile.bg/`,
      phone: null,
      city: null,
      address: null,
      description: null,
      logo_url: null,
      cover_image_url: null,
      member_since: null,
      working_hours: null,
    };

    // Scrape main page (/)
    await scrapeMainPage(dealerSlug, dealerData);

    // Scrape about page (/about)
    await scrapeAboutPage(dealerSlug, dealerData);

    // Scrape contacts page (/contacts)
    await scrapeContactsPage(dealerSlug, dealerData);

    return NextResponse.json(dealerData);
  } catch (error) {
    console.error('Error scraping dealer:', error);
    return NextResponse.json(
      { error: 'Грешка при изтегляне на данни от Mobile.bg' },
      { status: 500 }
    );
  }
}

async function scrapeMainPage(slug: string, data: DealerData) {
  const url = `https://${slug}.mobile.bg/`;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('windows-1251');
  const html = decoder.decode(buffer);
  const $ = cheerio.load(html);

  // Extract name from H1
  const h1 = $('h1').first().text().trim();
  if (h1) {
    data.name = h1;
  }

  // Extract logo
  const logo = $('img[alt*="logo"]').first().attr('src');
  if (logo) {
    data.logo_url = logo.startsWith('http') ? logo : `https:${logo}`;
  }

  // Extract cover image
  const cover = $('img[alt*="cover"]').first().attr('src');
  if (cover) {
    data.cover_image_url = cover.startsWith('http') ? cover : `https:${cover}`;
  }
}

async function scrapeAboutPage(slug: string, data: DealerData) {
  const url = `https://${slug}.mobile.bg/about`;
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const html = decoder.decode(buffer);
    const $ = cheerio.load(html);

    // Extract description
    const description = $('p').first().text().trim();
    if (description) {
      data.description = description;
    }
  } catch (error) {
    console.error('Error scraping about page:', error);
  }
}

async function scrapeContactsPage(slug: string, data: DealerData) {
  const url = `https://${slug}.mobile.bg/contacts`;
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const html = decoder.decode(buffer);
    const $ = cheerio.load(html);

    // Extract phone (look for phone number pattern)
    const phoneText = $('body').text();
    const phoneMatch = phoneText.match(/0\d{9}/);
    if (phoneMatch) {
      data.phone = phoneMatch[0];
    }

    // Extract city/region (look for "Регион:" or "град")
    $('body').find('*').each((_, elem) => {
      const text = $(elem).text();
      if (text.includes('Регион:') || text.includes('град')) {
        const cityMatch = text.match(/(?:Регион:|град)\s*([^,\n]+)/);
        if (cityMatch) {
          data.city = cityMatch[1].trim();
        }
      }
    });

    // Extract address (look for "Местоположение:" or "Бул." or "ул.")
    $('body').find('*').each((_, elem) => {
      const text = $(elem).text();
      if (text.includes('Местоположение:') || text.includes('Бул.') || text.includes('ул.')) {
        const addressMatch = text.match(/(?:Местоположение:)?\s*((?:Бул\.|ул\.).*?)(?:\n|$)/);
        if (addressMatch) {
          data.address = addressMatch[1].trim();
        }
      }
    });

    // Extract member since (look for "от YYYY г.")
    const yearMatch = phoneText.match(/от\s+(\d{4})\s+г\./);
    if (yearMatch) {
      data.member_since = parseInt(yearMatch[1], 10);
    }

    // Extract working hours
    const workingHours: Record<string, string> = {};
    const days = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];
    
    days.forEach(day => {
      $('body').find('*').each((_, elem) => {
        const text = $(elem).text();
        if (text.includes(day)) {
          const hoursMatch = text.match(new RegExp(`${day}\\s*([\\d:]+\\s*-\\s*[\\d:]+\\s*ч\\.?|Почивен ден)`));
          if (hoursMatch) {
            workingHours[day.toLowerCase()] = hoursMatch[1].trim();
          }
        }
      });
    });

    if (Object.keys(workingHours).length > 0) {
      data.working_hours = workingHours;
    }
  } catch (error) {
    console.error('Error scraping contacts page:', error);
  }
}
