const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true });
  await page.goto('http://127.0.0.1:3010/analise-loa', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Detalhamento Analítico Editável' }).waitFor({ timeout: 30000 });
  const button = page.getByRole('button', { name: 'CSV LOA' });
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  const path = await download.path();
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  const addedLine = lines.find((line) => line.includes('2757 - Era técnica'));
  console.log(JSON.stringify({ lines: lines.length, header: lines[0], firstData: lines[1], addedLine, bytes: Buffer.byteLength(content) }));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
