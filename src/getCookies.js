const puppeteer = require('puppeteer');

async function getCookies(url) {
  let options = {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36'
    ]
  };

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
  });

  let response = await page.goto(url, {
    timeout: 45000,
    waitUntil: 'domcontentloaded'
  });
  let count = 0;
  let title = await page.title();
  while (title === 'Just a moment...') {
    response = await page.waitForNavigation({
      timeout: 45000,
      waitUntil: 'domcontentloaded'
    });
    title = await page.title();
    count++;
    if (count === 10) {
      throw new Error('timeout on just a moment');
    }
  }
  if (title === 'Attention Required! | Cloudflare') {
    throw new Error('Captcha error');
  }
  const cookies = await page.cookies();
  await browser.close();
  return cookies;
}

module.exports = getCookies;
