const xlsx = require('xlsx');

const workbook = xlsx.readFile('Rapor Pendidikan 2025.xlsx');
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\n--- Checking duplicates for A.1 in 2025 ---');
let a1_rows = [];
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (!row || row.length === 0) continue;
  if (row[2] === 'A.1' && row[0] === 'SMA Umum' && row[1] === 'Semua') {
    a1_rows.push({
      No: row[2],
      Indikator: row[3],
      Nilai: row[5]
    });
  }
}
console.log(a1_rows);
