const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outputDir = path.resolve(__dirname, '../screenshots/melo');
fs.mkdirSync(outputDir, { recursive: true });

const logFile = path.join(__dirname, 'capture-all.log');
function log(msg) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

fs.writeFileSync(logFile, 'Starting automated screenshot capture for 10 MELO views...\n');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const htmlPath = path.resolve(__dirname, '../../dist/index.html');
  log(`Loading HTML from: ${htmlPath}`);
  await win.loadFile(htmlPath);
  await new Promise(r => setTimeout(r, 1200));

  async function capture(filename) {
    await new Promise(r => setTimeout(r, 600));
    const img = await win.webContents.capturePage();
    const dest = path.join(outputDir, filename);
    fs.writeFileSync(dest, img.toPNG());
    log(`Captured ${filename} (${fs.statSync(dest).size} bytes)`);
  }

  // Helper to click an element matching text or selector
  async function clickText(text) {
    return await win.webContents.executeJavaScript(`
      (() => {
        const els = Array.from(document.querySelectorAll('*'));
        const target = els.find(el => el.children.length === 0 && el.textContent.trim() === ${JSON.stringify(text)});
        if (target) {
          (target.closest('button') || target.closest('.cursor-pointer') || target).click();
          return true;
        }
        return false;
      })()
    `);
  }

  async function clickSelector(sel) {
    return await win.webContents.executeJavaScript(`
      (() => {
        const el = document.querySelector(${JSON.stringify(sel)});
        if (el) { el.click(); return true; }
        return false;
      })()
    `);
  }

  try {
    // 1. Home View
    log('Capturing 01_melo_home.png');
    await capture('01_melo_home.png');

    // 2. Search / Browse View
    log('Navigating to Search view...');
    await win.webContents.executeJavaScript(`
      const input = document.querySelector('input[placeholder="What do you want to play?"]');
      if (input) {
        input.focus();
        input.dispatchEvent(new Event('focus', { bubbles: true }));
      }
    `);
    await capture('02_melo_search_browse.png');

    // 3. Playlist View (Today's Top Hits)
    log('Navigating to Home then Playlist view...');
    await clickSelector('button[title="Go back"]');
    await clickText("Today's Top Hits");
    await capture('03_melo_playlist_view.png');

    // 4. Album View (Neon Nights / Hit Me Hard and Soft)
    log('Navigating to Album view...');
    await clickSelector('button[title="Go back"]');
    await clickText("Neon Nights");
    await capture('04_melo_album_view.png');

    // 5. Artist View (Synthwave Collective)
    log('Navigating to Artist view...');
    await clickSelector('button[title="Go back"]');
    await clickText("Synthwave Collective");
    await capture('05_melo_artist_view.png');

    // 6. Liked Songs View
    log('Navigating to Liked Songs view...');
    await clickSelector('button[title="Go back"]');
    await clickText("Liked Songs");
    await capture('06_melo_liked_songs.png');

    // 7. Queue View
    log('Navigating to Queue view...');
    await clickSelector('button[aria-label="Toggle queue"]');
    await capture('07_melo_queue_view.png');

    // 8. Settings View
    log('Navigating to Settings view...');
    await clickSelector('button[title="Settings & Profile"]');
    await capture('08_melo_settings_view.png');

    // 9. Context Menu
    log('Opening Context Menu on track row...');
    await clickSelector('button[title="Go back"]');
    await clickText("Today's Top Hits");
    await new Promise(r => setTimeout(r, 600));
    await win.webContents.executeJavaScript(`
      const row = document.querySelector('.group.hover\\\\:bg-\\\\[\\\\#ffffff1a\\\\]') || document.querySelector('tr') || document.querySelector('[data-testid="track-row"]') || document.querySelector('.cursor-pointer');
      if (row) {
        const rect = row.getBoundingClientRect();
        row.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 200,
          clientY: rect.top + 20
        }));
      }
    `);
    await capture('09_melo_context_menu.png');

    // 10. Player Bar Modal (Create Playlist Modal)
    log('Opening Create Playlist Modal...');
    // Dismiss context menu first
    await win.webContents.executeJavaScript(`document.body.click();`);
    await clickSelector('button[title="Create playlist or folder"]') || await clickSelector('button[aria-label="Create Playlist"]') || await clickText('+');
    await capture('10_melo_player_bar_modal.png');

    log('ALL 10 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    log('ERROR during screenshot generation: ' + err.stack);
  } finally {
    app.quit();
  }
}).catch(err => {
  log('WHEN_READY_FATAL: ' + err.stack);
  app.quit();
});
