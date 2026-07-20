import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/utils/supabase';
import * as xlsx from 'xlsx';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const periode = formData.get('periode');

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }
    if (!periode) {
      return NextResponse.json({ success: false, error: 'Periode tidak ditemukan' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    const formattedData = json.map(row => {
      const toStringOrEmpty = (val) => val !== undefined && val !== null ? String(val).trim() : '';
      
      const getVal = (possibleKeys) => {
        const rowKeys = Object.keys(row);
        for (const pk of possibleKeys) {
          const foundKey = rowKeys.find(k => k.toLowerCase().trim() === pk.toLowerCase().trim());
          if (foundKey) return toStringOrEmpty(row[foundKey]);
        }
        return '';
      };

      const nama = getVal(['Nama', 'Nama Guru', 'Nama PTK']);
      const tempatTugas = getVal(['Tempat Tugas', 'Sekolah', 'Instansi']);
      
      // Auto-detect jenjang
      let jenjang = '';
      const ttLower = tempatTugas.toLowerCase();
      if (ttLower.includes('sd ') || ttLower.includes('sdn ') || ttLower.includes('sekolah dasar') || ttLower.match(/\bsd\b/)) jenjang = 'SD';
      else if (ttLower.includes('smp ') || ttLower.includes('smpn ') || ttLower.includes('smps ') || ttLower.includes('sekolah menengah pertama') || ttLower.match(/\bsmp\b/) || ttLower.match(/\bsmps\b/)) jenjang = 'SMP';
      else if (ttLower.includes('sma ') || ttLower.includes('sman ') || ttLower.includes('smk ') || ttLower.includes('smkn ')) jenjang = 'SMA/SMK';
      else if (ttLower.includes('tk ') || ttLower.includes('tkn ') || ttLower.includes('paud ') || ttLower.includes('kb ') || ttLower.match(/\bsps\b/)) jenjang = 'PAUD';
      else if (ttLower.includes('pkbm') || ttLower.includes('spnf')) jenjang = 'Kesetaraan';
      else jenjang = 'Lainnya';

      return {
        periode: periode.trim(),
        nama,
        nik: getVal(['NIK']),
        nuptk: getVal(['NUPTK']),
        nip: getVal(['NIP']),
        jenis_kelamin: getVal(['L/P', 'Jenis Kelamin', 'JK']),
        tempat_lahir: getVal(['Tempat Lahir']),
        tanggal_lahir: getVal(['Tanggal Lahir']),
        status_tugas: getVal(['Status Tugas']),
        tempat_tugas: tempatTugas,
        jenjang,
        npsn: getVal(['NPSN']),
        kecamatan: getVal(['Kecamatan']),
        kabupaten_kota: getVal(['Kabupaten/Kota', 'Kabupaten', 'Kota']),
        nomor_hp: getVal(['Nomor HP', 'No HP', 'Telepon']),
        sk_cpns: getVal(['SK CPNS']),
        tanggal_cpns: getVal(['Tanggal CPNS']),
        sk_pengangkatan: getVal(['SK Pengangkatan']),
        tmt_pengangkatan: getVal(['TMT Pengangkatan']),
        jenis_ptk: getVal(['Jenis PTK']),
        jabatan_ptk: getVal(['Jabatan PTK']),
        pendidikan: getVal(['Pendidikan']),
        bidang_studi_pendidikan: getVal(['Bidang Studi Pendidikan']),
        bidang_studi_sertifikasi: getVal(['Bidang Studi Sertifikasi']),
        status_kepegawaian: getVal(['Status Kepegawaian']),
        pangkat_gol: getVal(['Pangkat/Gol', 'Pangkat Golongan', 'Golongan']),
        tmt_pangkat: getVal(['TMT Pangkat']),
        masa_kerja_tahun: getVal(['Masa Kerja Tahun']),
        masa_kerja_bulan: getVal(['Masa Kerja Bulan']),
        mata_pelajaran_diajarkan: getVal(['Mata Pelajaran Diajarkan', 'Mata Pelajaran']),
        jam_mengajar_perminggu: getVal(['Jam Mengajar Perminggu', 'Jam Mengajar', 'JJM']),
        jabatan_kepsek: getVal(['Jabatan Kepsek', 'Kepala Sekolah'])
      };
    }).filter(row => row.nama);

    if (formattedData.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data valid yang ditemukan (Pastikan ada kolom Nama).' }, { status: 400 });
    }

    formattedData.forEach(row => {
      if (!row.nik || String(row.nik).trim() === '') {
        row.nik = `TMP_${row.nama.replace(/\s+/g, '')}_${row.tanggal_lahir || ''}`.substring(0, 50);
      }
    });

    const uniqueMap = new Map();
    let duplicateCount = 0;

    formattedData.forEach(row => {
      let key = `${row.nik}_${row.periode}`;
      if (uniqueMap.has(key)) {
        duplicateCount++;
        row.nik = `${row.nik}_DUP_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        key = `${row.nik}_${row.periode}`;
      }
      uniqueMap.set(key, row);
    });

    let deduplicatedData = Array.from(uniqueMap.values());

    const CHUNK_SIZE = 1000;
    let totalInserted = 0;

    for (let i = 0; i < deduplicatedData.length; i += CHUNK_SIZE) {
      const chunk = deduplicatedData.slice(i, i + CHUNK_SIZE);
      const { error: dbError } = await supabase
        .from('guru')
        .upsert(chunk, { onConflict: 'nik, periode' });

      if (dbError) {
        throw new Error(`Gagal menyimpan baris ${i + 1} sampai ${i + chunk.length}. Pesan Error: ${dbError.message}`);
      }
      totalInserted += chunk.length;
    }

    revalidatePath('/api/data-guru');
    revalidatePath('/dashboard-guru');

    let msg = `Berhasil menyimpan total ${totalInserted} data guru.`;
    if (duplicateCount > 0) {
      msg += ` (Diselamatkan ${duplicateCount} data dengan NIK/Nama ganda).`;
    }

    return NextResponse.json({ success: true, message: msg, total: totalInserted });
    
  } catch (error) {
    console.error('Upload Guru Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Terjadi kesalahan saat memproses data.' }, { status: 500 });
  }
}
