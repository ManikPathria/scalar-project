import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Get current weekly availability
export async function GET() {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .order('day_of_week', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// Update the entire weekly schedule
export async function POST(request) {
  try {
    const scheduleItems = await request.json(); 
    // Expecting an array of objects: { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_active: true }

    // Step 1: Delete existing availability (Clean slate approach for the demo)
    // We use a dummy condition to delete all rows since we have a single default user
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .neq('id', 0); 

    if (deleteError) throw deleteError;

    // Step 2: Insert the newly configured schedule
    const { data, error: insertError } = await supabase
      .from('availability')
      .insert(scheduleItems)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}