import fs from 'fs';
import path from 'path';

const dirs = [
  'public/audio',
  'public/sample-audio',
  'public/assets/audio'
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.mp3')) {
      const srcPath = path.join(dir, file);
      const dstPath = path.join(dir, file.replace(/\.mp3$/, '.wav'));
      fs.copyFileSync(srcPath, dstPath);
      console.log(`Copied ${srcPath} -> ${dstPath}`);
    }
  }
}
console.log('Audio copy complete!');
