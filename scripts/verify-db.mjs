import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

async function verifyDb() {
  const dbPath = path.resolve('melo.db');
  console.log('Verifying SQLite DB at:', dbPath);
  if (!fs.existsSync(dbPath)) {
    console.error('melo.db NOT FOUND on disk!');
    process.exit(1);
  }
  const stats = fs.statSync(dbPath);
  console.log('File size:', stats.size, 'bytes');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables:', tables[0].values.flat());

  const tracks = db.exec('SELECT count(*) FROM catalog_tracks');
  console.log('Catalog tracks count:', tracks[0].values[0][0]);

  const playlists = db.exec('SELECT count(*) FROM playlists');
  console.log('Playlists count:', playlists[0].values[0][0]);

  const sampleTracks = db.exec('SELECT id, title, artist, release_year FROM catalog_tracks LIMIT 10');
  console.log('Sample tracks in melo.db:');
  for (const row of sampleTracks[0].values) {
    console.log(`  [${row[0]}] "${row[1]}" by ${row[2]} (${row[3]})`);
  }

  const samplePlaylists = db.exec('SELECT id, name FROM playlists LIMIT 5');
  console.log('Sample playlists in melo.db:');
  for (const row of samplePlaylists[0].values) {
    console.log(`  [${row[0]}] "${row[1]}"`);
  }

  db.close();
  console.log('\nSQLite database persistence (melo.db) VERIFIED successfully.');
}

verifyDb().catch(e => {
  console.error(e);
  process.exit(1);
});
