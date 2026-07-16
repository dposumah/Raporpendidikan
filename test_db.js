const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://phdbkfvqupbkvzcjlptv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGJrZnZxdXBia3Z6Y2pscHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDcyMDAsImV4cCI6MjA5OTQ4MzIwMH0.ba0eG9nq6EjsfOZAdD0U2U6jiEeTa_Z_r4m7w9T_lK4');

async function check() {
  const { data, error } = await supabase.from('siswa').select('kecamatan_siswa, kabupaten_siswa, nama_sekolah');
  if (error) {
    console.error(error);
    return;
  }
  
  let tomohonCount = 0;
  let luarCount = 0;
  let sampelLuar = [];
  
  data.forEach(s => {
    const kabRaw = (s.kabupaten_siswa || '').toLowerCase().trim();
    const kecRaw = (s.kecamatan_siswa || '').toLowerCase().trim();
    
    let isTomohon = false;
    if (kecRaw.includes('tomohon tengah') || kecRaw.includes('tomohon timur') || kecRaw.includes('tomohon barat') || kecRaw.includes('tomohon selatan') || kecRaw.includes('tomohon utara')) {
      isTomohon = true;
    } else if (kabRaw.includes('tomohon')) {
      if (kecRaw.includes('tengah') || kecRaw.includes('timur') || kecRaw.includes('barat') || kecRaw.includes('selatan') || kecRaw.includes('utara')) {
        isTomohon = true;
      }
    }
    
    if (isTomohon) {
        tomohonCount++;
    } else {
        luarCount++;
        sampelLuar.push({kab: kabRaw, kec: kecRaw});
    }
  });
  
  console.log(`Total: ${data.length}`);
  console.log(`Tomohon: ${tomohonCount}`);
  console.log(`Luar Tomohon: ${luarCount}`);
  console.log("Sampel Luar:", sampelLuar.slice(0, 5));
}

check();
