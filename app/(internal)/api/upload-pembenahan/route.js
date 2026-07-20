import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/utils/supabase';
import * as xlsx from 'xlsx';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Cari baris header (Baris yang kolom pertamanya mengandung teks "KELOMPOK INDIKATOR")
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      const col0 = String(row[0] || '').trim().toUpperCase();
      if (col0.includes('KELOMPOK INDIKATOR')) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return NextResponse.json({ error: 'Format file tidak dikenali. Tidak dapat menemukan header KELOMPOK INDIKATOR.' }, { status: 400 });
    }

    const dataStartRow = headerRowIdx + 1;
    const parsedData = [];
    
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      // Lewati baris kosong
      if (!row || !row[3] || String(row[3]).trim() === '') continue; // indikator_prioritas (col 3) harus ada

      const safeString = (val) => val != null ? String(val).trim() : null;

      parsedData.push({
        kelompok_indikator: safeString(row[0]),
        kategori_indikator: safeString(row[1]),
        indikator_kinerja_urusan: safeString(row[2]),
        indikator_prioritas: safeString(row[3]),
        kelompok_akar_masalah: safeString(row[4]),
        no_indikator_akar_masalah: safeString(row[5]),
        indikator_akar_masalah: safeString(row[6]),
        mengapa_akar_masalah: safeString(row[7]),
        label_sumber_data: safeString(row[8]),
        deskripsi_sumber_data: safeString(row[9]),
        jenjang: safeString(row[10]),
        kode_kegiatan_paud: safeString(row[11]),
        kode_kegiatan_sd: safeString(row[12]),
        kode_kegiatan_smp: safeString(row[13]),
        kode_kegiatan_kesetaraan: safeString(row[14]),
        kode_kegiatan_nonjenjang: safeString(row[15]),
        nomenklatur_kegiatan: safeString(row[16]),
        kinerja_kegiatan: safeString(row[17]),
        indikator_kegiatan: safeString(row[18]),
        satuan_kegiatan: safeString(row[19]),
        deskripsi_kegiatan: safeString(row[20]),
        contoh_operasionalisasi: safeString(row[21]),
        nspk: safeString(row[22])
      });
    }

    if (parsedData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid yang ditemukan untuk diunggah.' }, { status: 400 });
    }
    
    // Chunking 200 rows per insert
    const CHUNK_SIZE = 200;
    let totalInserted = 0;
    
    // Agar data selalu fresh (opsional), kita bisa hapus data lama atau timpa saja. 
    // Karena ini data referensi statis, kita hapus dulu tabelnya baru insert ulang lebih aman,
    // ATAU cukup insert dan biarkan tabel terus bertambah (tapi bisa duplikat). 
    // Lebih baik TRUNCATE / Hapus semua data lama sebelum insert yang baru karena tidak ada primary key unik yang bisa di-upsert per baris.
    const { error: deleteError } = await supabase.from('akar_masalah').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (deleteError) {
      console.error('Error clearing old data:', deleteError);
      return NextResponse.json({ error: 'Gagal membersihkan data lama: ' + deleteError.message }, { status: 500 });
    }

    for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
      const chunk = parsedData.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('akar_masalah')
        .insert(chunk);

      if (error) {
        console.error('Supabase Error on chunk insert:', error);
        return NextResponse.json({ error: 'Gagal menyimpan ke database pada baris ' + (i+1) }, { status: 500 });
      }
      totalInserted += chunk.length;
    }

    revalidatePath('/api/data-pembenahan');
    revalidatePath('/pembenahan');

    return NextResponse.json({ message: 'Berhasil mengunggah data pembenahan!', total: totalInserted });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
