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
    .select(`
      id,
      title,
      price_eur,
      price_bgn,
      year,
      mileage,
      fuel_type,
      power_hp,
      source_url,
      vehicle_images (
        thumbnail_url,
        position
      )
    `)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract dealer_id, if it's a special value set to null and update seller_type
    let dealerId = body.dealer_id;
    let sellerType = body.seller_type || null;
    
    if (dealerId === 'private') {
      dealerId = null;
      sellerType = 'Частно лице';
    }
    
    // Build vehicle data
    const vehicleData: any = {
      title: body.title || `${body.make || ''} ${body.model || ''}`.trim(),
      make: body.make || null,
      model: body.model || null,
      version: body.version || null,
      year: body.year || null,
      mileage: body.mileage || null,
      fuel_type: body.fuel_type || null,
      power_hp: body.power_hp || null,
      power_kw: body.power_kw || null,
      transmission: body.transmission || null,
      color: body.color || null,
      price_eur: body.price_eur || null,
      price_bgn: body.price_bgn || null,
      currency: body.currency || 'EUR',
      description: body.description || null,
      dealer_id: dealerId,
      seller_type: sellerType,
      condition: body.condition || 'Употребяван',
      category: body.category || null,
    };
    
    // Insert vehicle
    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select('id')
      .single();
    
    if (insertError || !newVehicle) {
      console.error('Insert vehicle error:', insertError);
      return NextResponse.json(
        { error: 'Грешка при създаване на обява' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      id: newVehicle.id 
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Грешка при създаване на обява' },
      { status: 500 }
    );
  }
}
