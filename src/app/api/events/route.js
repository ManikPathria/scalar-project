import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Fetch all event types
export async function GET() {
  const { data, error } = await supabase
    .from('event_types')
    .select('*')
    .order('duration', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// Create a new event type
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Ensure the payload matches your DB schema exactly
    const { title, description, slug, duration, color } = body;

    const { data, error } = await supabase
      .from('event_types')
      .insert([{ title, description, slug, duration, color }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}