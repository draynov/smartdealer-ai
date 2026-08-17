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

    // Extract listings from .ads2023 .item elements
    $('.ads2023 .item').each((_, item) => {
      const $item = $(item);

      // Get mobile ID from item id attribute (format: "ida11783775713682917")
      const itemId = $item.attr('id');
      if (!itemId || !itemId.startsWith('ida')) return;
      
      const mobileId = itemId.replace('ida', '');

      // Get URL and title from .title link
      const titleLink = $item.find('a.title').first();
      const url = titleLink.attr('href');
      const title = titleLink.text().trim();

      if (!url || !title) return;

      // Get price
      const priceDiv = $item.find('.price div').first();
      const price = priceDiv.text().trim();

      // Get thumbnail image
      const img = $item.find('img.pic').first();
      const thumbnailUrl = img.attr('src');

      // Ensure full URL
      const fullUrl = url.startsWith('http') ? url : `https://${dealerSlug}.mobile.bg${url}`;
      const fullThumbnail = thumbnailUrl && !thumbnailUrl.startsWith('http') 
        ? `https:${thumbnailUrl}` 
        : thumbnailUrl;

      listings.push({
        url: fullUrl,
        mobileId,
        title,
        price: price || undefined,
        thumbnailUrl: fullThumbnail || undefined,
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
