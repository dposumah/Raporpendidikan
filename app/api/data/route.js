import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

// Supabase membutuhkan revalidation atau pengalihan cache khusus 
// untuk menghindari cache Next.js yang agresif.
export const revalidate = 0; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { count, error: countError } = await supabase
      .from('rapor_data')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Supabase count error:', countError);
      throw countError;
    }

    const pageSize = 1000;
    const promises = [];
    
    // Siapkan semua request secara paralel (concurrent)
    for (let i = 0; i < count; i += pageSize) {
      promises.push(
        supabase
          .from('rapor_data')
          .select('*')
          .range(i, i + pageSize - 1)
          .order('tahun', { ascending: true })
          .order('id', { ascending: true })
      );
    }

    // Jalankan semua request sekaligus
    const results = await Promise.all(promises);
    
    let allData = [];
    results.forEach(res => {
      if (res.error) {
        console.error('Supabase fetch error:', res.error);
        throw res.error;
      }
      if (res.data) {
        allData.push(...res.data);
      }
    });

    return NextResponse.json(allData);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Gagal memuat data dari database' }, { status: 500 });
  }
}
