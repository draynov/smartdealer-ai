import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { carDataToVehicle, carDataToImages, carDataToFeatures } from '@/lib/mappers';

export async function POST(request: NextRequest) {
  try {
    // Check env vars first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase env vars:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      });
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const { url } = await request.json();

    if (!url || !url.includes('mobile.bg')) {
      return NextResponse.json(
        { error: 'Invalid Mobile.bg URL' },
        { status: 400 }
      );
    }

    // Step 1: Scrape the vehicle data using existing parser
    const scrapeResponse = await fetch(`${request.nextUrl.origin}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.json();
      return NextResponse.json(
        { error: error.error || 'Failed to scrape vehicle data' },
        { status: scrapeResponse.status }
      );
    }

    const carData = await scrapeResponse.json();

    // Step 2: Get the test dealer (dealer_id = first dealer in DB)
    const { data: dealers, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .limit(1)
      .single();

    if (dealerError || !dealers) {
      return NextResponse.json(
        { error: 'No dealer found in database. Please run the SQL schema first.' },
        { status: 500 }
      );
    }

    const dealerId = dealers.id;

    // Step 2.5: Fetch all features for lookup
    const { data: allFeatures, error: featuresError } = await supabase
      .from('features')
      .select('id, name');

    if (featuresError || !allFeatures) {
      return NextResponse.json(
        { error: 'Failed to load features from database' },
        { status: 500 }
      );
    }

    // Create feature name -> id lookup map
    const featureLookup = new Map<string, number>();
    allFeatures.forEach(f => {
      featureLookup.set(f.name, f.id);
    });

    // Step 3: Check if vehicle with this mobile_id already exists
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('mobile_id', carData.mobileId)
      .single();

    let vehicleId: string;
    let isNew = false;

    if (existingVehicle) {
      // UPDATE existing vehicle
      vehicleId = existingVehicle.id;

      const vehicleData = carDataToVehicle(carData, dealerId);
      vehicleData.last_synced_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Update vehicle error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update vehicle' },
          { status: 500 }
        );
      }

      // Delete old images and features
      await supabase.from('vehicle_images').delete().eq('vehicle_id', vehicleId);
      await supabase.from('vehicle_features').delete().eq('vehicle_id', vehicleId);

    } else {
      // INSERT new vehicle
      isNew = true;

      const vehicleData = carDataToVehicle(carData, dealerId);

      const { data: newVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select('id')
        .single();

      if (insertError || !newVehicle) {
        console.error('Insert vehicle error:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert vehicle' },
          { status: 500 }
        );
      }

      vehicleId = newVehicle.id;
    }

    // Step 4: Insert images
    const images = carDataToImages(carData, vehicleId);
    if (images.length > 0) {
      const { error: imagesError } = await supabase
        .from('vehicle_images')
        .insert(images);

      if (imagesError) {
        console.error('Insert images error:', imagesError);
        // Continue anyway - images are not critical
      }
    }

    // Step 5: Insert features
    const features = carDataToFeatures(carData, vehicleId, featureLookup);
    if (features.length > 0) {
      const { error: featuresError } = await supabase
        .from('vehicle_features')
        .insert(features);

      if (featuresError) {
        console.error('Insert features error:', featuresError);
        // Continue anyway - features are not critical
      }
    }

    // Step 6: Return success with vehicle ID
    return NextResponse.json({
      success: true,
      vehicleId,
      isNew,
      message: isNew 
        ? 'Vehicle imported successfully' 
        : 'Vehicle updated successfully',
      imagesCount: images.length,
      featuresCount: features.length,
    });

  } catch (error) {
    console.error('Import vehicle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
