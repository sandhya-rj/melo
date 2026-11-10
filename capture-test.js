const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
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
  await win.loadFile(indexPath);
  await new Promise(r => setTimeout(r, 1500));

  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(__dirname, 'electron_test_capture.png'), image.toPNG());
  console.log('CAPTURE_SUCCESS');
  app.quit();
});
