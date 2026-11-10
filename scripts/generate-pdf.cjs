const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function markdownToHtml(md) {
  const lines = md.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeLang = '';
  let inTable = false;
  let tableHeaderParsed = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html += '</code></pre>\n';
        inCodeBlock = false;
      } else {
        if (inList) { html += '</ul>\n'; inList = false; }
        if (inTable) { html += '</tbody></table>\n'; inTable = false; }
        codeLang = line.trim().slice(3).trim();
        html += '<pre><code class="language-' + codeLang + '">';
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      html += line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;') + '\n';
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      const cells = line.trim().split('|').slice(1, -1).map(c => c.trim());
      
      // Check if separator line
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        tableHeaderParsed = true;
        continue;
      }

      if (!inTable) {
        html += '<table class="doc-table">\n';
        html += '<thead><tr>' + cells.map(c => '<th>' + formatInline(c) + '</th>').join('') + '</tr></thead>\n<tbody>\n';
        inTable = true;
        tableHeaderParsed = false;
      } else {
        html += '<tr>' + cells.map(c => '<td>' + formatInline(c) + '</td>').join('') + '</tr>\n';
      }
      continue;
    } else if (inTable) {
      html += '</tbody></table>\n';
      inTable = false;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      const itemContent = line.trim().slice(2).trim();
      html += '<li>' + formatInline(itemContent) + '</li>\n';
      continue;
    } else if (inList && line.trim() === '') {
      html += '</ul>\n';
      inList = false;
    }

    // Horizontal Rule
    if (/^---{1,}$/.test(line.trim()) || /^\*\*\*{1,}$/.test(line.trim())) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += '<hr />\n';
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += '<h1>' + formatInline(line.slice(2).trim()) + '</h1>\n';
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += '<h2>' + formatInline(line.slice(3).trim()) + '</h2>\n';
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += '<h3>' + formatInline(line.slice(4).trim()) + '</h3>\n';
      continue;
    }
    if (line.startsWith('#### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += '<h4>' + formatInline(line.slice(5).trim()) + '</h4>\n';
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('> ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += '<blockquote>' + formatInline(line.trim().slice(2).trim()) + '</blockquote>\n';
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      if (inList) { html += '</ul>\n'; inList = false; }
      continue;
    }

    // Paragraph
    html += '<p>' + formatInline(line.trim()) + '</p>\n';
  }

  if (inTable) html += '</tbody></table>\n';
  if (inList) html += '</ul>\n';
  if (inCodeBlock) html += '</code></pre>\n';

  return html;
}

function formatInline(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

app.whenReady().then(async () => {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const mdPath = path.join(rootDir, 'documentation', 'REA_INVESTIGATION_REPORT.md');
    const outPdfPath = path.join(rootDir, 'documentation', 'REA_INVESTIGATION_REPORT.pdf');
    const tempHtmlPath = path.join(rootDir, 'documentation', 'temp_report.html');

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const bodyHtml = markdownToHtml(mdContent);

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>REA Investigation Report - Project MELO</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.55;
      font-size: 10.5pt;
      margin: 0;
      padding: 0;
    }
    h1 {
      color: #0b5c2c;
      font-size: 22pt;
      font-weight: 800;
      border-bottom: 2.5px solid #1ed760;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 16px;
    }
    h2 {
      color: #121212;
      font-size: 15pt;
      font-weight: 700;
      border-bottom: 1.5px solid #e0e0e0;
      padding-bottom: 5px;
      margin-top: 24px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    h3 {
      color: #2b2b2b;
      font-size: 12pt;
      font-weight: 600;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    h4 {
      color: #3b3b3b;
      font-size: 11pt;
      font-weight: 600;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }
    hr {
      border: 0;
      border-top: 1px solid #dcdcdc;
      margin: 20px 0;
    }
    ul {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 22px;
    }
    li {
      margin-bottom: 4px;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 9pt;
      background-color: #f3f4f6;
      padding: 2px 5px;
      border-radius: 3px;
      border: 1px solid #e5e7eb;
      color: #b91c1c;
    }
    pre {
      background-color: #18181b;
      color: #f4f4f5;
      padding: 12px 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 8.5pt;
      line-height: 1.4;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      border: none;
      color: inherit;
    }
    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    table.doc-table th, table.doc-table td {
      border: 1px solid #d1d5db;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }
    table.doc-table th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #111827;
    }
    table.doc-table tr:nth-child(even) td {
      background-color: #fafafa;
    }
    blockquote {
      border-left: 4px solid #1ed760;
      margin: 12px 0;
      padding: 6px 14px;
      background-color: #f9fafb;
      color: #4b5563;
      font-style: italic;
    }
    .header-badge {
      display: inline-block;
      background-color: #1ed760;
      color: #000;
      font-size: 9pt;
      font-weight: bold;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');

    const win = new BrowserWindow({
      show: false,
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    await win.loadFile(tempHtmlPath);
    await new Promise(res => setTimeout(res, 1000));

    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5
      }
    });

    fs.writeFileSync(outPdfPath, pdfBuffer);
    console.log('SUCCESS: Generated PDF at ' + outPdfPath + ' (size: ' + pdfBuffer.length + ' bytes)');

    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  } catch (err) {
    console.error('ERROR generating PDF:', err);
    process.exit(1);
  } finally {
    app.quit();
  }
});
