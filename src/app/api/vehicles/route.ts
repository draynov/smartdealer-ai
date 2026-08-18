import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dealerId = searchParams.get('dealer_id');

    let query = supabase
      .from('vehicles')
      .select('id, title, price_eur, price_bgn, year, mileage, fuel_type, source_url')
      .order('created_at', { ascending: false });

    if (dealerId) {
      query = query.eq('dealer_id', dealerId);
    }

    const { data: vehicles, error } = await query;

    if (error) throw error;

    return NextResponse.json(vehicles || []);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на обяви' },
      { status: 500 }
    );
  }
}
