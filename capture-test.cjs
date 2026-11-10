const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'electron_log.txt');
function log(msg) {
  fs.appendFileSync(logFile, msg + '\n');
}

log('Electron script started');

app.whenReady().then(async () => {
  try {
    log('app ready');
    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const indexPath = path.join(__dirname, 'dist', 'index.html');
    log('loading: ' + indexPath);
    await win.loadFile(indexPath);
    log('loaded successfully');
    await new Promise(r => setTimeout(r, 1500));

    const image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(__dirname, 'electron_test_capture.png'), image.toPNG());
    log('captured successfully');
  } catch (err) {
    log('ERROR: ' + err.stack);
  } finally {
    app.quit();
  }
}).catch(err => {
  log('WHEN_READY_ERROR: ' + err.stack);
});
