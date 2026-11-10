import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = resolve('.');
const TEST_DIRS = [
  join(ROOT_DIR, 'tests', 'unit'),
  join(ROOT_DIR, 'tests', 'integration'),
  join(ROOT_DIR, 'tests', 'e2e')
];

function findTestFiles(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...findTestFiles(fullPath));
      } else if (entry.endsWith('.test.ts') || entry.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // ignore
  }
  return files;
}

const allTestFiles = TEST_DIRS.flatMap(findTestFiles);

console.log('='.repeat(80));
console.log(' MELO DESKTOP APPLICATION — AUTOMATED TEST SUITE RUNNER');
console.log('='.repeat(80));
console.log(`Discovered ${allTestFiles.length} test files across unit, integration, and e2e tiers.\n`);

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const testFile of allTestFiles) {
  const relativeName = testFile.replace(ROOT_DIR, '').replace(/^[\\\/]/, '');
  process.stdout.write(` Running ${relativeName} ... `);

  const start = Date.now();
  const proc = spawnSync('node', ['--experimental-strip-types', '--test', `"${testFile}"`], {
    encoding: 'utf-8',
    shell: true
  });
  const duration = Date.now() - start;

  if (proc.status === 0) {
    // Parse test count from stdout: "ℹ pass X"
    const passMatch = proc.stdout.match(/ℹ pass (\d+)/);
    const passCount = passMatch ? parseInt(passMatch[1], 10) : 1;
    totalPassed += passCount;
    results.push({ file: relativeName, status: 'PASSED', count: passCount, duration });
    console.log(`\x1b[32mPASSED\x1b[0m (${passCount} tests, ${duration}ms)`);
  } else {
    const failMatch = proc.stdout.match(/ℹ fail (\d+)/);
    const failCount = failMatch ? parseInt(failMatch[1], 10) : 1;
    totalFailed += failCount;
    results.push({ file: relativeName, status: 'FAILED', count: failCount, duration, output: proc.stdout + proc.stderr });
    console.log(`\x1b[31mFAILED\x1b[0m (${failCount} failures, ${duration}ms)`);
    console.log(proc.stdout);
    console.log(proc.stderr);
  }
}

console.log('\n' + '='.repeat(80));
console.log(' TEST EXECUTION SUMMARY MATRIX');
console.log('='.repeat(80));
console.log(
  '| File Name'.padEnd(50) +
  '| Status'.padEnd(12) +
  '| Passed'.padEnd(10) +
  '| Duration |'
);
console.log('|' + '-'.repeat(49) + '|' + '-'.repeat(11) + '|' + '-'.repeat(9) + '|' + '-'.repeat(10) + '|');

for (const res of results) {
  const statusStr = res.status === 'PASSED' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(
    `| ${res.file.padEnd(47)} ` +
    `| ${statusStr.padEnd(19)} ` +
    `| ${String(res.count).padEnd(7)} ` +
    `| ${String(res.duration) + 'ms'} |`
  );
}

console.log('='.repeat(80));
console.log(`TOTAL SUITES: ${allTestFiles.length}`);
console.log(`TOTAL TESTS PASSED: ${totalPassed}`);
console.log(`TOTAL TESTS FAILED: ${totalFailed}`);
console.log(`OVERALL STATUS: ${totalFailed === 0 ? '\x1b[32m100% PASS\x1b[0m' : '\x1b[31mFAILURES DETECTED\x1b[0m'}`);
console.log('='.repeat(80));

process.exit(totalFailed === 0 ? 0 : 1);
