const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage({ viewport: { width: 430, height: 932 } });
  await page.goto('http://localhost:3344');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'C:\tmp\final_01_auth.png' });
  await page.click('#demo-login');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'C:\tmp\final_02_feed.png' });
  await page.click('.nav-btn[data-route="profile"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'C:\tmp\final_03_profile.png' });
  await page.click('.nav-btn[data-route="groups"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'C:\tmp\final_04_groups.png' });
  console.log('screenshots done');
  await browser.close();
})();
