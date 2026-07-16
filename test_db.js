const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://phdbkfvqupbkvzcjlptv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGJrZnZxdXBia3Z6Y2pscHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDcyMDAsImV4cCI6MjA5OTQ4MzIwMH0.ba0eG9nq6EjsfOZAdD0U2U6jiEeTa_Z_r4m7w9T_lK4');

async function check() {
  const { data, error } = await supabase.from('siswa').select('kecamatan_siswa, kabupaten_siswa');
  if (error) {
    console.error(error);
    return;
  }
  
  const kecT = new Set();
  const kabT = new Set();
  
  data.forEach(d => {
    kecT.add(d.kecamatan_siswa);
    kabT.add(d.kabupaten_siswa);
  });
  
  console.log("KECAMATAN:", Array.from(kecT).slice(0, 50));
  console.log("KABUPATEN:", Array.from(kabT).slice(0, 50));
  
  // Find all that have "Tomohon" in kecamatan
  const tom = Array.from(kecT).filter(k => (k||'').toLowerCase().includes('tomohon'));
  console.log("KECAMATAN WITH TOMOHON:", tom);
}

check();
