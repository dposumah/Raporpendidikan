import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseExcelData } from '../../../utils/excelParser';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'data.json');

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

    // Baca data yang ada
    let existingData = [];
    if (fs.existsSync(DATA_FILE_PATH)) {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      if (fileContent) {
        existingData = JSON.parse(fileContent);
      }
    }

    // Hapus data dengan tahun yang sama (overwrite)
    const filteredData = existingData.filter(item => item.tahun !== parseInt(tahun, 10));
    
    // Gabungkan data baru
    const newData = [...filteredData, ...parsedData];

    // Simpan ke file JSON
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(newData, null, 2));

    return NextResponse.json({ success: true, message: `Berhasil memproses ${parsedData.length} baris untuk tahun ${tahun}` });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: 'Gagal memproses file' }, { status: 500 });
  }
}
