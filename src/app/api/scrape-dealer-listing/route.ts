import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface CarListing {
  url: string;
  mobileId: string;
  title?: string;
  price?: string;
  thumbnailUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { dealerUrl } = await request.json();

    if (!dealerUrl) {
      return NextResponse.json(
        { error: 'Missing dealerUrl parameter' },
        { status: 400 }
      );
    }

    // Parse dealer slug from URL
    // Example: https://avtomarket.mobile.bg/ -> avtomarket
    const url = new URL(dealerUrl);
    const dealerSlug = url.hostname.split('.')[0];

    if (!url.hostname.includes('mobile.bg')) {
      return NextResponse.json(
        { error: 'Invalid Mobile.bg dealer URL' },
        { status: 400 }
      );
    }

    // Construct listing URL
    const listingUrl = `https://${dealerSlug}.mobile.bg/obiavi`;

    console.log('Fetching dealer listing:', listingUrl);

    // Fetch with windows-1251 encoding (критично за Bulgarian text!)
    const response = await fetch(listingUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch dealer listing: ${response.status}` },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1251');
    const html = decoder.decode(buffer);

    // Parse with Cheerio
    const $ = cheerio.load(html);

    const listings: CarListing[] = [];

    // TODO: Find the correct selector - needs research!
    // This is a placeholder - will need to inspect actual HTML
    
    // Common patterns to try:
    // Option 1: Direct links
    $('a[href*="/obiavi/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || !href.includes('-id')) return;

      // Extract mobile ID from URL
      // Example: /obiavi/mercedes-c-300-id11786020793638529
      const idMatch = href.match(/id(\d+)/);
      if (!idMatch) return;

      const mobileId = idMatch[1];
      const fullUrl = href.startsWith('http') 
        ? href 
        : `https://${dealerSlug}.mobile.bg${href}`;

      // Try to get title (might be in link text or nearby element)
      const title = $(el).text().trim() || $(el).find('h2, h3, .title').text().trim();

      // Try to get price (might be nearby)
      const priceElement = $(el).find('.price, .Price').first();
      const price = priceElement.text().trim();

      // Try to get thumbnail
      const imgElement = $(el).find('img').first();
      const thumbnailUrl = imgElement.attr('src') || imgElement.attr('data-src');

      listings.push({
        url: fullUrl,
        mobileId,
        title: title || undefined,
        price: price || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
      });
    });

    // Remove duplicates by mobileId
    const uniqueListings = Array.from(
      new Map(listings.map(item => [item.mobileId, item])).values()
    );

    return NextResponse.json({
      dealerSlug,
      dealerUrl: `https://${dealerSlug}.mobile.bg/`,
      listingUrl,
      totalFound: uniqueListings.length,
      listings: uniqueListings,
    });

  } catch (error) {
    console.error('Scrape dealer listing error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape dealer listing' },
      { status: 500 }
    );
  }
}
