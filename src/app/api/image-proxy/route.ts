import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Fetch the image from Mobile.bg
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.mobile.bg/',
      },
    });

    if (!response.ok) {
      return new Response('Failed to fetch image', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/webp';

    // Return the image with proper headers
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new Response('Error fetching image', { status: 500 });
  }
}
