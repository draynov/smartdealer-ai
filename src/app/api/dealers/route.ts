import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/dealers - List all dealers
export async function GET() {
  try {
    const { data: dealers, error } = await supabase
      .from('dealers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // Get vehicle count for each dealer
    const dealersWithCount = await Promise.all(
      (dealers || []).map(async (dealer) => {
        const { count } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('dealer_id', dealer.id);

        return {
          ...dealer,
          vehicle_count: count || 0,
        };
      })
    );

    return NextResponse.json(dealersWithCount);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на дилъри' },
      { status: 500 }
    );
  }
}

// POST /api/dealers - Create new dealer
export async function POST(request: NextRequest) {
  try {
    const dealerData = await request.json();

    // Validate required fields
    if (!dealerData.name || !dealerData.slug) {
      return NextResponse.json(
        { error: 'Име и slug са задължителни' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('dealers')
      .insert([dealerData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Дилър с този slug вече съществува' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating dealer:', error);
    return NextResponse.json(
      { error: 'Грешка при създаване на дилър' },
      { status: 500 }
    );
  }
}
