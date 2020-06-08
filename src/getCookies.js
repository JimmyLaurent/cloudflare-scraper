const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const getUserAgent = require('./getUserAgent');
puppeteer.use(StealthPlugin());

const { PUPPETEER_HEADLESS = 'true' } = process.env;

async function getCookies(url) {
  let options = {
    headless: PUPPETEER_HEADLESS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--user-agent=' + getUserAgent()
    ]
  };

  const browser = await puppeteer.launch(options);
  try {
    const page = await browser.newPage();

    let response = await page.goto(url, {
      timeout: 45000,
      waitUntil: 'domcontentloaded'
    });
    let count = 0;
    let content = await page.content();
    while (content.includes('cf-browser-verification')) {
      response = await page.waitForNavigation({
        timeout: 45000,
        waitUntil: 'domcontentloaded'
      });
      content = await page.content();
      count++;
      if (count === 10) {
        throw new Error('timeout on just a moment');
      }
    }
    const title = await page.title();
    if (title === 'Attention Required! | Cloudflare') {
      throw new Error('Captcha error');
    }
    const cookies = await page.cookies();

    return cookies;
  } finally {
    await browser.close();
  }
}

module.exports = getCookies;
