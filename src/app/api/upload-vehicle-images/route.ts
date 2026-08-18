import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const vehicleId = formData.get('vehicle_id') as string;
    const files = formData.getAll('images') as File[];

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'vehicle_id е задължителен' },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Няма качени снимки' },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    // Upload each image
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${i + 1}.${fileExt}`;
      const filePath = `${vehicleId}/${fileName}`;

      // Convert File to ArrayBuffer then to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue; // Skip this image and continue with others
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath);

      uploadedImages.push({
        vehicle_id: vehicleId,
        thumbnail_url: urlData.publicUrl,
        large_url: urlData.publicUrl,
        position: i + 1,
      });
    }

    // Insert image records into database
    if (uploadedImages.length > 0) {
      const { error: insertError } = await supabase
        .from('vehicle_images')
        .insert(uploadedImages);

      if (insertError) {
        console.error('Insert images error:', insertError);
        return NextResponse.json(
          { error: 'Грешка при записване на снимките в базата' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      count: uploadedImages.length,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Грешка при качване на снимки' },
      { status: 500 }
    );
  }
}
