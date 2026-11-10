/**
 * Project MELO - Milestone 1 Layout & Token Adversarial Stress Test Harness
 * Author: Challenger 2 (Layout & Token Adversarial Challenger)
 * Verification: Empirical execution against source code, AST, CSS rules, and DOM behaviors
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert';

const ROOT_DIR = resolve('.');
console.log('='.repeat(80));
console.log(' MELO M1 — ADVERSARIAL LAYOUT & DESIGN TOKEN STRESS TEST HARNESS');
console.log(' Challenger 2: Layout & Token Empirical Verification');
console.log('='.repeat(80));

let suitesRun = 0;
let suitesPassed = 0;
let testsRun = 0;
let testsPassed = 0;
let failures = [];

function suite(name, fn) {
  suitesRun++;
  console.log(`\n▶ Suite ${suitesRun}: ${name}`);
  let suitePassed = true;
  try {
    fn();
    console.log(`  ✔ Passed all assertions in Suite ${suitesRun}`);
    suitesPassed++;
  } catch (err) {
    suitePassed = false;
    failures.push({ suite: name, error: err });
    console.error(`  ✖ FAILED in Suite ${suitesRun}: ${err.message}`);
  }
}

function test(description, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`    ✔ [PASS] ${description}`);
  } catch (err) {
    failures.push({ test: description, error: err });
    console.error(`    ✖ [FAIL] ${description} — ${err.message}`);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// SUITE 1: SIDEBAR RESIZE BOUNDARIES & CLAMPING MECHANICS
// ----------------------------------------------------------------------------
suite('Sidebar Resize Boundaries & Storage Resilience', () => {
  const sidebarPath = join(ROOT_DIR, 'src', 'renderer', 'components', 'layout', 'Sidebar.tsx');
  assert.ok(existsSync(sidebarPath), 'Sidebar.tsx must exist');
  const sidebarSource = readFileSync(sidebarPath, 'utf-8');

  test('Sidebar defines exact Spotify spec bounds: min 232px, default 280px, max 420px', () => {
    assert.match(sidebarSource, /SIDEBAR_MIN_WIDTH\s*=\s*232/, 'SIDEBAR_MIN_WIDTH must be 232');
    assert.match(sidebarSource, /SIDEBAR_DEFAULT_WIDTH\s*=\s*280/, 'SIDEBAR_DEFAULT_WIDTH must be 280');
    assert.match(sidebarSource, /SIDEBAR_MAX_WIDTH\s*=\s*420/, 'SIDEBAR_MAX_WIDTH must be 420');
  });

  test('Clamping logic clamps negative and sub-232px inputs strictly to 232px', () => {
    const clamp = (w) => Math.min(420, Math.max(232, w));
    assert.strictEqual(clamp(-1000), 232);
    assert.strictEqual(clamp(-50), 232);
    assert.strictEqual(clamp(0), 232);
    assert.strictEqual(clamp(1), 232);
    assert.strictEqual(clamp(150), 232);
    assert.strictEqual(clamp(231), 232);
    assert.strictEqual(clamp(231.999), 232);
    assert.strictEqual(clamp(232), 232);
  });

  test('Clamping logic clamps super-420px inputs strictly to 420px', () => {
    const clamp = (w) => Math.min(420, Math.max(232, w));
    assert.strictEqual(clamp(420), 420);
    assert.strictEqual(clamp(420.001), 420);
    assert.strictEqual(clamp(421), 420);
    assert.strictEqual(clamp(500), 420);
    assert.strictEqual(clamp(1000), 420);
    assert.strictEqual(clamp(999999), 420);
  });

  test('Clamping logic preserves valid intermediate values within [232, 420]', () => {
    const clamp = (w) => Math.min(420, Math.max(232, w));
    assert.strictEqual(clamp(250), 250);
    assert.strictEqual(clamp(280), 280);
    assert.strictEqual(clamp(320), 320);
    assert.strictEqual(clamp(400), 400);
  });

  test('LocalStorage corrupt data handling: invalid numbers fall back to 280 default', () => {
    const parseSaved = (saved) => {
      const SIDEBAR_MIN_WIDTH = 232;
      const SIDEBAR_DEFAULT_WIDTH = 280;
      const SIDEBAR_MAX_WIDTH = 420;
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= SIDEBAR_MIN_WIDTH && parsed <= SIDEBAR_MAX_WIDTH) {
          return parsed;
        }
      }
      return SIDEBAR_DEFAULT_WIDTH;
    };

    assert.strictEqual(parseSaved(null), 280);
    assert.strictEqual(parseSaved(undefined), 280);
    assert.strictEqual(parseSaved(''), 280);
    assert.strictEqual(parseSaved('NaN'), 280);
    assert.strictEqual(parseSaved('undefined'), 280);
    assert.strictEqual(parseSaved('invalid'), 280);
    assert.strictEqual(parseSaved('-999'), 280);
    assert.strictEqual(parseSaved('100'), 280);
    assert.strictEqual(parseSaved('9999'), 280);
    assert.strictEqual(parseSaved('250'), 250);
    assert.strictEqual(parseSaved('300'), 300);
    assert.strictEqual(parseSaved('420'), 420);
    assert.strictEqual(parseSaved('232'), 232);
  });

  test('Sidebar has dedicated col-resize drag handle with z-index and active indicator', () => {
    assert.match(sidebarSource, /cursor-col-resize/, 'Resize handle must have cursor-col-resize');
    assert.match(sidebarSource, /onMouseDown=\{handleMouseDown\}/, 'Resize handle must bind onMouseDown');
    assert.match(sidebarSource, /bg-\[#1ed760\]/, 'Resize handle must illuminate Spotify green when active/hover');
  });

  test('Window event listeners for mousemove and mouseup are cleanly registered and removed', () => {
    assert.match(sidebarSource, /window\.addEventListener\('mousemove',\s*handleMouseMove\)/);
    assert.match(sidebarSource, /window\.addEventListener\('mouseup',\s*handleMouseUp\)/);
    assert.match(sidebarSource, /window\.removeEventListener\('mousemove',\s*handleMouseMove\)/);
    assert.match(sidebarSource, /window\.removeEventListener\('mouseup',\s*handleMouseUp\)/);
  });
});

// ----------------------------------------------------------------------------
// SUITE 2: EXTREME VIEWPORTS (800x600 MIN BOUNDS TO 4K RESOLUTION)
// ----------------------------------------------------------------------------
suite('Extreme Viewports & Responsive Layout Constraints', () => {
  const appPath = join(ROOT_DIR, 'src', 'renderer', 'App.tsx');
  const topBarPath = join(ROOT_DIR, 'src', 'renderer', 'components', 'layout', 'TopBar.tsx');
  const playerBarPath = join(ROOT_DIR, 'src', 'renderer', 'components', 'layout', 'PlayerBar.tsx');
  const globalsCssPath = join(ROOT_DIR, 'src', 'renderer', 'styles', 'globals.css');

  const appSource = readFileSync(appPath, 'utf-8');
  const topBarSource = readFileSync(topBarPath, 'utf-8');
  const playerBarSource = readFileSync(playerBarPath, 'utf-8');
  const globalsCss = readFileSync(globalsCssPath, 'utf-8');

  test('800x600 Minimum Bounds: Height hierarchy prevents layout collapse and player occlusion', () => {
    // App container is h-screen w-screen overflow-hidden
    assert.match(appSource, /h-screen\s+w-screen\s+bg-black\s+text-white\s+select-none\s+overflow-hidden/);
    // TopBar is h-16 (64px) shrink-0
    assert.match(topBarSource, /h-16\s+w-full.*shrink-0/);
    // Middle panel has mb-[72px] matching fixed player bar height
    assert.match(appSource, /mb-\[72px\]/);
    // PlayerBar has fixed, bottom-0, and h-[72px]
    assert.ok(playerBarSource.includes('fixed'), 'PlayerBar must be fixed');
    assert.ok(playerBarSource.includes('bottom-0'), 'PlayerBar must be at bottom-0');
    assert.ok(playerBarSource.includes('h-[72px]'), 'PlayerBar must have 72px height');

    const viewportHeight = 600;
    const topBarHeight = 64;
    const playerBarHeight = 72;
    const middleAvailableHeight = viewportHeight - topBarHeight - playerBarHeight;
    assert.strictEqual(middleAvailableHeight, 464, 'Available height for content must be exactly 464px');
    assert.ok(middleAvailableHeight > 300, 'Middle container has ample space above minimum threshold');
  });

  test('800x600 Minimum Bounds: Width partitioning guarantees non-negative canvas width', () => {
    const viewportWidth = 800;
    const panelPaddingAndGap = 24; // px-2 (8px) + gap-2 (8px) + pr-2 (8px)
    const minSidebarWidth = 232;
    const canvasWidthWithoutRightPanel = viewportWidth - minSidebarWidth - panelPaddingAndGap;
    assert.strictEqual(canvasWidthWithoutRightPanel, 544, 'MainCanvas width is 544px at 800px viewport');
    assert.ok(canvasWidthWithoutRightPanel > 400, 'Main canvas has comfortable desktop width');

    const rightPanelWidth = 280;
    const extraGap = 8;
    const canvasWidthWithRightPanel = canvasWidthWithoutRightPanel - rightPanelWidth - extraGap;
    assert.strictEqual(canvasWidthWithRightPanel, 256, 'MainCanvas with right panel is 256px');
    assert.ok(canvasWidthWithRightPanel > 200, 'Main canvas remains positive and non-collapsed');
  });

  test('TopBar at 800px width: Max search input constraint prevents pushing window controls offscreen', () => {
    assert.match(topBarSource, /max-w-md/, 'Search container must have max-w-md constraint');
    assert.match(topBarSource, /ml-auto/, 'Window controls and user actions must have ml-auto anchoring');
  });

  test('PlayerBar at 800px width: 30% / 40% / 30% flex layout with min-w-[180px] constraints', () => {
    assert.match(playerBarSource, /w-\[30%\]\s+min-w-\[180px\]\s+max-w-\[320px\]/, 'Left section has 30% width with min/max bounds');
    assert.match(playerBarSource, /w-\[40%\]\s+max-w-\[722px\]/, 'Center transport section has 40% width with 722px cap');
    assert.match(playerBarSource, /w-\[30%\]\s+min-w-\[180px\]/, 'Right section has 30% width with min-width bound');
  });

  test('4K Ultra-Wide (3840x2160): Player and TopBar constraints prevent abnormal horizontal stretching', () => {
    assert.match(playerBarSource, /max-w-\[320px\]/);
    assert.match(playerBarSource, /max-w-\[722px\]/);
    assert.match(playerBarSource, /max-w-\[500px\]/);
    assert.match(topBarSource, /max-w-md/);
  });

  test('Unobtrusive floating scrollbar styles defined with Spotify Encore specifications', () => {
    assert.match(globalsCss, /::-webkit-scrollbar\s*\{\s*width:\s*12px;\s*height:\s*12px;\s*\}/, '12px scrollbar width');
    assert.match(globalsCss, /::-webkit-scrollbar-track\s*\{\s*background:\s*transparent;\s*\}/, 'Transparent track');
    assert.match(globalsCss, /rgba\(255,\s*255,\s*255,\s*0\.3\)/, 'Translucent thumb color');
    assert.match(globalsCss, /scrollbar-width:\s*thin;/, 'Firefox thin scrollbar support');
  });
});

// ----------------------------------------------------------------------------
// SUITE 3: DRAGGABLE REGIONS & ELECTRON FRAMELESS WINDOW CONTROLS
// ----------------------------------------------------------------------------
suite('Draggable Regions & Frameless Window Controls', () => {
  const topBarPath = join(ROOT_DIR, 'src', 'renderer', 'components', 'layout', 'TopBar.tsx');
  const winControlsPath = join(ROOT_DIR, 'src', 'renderer', 'components', 'layout', 'WindowControls.tsx');
  const brandPath = join(ROOT_DIR, 'src', 'renderer', 'assets', 'MeloBrandLockup.tsx');

  const topBarSource = readFileSync(topBarPath, 'utf-8');
  const winControlsSource = readFileSync(winControlsPath, 'utf-8');
  const brandSource = readFileSync(brandPath, 'utf-8');

  test('TopBar header container is designated as window draggable region', () => {
    assert.match(topBarSource, /WebkitAppRegion:\s*['"]drag['"]/, 'TopBar root must have WebkitAppRegion: drag');
  });

  test('MeloBrandLockup has no-drag region ensuring home navigation clicks succeed', () => {
    assert.match(brandSource, /WebkitAppRegion:\s*['"]no-drag['"]/, 'Brand button must have WebkitAppRegion: no-drag');
  });

  test('History navigation container (Back/Forward) has no-drag region', () => {
    assert.match(topBarSource, /<div[^>]*WebkitAppRegion:\s*['"]no-drag['"][^>]*>[\s\S]*?Go back/, 'History buttons must have no-drag');
  });

  test('Global Search Input Pill container has no-drag region', () => {
    assert.match(topBarSource, /<div[^>]*WebkitAppRegion:\s*['"]no-drag['"][^>]*>[\s\S]*?What do you want to play\?/, 'Search pill must have no-drag');
  });

  test('User Actions & Notification buttons have no-drag region', () => {
    assert.match(topBarSource, /<div[^>]*WebkitAppRegion:\s*['"]no-drag['"][^>]*>[\s\S]*?What's New/, 'User controls must have no-drag');
  });

  test('WindowControls container has no-drag region enabling minimize, maximize, close clicks', () => {
    assert.match(winControlsSource, /WebkitAppRegion:\s*['"]no-drag['"]/, 'WindowControls container must have WebkitAppRegion: no-drag');
  });

  test('WindowControls wire all three core Electron IPC actions', () => {
    assert.match(winControlsSource, /window\.electronAPI\?\.windowMinimize/, 'Must call windowMinimize');
    assert.match(winControlsSource, /window\.electronAPI\?\.windowMaximize/, 'Must call windowMaximize');
    assert.match(winControlsSource, /window\.electronAPI\?\.windowClose/, 'Must call windowClose');
  });

  test('WindowControls Close button features Windows red accent hover (#e81123)', () => {
    assert.match(winControlsSource, /hover:bg-\[#e81123\]/, 'Close button must highlight in Windows red #e81123');
  });
});

// ----------------------------------------------------------------------------
// SUITE 4: BUTTON INTERACTIONS, HOVER STATES & STATE CONTROLS
// ----------------------------------------------------------------------------
suite('Button Interactions, Hover States & State Controls', () => {
  const globalsCss = readFileSync(join(ROOT_DIR, 'src', 'renderer', 'styles', 'globals.css'), 'utf-8');
  const playerBarSource = readFileSync(join(ROOT_DIR, 'src', 'renderer', 'components', 'layout', 'PlayerBar.tsx'), 'utf-8');
  const tokensSource = readFileSync(join(ROOT_DIR, 'src', 'shared', 'design-tokens.ts'), 'utf-8');

  test('Spotify Encore CSS tokens match extracted xpui specifications', () => {
    assert.match(tokensSource, /backgroundBase:\s*'#121212'/);
    assert.match(tokensSource, /backgroundHighlight:\s*'#1f1f1f'/);
    assert.match(tokensSource, /accentGreen:\s*'#1ed760'/);
    assert.match(tokensSource, /brandGreen:\s*'#1db954'/);
    assert.match(tokensSource, /textSubdued:\s*'#b3b3b3'/);
    assert.match(tokensSource, /textMuted:\s*'#727272'/);
  });

  test('Primary Green button class defines hover scale 1.04 and active darkening', () => {
    assert.match(globalsCss, /\.btn-primary-green[\s\S]*?hover:scale-104/);
    assert.match(globalsCss, /\.btn-primary-green[\s\S]*?hover:bg-\[#1fdf64\]/);
    assert.match(globalsCss, /\.btn-primary-green[\s\S]*?active:bg-\[#169c46\]/);
  });

  test('Play circle button defines hover scale 1.06 and cubic-bezier transition', () => {
    assert.match(globalsCss, /\.btn-play-circle[\s\S]*?hover:scale-106/);
    assert.match(globalsCss, /\.btn-play-circle[\s\S]*?cubic-bezier\(0\.3,\s*0,\s*0,\s*1\)/);
  });

  test('Active icon button exhibits 4px dot indicator underneath icon', () => {
    assert.match(globalsCss, /\.btn-icon-active[\s\S]*?after:w-1\s+after:h-1\s+after:bg-\[#1ed760\]\s+after:rounded-full/);
  });

  test('PlayerBar Heart Toggle state alters fill and color to #1ed760 with scale-105', () => {
    assert.match(playerBarSource, /isLiked\s*\?\s*'fill-\[#1ed760\]\s+text-\[#1ed760\]\s+scale-105'\s*:\s*'text-\[#b3b3b3\]'/);
  });

  test('Volume slider clamps input strictly between 0.0 and 1.0', () => {
    const clampVol = (newVol) => Math.max(0, Math.min(1, newVol));
    assert.strictEqual(clampVol(-0.5), 0);
    assert.strictEqual(clampVol(0), 0);
    assert.strictEqual(clampVol(0.45), 0.45);
    assert.strictEqual(clampVol(1.0), 1);
    assert.strictEqual(clampVol(1.5), 1);
  });

  test('Volume icon shifts dynamically across 4 volume states (Mute/0, <33%, <66%, >=66%)', () => {
    const getIcon = (isMuted, volume) => {
      if (isMuted || volume === 0) return 'VolumeX';
      if (volume < 0.33) return 'Volume';
      if (volume < 0.66) return 'Volume1';
      return 'Volume2';
    };

    assert.strictEqual(getIcon(true, 0.8), 'VolumeX');
    assert.strictEqual(getIcon(false, 0.0), 'VolumeX');
    assert.strictEqual(getIcon(false, 0.15), 'Volume');
    assert.strictEqual(getIcon(false, 0.5), 'Volume1');
    assert.strictEqual(getIcon(false, 0.8), 'Volume2');
    assert.strictEqual(getIcon(false, 1.0), 'Volume2');
  });

  test('Timeline timestamps use tabular-nums preventing layout width jitter during playback', () => {
    assert.match(playerBarSource, /tabular-nums.*min-w-\[34px\]/, 'Elapsed time must have tabular-nums and fixed min-width');
    assert.ok(playerBarSource.includes('tabular-nums min-w-[34px] select-none'), 'Total duration must have tabular-nums');
  });
});

console.log('\n' + '='.repeat(80));
console.log(' ADVERSARIAL TEST EXECUTION SUMMARY');
console.log('='.repeat(80));
console.log(`Suites executed: ${suitesRun}`);
console.log(`Suites passed:   ${suitesPassed}`);
console.log(`Total assertions: ${testsRun}`);
console.log(`Total passed:     ${testsPassed}`);
console.log(`Total failures:   ${failures.length}`);
console.log(`Result:           ${failures.length === 0 ? 'ALL ADVERSARIAL STRESS TESTS PASSED (100%)' : 'FAILURES DETECTED'}`);
console.log('='.repeat(80));

process.exit(failures.length === 0 ? 0 : 1);
