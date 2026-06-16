const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto('http://localhost:3344');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/tmp/rs_logo_auth.png' });
  await page.click('#demo-login');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/tmp/rs_logo_feed.png' });
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e.message); process.exit(1); });
