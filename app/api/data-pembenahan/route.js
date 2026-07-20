import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export const revalidate = 31536000; // Cache 1 tahun

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('akar_masalah')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching data-pembenahan:', error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}
