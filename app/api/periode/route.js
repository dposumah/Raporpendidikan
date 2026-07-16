import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('siswa')
      .select('periode');

    if (error) {
      console.error('Error fetching periode:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      // Default fallback
      return NextResponse.json(['Genap 2025/2026']);
    }

    const uniquePeriods = [...new Set(data.map(item => item.periode).filter(Boolean))];
    
    // Fallback if the uniquePeriods is empty
    if (uniquePeriods.length === 0) {
      uniquePeriods.push('Genap 2025/2026');
    }

    // Sort periods, maybe alphabetically or just reverse so the newest is probably first
    uniquePeriods.sort((a, b) => b.localeCompare(a));

    return NextResponse.json(uniquePeriods);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Gagal mengambil daftar periode' }, { status: 500 });
  }
}
