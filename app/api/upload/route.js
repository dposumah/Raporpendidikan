import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { parseExcelData } from '../../../utils/excelParser';
import { supabase } from '../../../utils/supabase';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tahun = formData.get('tahun');

    if (!file || !tahun) {
      return NextResponse.json({ error: 'File dan tahun diperlukan' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedData = parseExcelData(buffer, tahun);

    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid yang bisa dibaca dari Excel' }, { status: 400 });
    }

    const uniqueYears = [...new Set(parsedData.map(item => item.tahun))];

    // 1. Hapus data lama untuk tahun-tahun yang terdeteksi (overwrite)
    const { error: deleteError } = await supabase
      .from('rapor_data')
      .delete()
      .in('tahun', uniqueYears);

    if (deleteError) {
      console.error('Error deleting old data:', deleteError);
      throw new Error('Gagal menghapus data lama dari database');
    }

    // 2. Insert data baru secara batch/chunk (untuk menghindari limit payload Supabase)
    const chunkSize = 1000;
    for (let i = 0; i < parsedData.length; i += chunkSize) {
      const chunk = parsedData.slice(i, i + chunkSize);
      
      const { error: insertError } = await supabase
        .from('rapor_data')
        .insert(chunk);

      if (insertError) {
        console.error('Error inserting chunk:', insertError);
        throw new Error('Gagal menyimpan sebagian data ke database');
      }
    }

    // Bersihkan cache agar data baru langsung muncul
    revalidatePath('/api/data');
    revalidatePath('/rapor');
    revalidatePath('/capaian-daerah');

    return NextResponse.json({ success: true, message: `Berhasil menyimpan ${parsedData.length} baris untuk tahun ${tahun} ke Database` });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses file' }, { status: 500 });
  }
}
