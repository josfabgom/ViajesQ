const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  await context.addInitScript(() => {
    window.localStorage.setItem('viajesq_token', 'fake-token-123');
    window.localStorage.setItem('viajesq_user', JSON.stringify({ id: 1, name: 'Admin', role: 'admin' }));
  });

  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.stack));
  
  await page.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, name: 'Admin', role: 'admin' })
    });
  });

  await page.route('**/api/admin/*', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  
  console.log("Navigating to https://soporteq.tech/dashboard ...");
  await page.goto('https://soporteq.tech/dashboard', { waitUntil: 'networkidle' });
  
  console.log("Done.");
  await browser.close();
})();
