import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/utils/supabase';
import * as xlsx from 'xlsx';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const tahun = formData.get('tahun') || '2025';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    // Asumsi data capaian sekolah ada di sheet pertama
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    let dataStartRow = -1;
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      const col0 = String(row[0] || '').trim();
      if (/^[0-9]+$/.test(col0) && col0.length >= 6) {
        dataStartRow = i;
        break;
      }
    }

    if (dataStartRow < 2) {
      return NextResponse.json({ error: 'Format file tidak dikenali. Tidak dapat menemukan baris data NPSN.' }, { status: 400 });
    }

    const row2 = rows[dataStartRow - 2]; // Sub-headers (misal: "D.18 Kesiapsiagaan Bencana")
    const row3 = rows[dataStartRow - 1]; // Tipe kolom (misal: "Label Capaian", "Perubahan Nilai")

    const parsedData = [];
    
    // Iterasi dari dataStartRow sampai habis
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      // Lewati baris kosong atau tanpa NPSN
      if (!row || !row[0] || String(row[0]).trim() === '') continue;

      const npsn = String(row[0]).trim();
      const sekolahData = {
        tahun: tahun,
        npsn: npsn,
        nama_sekolah: row[1] || '',
        jenis_sekolah: row[2] || '',
        status_sekolah: row[3] || '',
        kabupaten_kota: row[4] || '',
        kecamatan: row[5] || '',
        indikator: {}
      };

      let currentGroup = '';
      
      // Indikator dinamis mulai dari kolom ke-6 (index 6)
      for (let c = 6; c < row3.length; c++) {
        if (row2 && row2[c]) {
          currentGroup = String(row2[c]).trim();
          sekolahData.indikator[currentGroup] = {};
        }
        
        const fieldType = row3 && row3[c] ? String(row3[c]).trim() : '';
        const value = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : null;
        
        if (currentGroup && fieldType) {
          if (!sekolahData.indikator[currentGroup]) {
             sekolahData.indikator[currentGroup] = {};
          }
          sekolahData.indikator[currentGroup][fieldType] = value;
        }
      }
      
      parsedData.push(sekolahData);
    }

    if (parsedData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid yang ditemukan.' }, { status: 400 });
    }

    // Deduplikasi data sebelum upsert untuk mencegah error PostgreSQL "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueDataMap = new Map();
    parsedData.forEach(row => {
      const key = `${row.tahun}_${row.npsn}`;
      uniqueDataMap.set(key, row);
    });
    
    const deduplicatedData = Array.from(uniqueDataMap.values());
    
    // Chunking karena row bisa ribuan, Supabase max 1000 per insert (lebih aman 200 jika payload JSON besar)
    const CHUNK_SIZE = 200;
    let totalInserted = 0;
    
    for (let i = 0; i < deduplicatedData.length; i += CHUNK_SIZE) {
      const chunk = deduplicatedData.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('rapor_sekolah')
        .upsert(chunk, { onConflict: 'tahun,npsn' });
        
      if (error) {
        console.error('Supabase upsert error:', error);
        return NextResponse.json({ error: 'Gagal menyimpan ke database', details: error.message }, { status: 500 });
      }
      totalInserted += chunk.length;
    }

    revalidatePath('/api/data-sekolah');
    revalidatePath('/rapor-sekolah');

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menyimpan ${totalInserted} data rapor sekolah.` 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem', details: error.message }, { status: 500 });
  }
}
