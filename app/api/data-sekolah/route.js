import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export const revalidate = 31536000; // Cache 1 tahun

export async function GET() {
  try {
    const { count, error: countError } = await supabase
      .from('rapor_sekolah')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Supabase count error:', countError);
      throw countError;
    }

    const pageSize = 1000;
    const promises = [];
    
    // Tarik semua data secara batch agar bisa di-cache statis oleh Next.js
    for (let i = 0; i < count; i += pageSize) {
      promises.push(
        supabase
          .from('rapor_sekolah')
          .select('*')
          .range(i, i + pageSize - 1)
          .order('nama_sekolah', { ascending: true })
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
    console.error('Error fetching data-sekolah:', error);
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}
