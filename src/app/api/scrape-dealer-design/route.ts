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

    // If no logo found in img tags, search in HTML for logo asset files
    if (!logoUrl) {
      // Search for logo files in the HTML content (React apps often have them as assets)
      const logoPatterns = [
        /href="([^"]*logo[^"]*\.(?:png|jpg|jpeg|svg|webp)[^"]*)"/gi,
        /src="([^"]*logo[^"]*\.(?:png|jpg|jpeg|svg|webp)[^"]*)"/gi,
        /\/assets\/logo[^"'\s]*\.(?:png|jpg|jpeg|svg|webp)/gi,
      ];

      for (const pattern of logoPatterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          // Extract the URL from the first match
          let match = matches[0];
          // Remove quotes and extract path
          match = match.replace(/(?:href|src)="|"/g, '');
          
          if (match.startsWith('/')) {
            logoUrl = `${parsedUrl.origin}${match}`;
          } else if (!match.startsWith('http')) {
            logoUrl = `${parsedUrl.origin}/${match}`;
          } else {
            logoUrl = match;
          }
          break;
        }
      }
    }

    // Extract primary color from meta theme-color
    let primaryColor = '#2563eb'; // Default blue
    let secondaryColor = ''; // For sites with multiple colors
    
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

    // Try to find accent/secondary colors from CSS
    // Look for color patterns in style tags
    const styleTags = $('style').text();
    const colorMatches = styleTags.match(/#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g);
    if (colorMatches && colorMatches.length > 0) {
      // Find most common non-grayscale color
      const colors = colorMatches.filter(c => {
        const hex = c.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        // Filter out grayscale colors (where r,g,b are similar)
        return Math.abs(r - g) > 20 || Math.abs(g - b) > 20 || Math.abs(r - b) > 20;
      });
      if (colors.length > 0 && !themeColorMeta) {
        // Use first non-grayscale color if no theme-color meta
        primaryColor = colors[0];
      }
      if (colors.length > 1) {
        secondaryColor = colors[1];
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

    // Extract background color
    let backgroundColor = '#ffffff'; // Default white
    const bodyBg = $('body').css('background-color');
    if (bodyBg && bodyBg !== 'transparent') {
      backgroundColor = bodyBg;
    } else {
      // Try to find background in style tags
      const bgColorMatch = styleTags.match(/background-color:\s*(#[0-9A-Fa-f]{3,6}|rgb[a]?\([^)]+\))/i);
      if (bgColorMatch) {
        backgroundColor = bgColorMatch[1];
      }
    }

    return NextResponse.json({
      logoUrl,
      primaryColor,
      secondaryColor: secondaryColor || primaryColor,
      backgroundColor,
      dealerName,
      websiteUrl: url,
      isDarkTheme: primaryColor.toLowerCase() === '#000000' || primaryColor.toLowerCase() === '#000',
    });

  } catch (error) {
    console.error('Error scraping dealer design:', error);
    return NextResponse.json(
      { error: 'Failed to scrape dealer design' },
      { status: 500 }
    );
  }
}
