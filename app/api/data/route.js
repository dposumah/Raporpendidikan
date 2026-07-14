import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

// Supabase membutuhkan revalidation atau pengalihan cache khusus 
// untuk menghindari cache Next.js yang agresif.
export const revalidate = 0; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('rapor_data')
      .select('*')
      .order('tahun', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Gagal memuat data dari database' }, { status: 500 });
  }
}
