import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

async function updateDbYears() {
  const dbPath = path.resolve('melo.db');
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  db.run('UPDATE catalog_tracks SET release_year = 2026');
  
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log('Updated melo.db catalog_tracks release_year to 2026.');
  const res = db.exec('SELECT id, title, release_year FROM catalog_tracks');
  for (const row of res[0].values) {
    console.log(`  [${row[0]}] "${row[1]}" -> ${row[2]}`);
  }
  db.close();
}

updateDbYears().catch(e => {
  console.error(e);
  process.exit(1);
});
