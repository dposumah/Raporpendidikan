import * as xlsx from 'xlsx';

export function parseExcelData(buffer, defaultTahun) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const parsedData = [];
  const seenKey = new Set();
  
  for (const sheetName of workbook.SheetNames) {
    // Tentukan tahun: Ekstrak 4 digit tahun (20xx) dari nama sheet
    let tahun = defaultTahun;
    const match = sheetName.match(/\b(20\d{2})\b/);
    if (match) {
      tahun = match[1];
    }
    console.log(`Membaca sheet: "${sheetName}" -> Tahun Terdeteksi: ${tahun}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Baris pertama adalah header, data mulai dari baris ke-1 (index 1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const jenisSatuan = row[0];
      const statusSatuan = row[1];
      const kodeIndikator = row[2];
      
      // Deduplikasi: Hanya ambil baris pertama (utama) untuk setiap kode indikator di tahun tersebut
      const key = `${tahun}_${jenisSatuan}_${statusSatuan}_${kodeIndikator}`;
      if (seenKey.has(key)) continue;
      
      let namaIndikatorRaw = row[3] || '';
      const labelCapaian = row[4];
      const nilaiTeks = row[5] || '';
      const definisiCapaian = row[6] || '';
      const perbandinganTeks = row[7] || '';

      // Ambil kalimat pertama sebagai judul, sisanya sebagai glosarium
      let namaIndikator = namaIndikatorRaw;
      let glosarium = definisiCapaian;

      if (namaIndikatorRaw.includes('\n') || namaIndikatorRaw.includes('\r\n')) {
        const separator = namaIndikatorRaw.includes('\r\n') ? '\r\n' : '\n';
        const parts = namaIndikatorRaw.split(separator);
        namaIndikator = parts[0].trim();
        
        // Ambil sisa teks sebagai glosarium (jika ada)
        const rest = parts.slice(1).join(' ').trim();
        if (rest) glosarium = rest;
      }

      // Parse nilai angka
      let nilaiAngka = null;
      if (nilaiTeks && typeof nilaiTeks === 'string') {
        if (!nilaiTeks.includes('Tidak Tersedia') && !nilaiTeks.includes('Tidak ada data')) {
          // Hapus % dan ganti koma dengan titik untuk parsing float
          const cleanString = nilaiTeks.replace('%', '').replace(',', '.').trim();
          const parsed = parseFloat(cleanString);
          if (!isNaN(parsed)) {
            nilaiAngka = parsed;
          }
        }
      } else if (typeof nilaiTeks === 'number') {
        nilaiAngka = nilaiTeks;
      }

      if (kodeIndikator && namaIndikator) {
        seenKey.add(key);
        parsedData.push({
          id: crypto.randomUUID(),
          tahun: parseInt(tahun, 10),
          jenis_satuan_pendidikan: jenisSatuan,
          status_satuan_pendidikan: statusSatuan,
          kode_indikator: kodeIndikator,
          nama_indikator: namaIndikator,
          glosarium: glosarium,
          label_capaian: labelCapaian,
          nilai_angka: nilaiAngka,
          nilai_teks: nilaiTeks.toString(),
          definisi_capaian: definisiCapaian,
          perbandingan_teks: perbandinganTeks ? perbandinganTeks.toString() : null
        });
      }
    }
  }

  return parsedData;
}
