import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'data.json');

export async function GET() {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return NextResponse.json([]);
    }
    const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    if (!fileContent) {
      return NextResponse.json([]);
    }
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 });
  }
}
