const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.error('Page error:', err.message);
  });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:3000');
  await browser.close();
})();
