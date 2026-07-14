import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

// Supabase membutuhkan revalidation atau pengalihan cache khusus 
// untuk menghindari cache Next.js yang agresif.
export const revalidate = 0; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('rapor_data')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('tahun', { ascending: true });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json(allData);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Gagal memuat data dari database' }, { status: 500 });
  }
}
