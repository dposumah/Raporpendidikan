import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

export const revalidate = 0; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('spm_data')
      .select('*')
      .order('tahun', { ascending: true })
      .order('indeks_spm', { ascending: true });

    if (error) {
      console.error('Supabase GET error:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { tahun, indeks_spm, nilai_capaian, label_capaian } = body;

    if (!tahun || !indeks_spm || nilai_capaian === undefined) {
      return NextResponse.json({ error: 'Tahun, Indeks SPM, dan Nilai Capaian wajib diisi.' }, { status: 400 });
    }

    // Cek apakah data dengan tahun dan indeks yang sama sudah ada
    const { data: existingData } = await supabase
      .from('spm_data')
      .select('id')
      .eq('tahun', tahun)
      .eq('indeks_spm', indeks_spm)
      .single();

    let result;

    if (existingData) {
      // Update data jika sudah ada
      result = await supabase
        .from('spm_data')
        .update({
          nilai_capaian: Number(nilai_capaian),
          label_capaian: label_capaian || null
        })
        .eq('id', existingData.id)
        .select();
    } else {
      // Insert data baru
      result = await supabase
        .from('spm_data')
        .insert([{
          tahun,
          indeks_spm,
          nilai_capaian: Number(nilai_capaian),
          label_capaian: label_capaian || null
        }])
        .select();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ message: 'Data SPM berhasil disimpan', data: result.data });
  } catch (error) {
    console.error('Supabase POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
