const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3010/analise-loa', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Detalhamento Analítico Editável' }).waitFor({ timeout: 30000 });
  const headers = await page.locator('th').allTextContents();
  const required = ['Valor LOA (Vigente)', 'Valor Reajuste', 'Valor Aditamento', 'Valor Total', 'Diferença'];
  const missing = required.filter((label) => !headers.some((header) => header.includes(label)));
  console.log(JSON.stringify({ missing, reajusteInputs: await page.locator('input').filter({ has: undefined }).count(), headers: headers.filter((header) => required.some((label) => header.includes(label))).slice(0, 10) }));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
