import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/dealers/[id] - Get dealer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: dealer, error } = await supabase
      .from('dealers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Дилър не е намерен' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get vehicle count
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('dealer_id', id);

    return NextResponse.json({
      ...dealer,
      vehicle_count: count || 0,
    });
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на дилър' },
      { status: 500 }
    );
  }
}

// PUT /api/dealers/[id] - Update dealer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealerData = await request.json();

    // Add updated_at timestamp
    dealerData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('dealers')
      .update(dealerData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Дилър не е намерен' },
          { status: 404 }
        );
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Дилър с този slug вече съществува' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating dealer:', error);
    return NextResponse.json(
      { error: 'Грешка при обновяване на дилър' },
      { status: 500 }
    );
  }
}

// DELETE /api/dealers/[id] - Delete dealer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if dealer has any vehicles
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('dealer_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Не може да изтриете дилър с ${count} обяви! Първо изтрийте обявите.` },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('dealers')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Дилър не е намерен' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    return NextResponse.json(
      { error: 'Грешка при изтриване на дилър' },
      { status: 500 }
    );
  }
}
