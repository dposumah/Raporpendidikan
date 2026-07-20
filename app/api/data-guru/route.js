import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export const revalidate = 31536000; // Cache 1 tahun

export async function GET() {
  try {
    const { count, error: countError } = await supabase
      .from('guru')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Supabase count error:', countError);
      throw countError;
    }

    const pageSize = 1000;
    const promises = [];
    
    for (let i = 0; i < count; i += pageSize) {
      promises.push(
        supabase
          .from('guru')
          .select('*')
          .range(i, i + pageSize - 1)
          .order('nama', { ascending: true })
      );
    }

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
    console.error('Error fetching data-guru:', error);
    return NextResponse.json({ error: 'Gagal mengambil data guru' }, { status: 500 });
  }
}
