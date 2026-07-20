import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { data: requestData, periode } = await request.json();

    if (!periode) {
      return new Response(JSON.stringify({ error: 'Periode tidak ditemukan' }), { status: 400 });
    }

    if (!requestData || requestData.length === 0) {
      return new Response(JSON.stringify({ error: 'Data kosong' }), { status: 400 });
    }

    const parseNumber = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseString = (val) => {
      if (val === undefined || val === null) return '';
      return String(val).trim();
    };

    const formattedData = requestData.map(row => {
      return {
        periode,
        nama_satuan_pendidikan: parseString(row['Nama Satuan Pendidikan']),
        npsn: parseString(row['NPSN']),
        bentuk_pendidikan: parseString(row['Bentuk Pendidikan']),
        status_sekolah: parseString(row['Status Sekolah']),
        alamat: parseString(row['Alamat']),
        kelurahan: parseString(row['Kelurahan']),
        kecamatan: parseString(row['Kecamatan']),
        kabupaten_kota: parseString(row['Kabupaten/Kota']),
        kode_pos: parseString(row['Kode Pos']),
        lintang: parseString(row['Lintang']),
        bujur: parseString(row['Bujur']),
        tmt_akreditasi: parseString(row['TMT Akreditasi']),
        akreditasi: parseString(row['Akreditasi']),
        
        rombel_t1: parseNumber(row['Rombel T1']),
        rombel_t2: parseNumber(row['Rombel T2']),
        rombel_t3: parseNumber(row['Rombel T3']),
        rombel_t4: parseNumber(row['Rombel T4']),
        rombel_t5: parseNumber(row['Rombel T5']),
        rombel_t6: parseNumber(row['Rombel T6']),
        rombel_t7: parseNumber(row['Rombel T7']),
        rombel_t8: parseNumber(row['Rombel T8']),
        rombel_t9: parseNumber(row['Rombel T9']),
        rombel_t10: parseNumber(row['Rombel T10']),
        rombel_t11: parseNumber(row['Rombel T11']),
        rombel_t12: parseNumber(row['Rombel T12']),
        rombel_t13: parseNumber(row['Rombel T13']),
        rombel_tka: parseNumber(row['Rombel TKA']),
        rombel_tkb: parseNumber(row['Rombel TKB']),
        rombel_pkta: parseNumber(row['Rombel PktA']),
        rombel_pktb: parseNumber(row['Rombel PktB']),
        rombel_pktc: parseNumber(row['Rombel PktC']),
        jumlah_rombel: parseNumber(row['Jumlah Rombel']),
        
        ruang_kelas_baik: parseNumber(row['Ruang Kelas Baik']),
        ruang_kelas_rusak_ringan: parseNumber(row['Ruang Kelas Rusak Ringan']),
        ruang_kelas_rusak_sedang: parseNumber(row['Ruang Kelas Rusak Sedang']),
        ruang_kelas_rusak_berat: parseNumber(row['Ruang Kelas Rusak Berat']),
        ruang_kelas_rusak_total: parseNumber(row['Ruang Kelas Rusak Total']),
        jumlah_ruang_kelas: parseNumber(row['Jumlah Ruang Kelas']),
        
        ruang_guru_baik: parseNumber(row['Ruang Guru Baik']),
        ruang_guru_rusak_ringan: parseNumber(row['Ruang Guru Rusak Ringan']),
        ruang_guru_rusak_sedang: parseNumber(row['Ruang Guru Rusak Sedang']),
        ruang_guru_rusak_berat: parseNumber(row['Ruang Guru Rusak Berat']),
        ruang_guru_rusak_total: parseNumber(row['Ruang Guru Rusak Total']),
        jumlah_ruang_guru: parseNumber(row['Jumlah Ruang Guru']),
        
        meja_siswa: parseNumber(row['Meja Siswa']),
        kursi_siswa: parseNumber(row['Kursi Siswa']),
        papan_tulis: parseNumber(row['Papan Tulis']),
        komputer: parseNumber(row['Komputer']),
        
        wc_guru_laki_baik: parseNumber(row['WC Guru Laki Baik']),
        wc_guru_laki_rusak_ringan: parseNumber(row['WC Guru Laki Rusak Ringan']),
        wc_guru_laki_rusak_sedang: parseNumber(row['WC Guru Laki Rusak Sedang']),
        wc_guru_laki_rusak_berat: parseNumber(row['WC Guru Laki Rusak Berat']),
        wc_guru_laki_rusak_total: parseNumber(row['WC Guru Laki Rusak Total']),
        jumlah_wc_guru_laki: parseNumber(row['Jumlah WC Guru Laki']),
        
        wc_guru_perempuan_baik: parseNumber(row['WC Guru Perempuan Baik']),
        wc_guru_perempuan_rusak_ringan: parseNumber(row['WC Guru Perempuan Rusak Ringan']),
        wc_guru_perempuan_rusak_sedang: parseNumber(row['WC Guru Perempuan Rusak Sedang']),
        wc_guru_perempuan_rusak_berat: parseNumber(row['WC Guru Perempuan Rusak Berat']),
        wc_guru_perempuan_rusak_total: parseNumber(row['WC Guru Perempuan Rusak Total']),
        jumlah_wc_guru_perempuan: parseNumber(row['Jumlah WC Guru Perempuan']),
        
        wc_siswa_laki_baik: parseNumber(row['WC Siswa Laki Baik']),
        wc_siswa_laki_rusak_ringan: parseNumber(row['WC Siswa Laki Rusak Ringan']),
        wc_siswa_laki_rusak_sedang: parseNumber(row['WC Siswa Laki Rusak Sedang']),
        wc_siswa_laki_rusak_berat: parseNumber(row['WC Siswa Laki Rusak Berat']),
        wc_siswa_laki_rusak_total: parseNumber(row['WC Siswa Laki Rusak Total']),
        jumlah_wc_siswa_laki: parseNumber(row['Jumlah WC Siswa Laki']),
        
        wc_siswa_perempuan_baik: parseNumber(row['WC Siswa Perempuan Baik']),
        wc_siswa_perempuan_rusak_ringan: parseNumber(row['WC Siswa Perempuani Rusak Ringan'] || row['WC Siswa Perempuan Rusak Ringan']),
        wc_siswa_perempuan_rusak_sedang: parseNumber(row['WC Siswa Perempuan Rusak Sedang']),
        wc_siswa_perempuan_rusak_berat: parseNumber(row['WC Siswa Perempuan Rusak Berat']),
        wc_siswa_perempuan_rusak_total: parseNumber(row['WC Siswa Perempuan Rusak Total']),
        jumlah_wc_siswa_perempuan: parseNumber(row['Jumlah WC Siswa Perempuan']),
      };
    }).filter(row => row.npsn); // Ensure NPSN exists

    // We do batch upsert using UPSERT ON CONFLICT (npsn, periode)
    // To avoid duplicates in memory, let's keep only the last one for each NPSN in this batch
    const uniqueMap = new Map();
    formattedData.forEach(row => {
      uniqueMap.set(row.npsn, row);
    });
    
    const uniqueData = Array.from(uniqueMap.values());

    const batchSize = 1000;
    for (let i = 0; i < uniqueData.length; i += batchSize) {
      const chunk = uniqueData.slice(i, i + batchSize);
      const { error } = await supabase
        .from('satuan_pendidikan')
        .upsert(chunk, { onConflict: 'npsn,periode', ignoreDuplicates: false });
      
      if (error) {
        console.error('Supabase error chunk:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ message: 'Data berhasil diunggah', count: uniqueData.length }), { status: 200 });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
