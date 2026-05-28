const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_DIR = path.join(DATA_DIR, 'fmat');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

  if (files.length === 0) {
    console.error('No Excel files found');
    process.exit(1);
  }

  const pattern = /^data_([^_]+(?:_[^_]+)*)_(\d{1,2})\.(\d{1,2})\.(\d{4})(?:_(\d+))?$/;
  const parsed = [];

  for (const filename of files) {
    const nameWithoutExt = filename.replace(/\.(xlsx|xls)$/i, '');
    const match = nameWithoutExt.match(pattern);
    if (!match) continue;

    const label = match[1];
    const day = parseInt(match[2]);
    const month = parseInt(match[3]);
    const year = parseInt(match[4]);
    const version = match[5] ? parseInt(match[5]) : 0;

    if (day < 1 || day > 31 || month < 1 || month > 12) continue;

    parsed.push({
      filename,
      fullPath: path.join(DATA_DIR, filename),
      label,
      date: new Date(year, month - 1, day),
      version
    });
  }

  parsed.sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.version - a.version;
  });

  const latest = parsed[0];
  console.log(`Converting: ${latest.filename}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(latest.fullPath);
  const worksheet = workbook.worksheets[0];

  const headers = [
    'Periodo', 'Tipo', 'Asignatura', 'GRUPO', 'PE', 'Semestre',
    'Horas_a_la_semana', 'Modalidad', 'Nombres', 'Apellidos', 'Creditos', 'Modelo',
    'Lunes', 'Aula1', 'Martes', 'Aula2', 'Miercoles', 'Aula3', 'Jueves', 'Aula4', 'Viernes', 'Aula5'
  ];

  const normalizeKey = (key) => key.trim().toLowerCase().replace(/[^\wáéíóúüñ]/g, '').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i');

  const find = (row, keys) => {
    for (const key of keys) {
      const foundKey = Object.keys(row).find(k => normalizeKey(k) === normalizeKey(key));
      if (foundKey && row[foundKey] !== undefined) return String(row[foundKey] || '');
    }
    return '';
  };

  const csvLines = [headers.map(h => `"${h}"`).join(',')];
  let rowCount = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowObj = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      let value = '';
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === 'object' && 'text' in cell.value) {
          value = cell.value.text;
        } else if (cell.value instanceof Date) {
          value = cell.value.toISOString();
        } else {
          value = String(cell.value);
        }
      }
      rowObj[String(colNumber)] = value;
    });

    const aulaKeys = Object.keys(rowObj).filter(k => String(rowObj[k]).toLowerCase().startsWith('aula') || normalizeKey(String(rowObj[k])).startsWith('aul'));

    const line = [
      find(rowObj, ['Periodo']),
      find(rowObj, ['Tipo']),
      find(rowObj, ['Asignatura']),
      find(rowObj, ['GRUPO']),
      find(rowObj, ['PE']),
      find(rowObj, ['Semestre']),
      find(rowObj, ['Horas_a_la_semana']),
      find(rowObj, ['Modalidad']),
      find(rowObj, ['Nombres']),
      find(rowObj, ['Apellidos']),
      find(rowObj, ['Creditos']),
      find(rowObj, ['Modelo']),
      find(rowObj, ['Lunes']),
      '', // Aula1
      find(rowObj, ['Martes']),
      '', // Aula2
      find(rowObj, ['Miercoles']),
      '', // Aula3
      find(rowObj, ['Jueves']),
      '', // Aula4
      find(rowObj, ['Viernes']),
      '', // Aula5
    ].map(v => `"${v.replace(/"/g, '""')}"`).join(',');

    csvLines.push(line);
    rowCount++;
  });

  const day = latest.date.getDate().toString().padStart(2, '0');
  const month = (latest.date.getMonth() + 1).toString().padStart(2, '0');
  const year = latest.date.getFullYear();
  const version = latest.version > 0 ? `_${latest.version}` : '';
  const outputFile = `data_fmat_${day}.${month}.${year}${version}.csv`;

  fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), csvLines.join('\n'), 'utf-8');
  console.log(`Written: ${outputFile} (${rowCount} rows)`);
}

main().catch(err => { console.error(err); process.exit(1); });