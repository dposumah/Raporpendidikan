import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Not needed for simple keep-alive
          },
        },
      }
    );

    // Perform a very lightweight query just to wake up the database
    // We only select 1 row from 'sekolah'
    const { data, error } = await supabase
      .from('sekolah')
      .select('npsn')
      .limit(1);

    if (error) {
      console.error('Keep-alive error:', error);
      return NextResponse.json(
        { status: 'error', message: 'Failed to ping Supabase' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        status: 'success', 
        message: 'Supabase pinged successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Keep-alive exception:', err);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
