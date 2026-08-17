import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the dealer website
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website: ${response.statusText}` },
        { status: 500 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract logo
    let logoUrl = '';
    
    // Try common logo selectors
    const logoSelectors = [
      'img[alt*="logo" i]',
      '.logo img',
      '.header-logo img',
      'header img',
      '.site-logo img',
      '[class*="logo"] img',
    ];

    for (const selector of logoSelectors) {
      const img = $(selector).first();
      if (img.length) {
        logoUrl = img.attr('src') || '';
        if (logoUrl) {
          // Convert relative URL to absolute
          if (logoUrl.startsWith('/')) {
            logoUrl = `${parsedUrl.origin}${logoUrl}`;
          } else if (!logoUrl.startsWith('http')) {
            logoUrl = `${parsedUrl.origin}/${logoUrl}`;
          }
          break;
        }
      }
    }

    // Extract primary color from meta theme-color
    let primaryColor = '#2563eb'; // Default blue
    const themeColorMeta = $('meta[name="theme-color"]').attr('content');
    if (themeColorMeta) {
      primaryColor = themeColorMeta;
    }

    // Try to extract from inline styles or CSS (basic approach)
    if (!themeColorMeta) {
      // Look for common header/navbar background colors
      const headerBg = $('header, .header, nav, .navbar').first().css('background-color');
      if (headerBg && headerBg !== 'transparent') {
        primaryColor = headerBg;
      }
    }

    // Extract dealer name from title or h1
    let dealerName = '';
    const title = $('title').text().trim();
    if (title) {
      dealerName = title.split('|')[0].trim();
    }
    if (!dealerName) {
      dealerName = $('h1').first().text().trim();
    }

    return NextResponse.json({
      logoUrl,
      primaryColor,
      dealerName,
      websiteUrl: url,
    });

  } catch (error) {
    console.error('Error scraping dealer design:', error);
    return NextResponse.json(
      { error: 'Failed to scrape dealer design' },
      { status: 500 }
    );
  }
}
