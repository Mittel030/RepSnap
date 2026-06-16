const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 430, height: 932 });

  await page.goto('http://localhost:3344');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/tmp/rs_auth.png' });

  await page.click('#demo-login');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/tmp/rs_feed.png' });

  await page.click('[data-route="friends"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/tmp/rs_friends.png' });

  await page.click('[data-route="groups"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/tmp/rs_groups.png' });

  await page.click('[data-route="profile"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/tmp/rs_profile.png' });

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e.message); process.exit(1); });
