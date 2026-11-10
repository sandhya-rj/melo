const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'runner.log');
fs.writeFileSync(logFile, 'runner started at ' + new Date().toISOString() + '\n');

app.whenReady().then(async () => {
  fs.appendFileSync(logFile, 'app.whenReady reached\n');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false
  });
  const htmlPath = path.resolve(__dirname, '../../dist/index.html');
  fs.appendFileSync(logFile, 'loading ' + htmlPath + '\n');
  await win.loadFile(htmlPath);
  fs.appendFileSync(logFile, 'loaded html\n');
  await new Promise(r => setTimeout(r, 1000));
  const img = await win.webContents.capturePage();
  const outPath = path.resolve(__dirname, '../screenshots/melo/01_melo_home.png');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, img.toPNG());
  fs.appendFileSync(logFile, 'saved screenshot to ' + outPath + ' (' + fs.statSync(outPath).size + ' bytes)\n');
  app.quit();
}).catch(err => {
  fs.appendFileSync(logFile, 'ERROR: ' + err.stack + '\n');
  app.quit();
});
