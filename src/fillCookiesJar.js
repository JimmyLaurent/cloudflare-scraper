const puppeteer = require('puppeteer-extra');
const { Cookie } = require('tough-cookie');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const getUserAgent = require('./getUserAgent');
const handleCaptcha = require('./handleCaptcha');

puppeteer.use(StealthPlugin());

const { PUPPETEER_HEADLESS = 'true', PUPPETEER_IGNORE_HTTPS_ERROR = 'false' } = process.env;
const DEFAULT_EXPIRATION_TIME_IN_SECONDS = 3000;

function convertCookieToTough(cookie) {
  const { name, value, expires, domain, path } = cookie;
  const isExpiresValid = expires && typeof expires === 'number';

  const expiresDate = isExpiresValid
    ? new Date(expires * 1000)
    : new Date(Date.now() + DEFAULT_EXPIRATION_TIME_IN_SECONDS * 1000);

  return new Cookie({
    key: name,
    value,
    expires: expiresDate,
    domain: domain.startsWith('.') ? domain.substring(1) : domain,
    path
  });
}

async function fillCookiesJar(request, options) {
  const puppeteerOptions = {
    headless: PUPPETEER_HEADLESS === 'true',
    ignoreHTTPSErrors: PUPPETEER_IGNORE_HTTPS_ERROR === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=' + getUserAgent()]
  };

  const { HTTP_PROXY, HTTPS_PROXY } = process.env;
  let { proxy, jar, url, uri } = options;
  url = url || uri;
  proxy = proxy || HTTP_PROXY || HTTPS_PROXY;
  if (proxy) {
    puppeteerOptions.args.push(`--proxy-server=${proxy}`);
  }

  const browser = await puppeteer.launch(puppeteerOptions);
  try {
    const page = await browser.newPage();
    let response = await page.goto(url, {
      timeout: 45000,
      waitUntil: 'domcontentloaded'
    });

    let count = 1;
    let content = await page.content();
    while (content.includes('cf-browser-verification')) {
      response = await page.waitForNavigation({
        timeout: 45000,
        waitUntil: 'domcontentloaded'
      });
      content = await page.content();
      if (count++ === 10) {
        throw new Error('timeout on just a moment');
      }
    }

    content = await page.content();
    if (content.includes('cf_captcha_kind')) {
      await handleCaptcha(content, request, options);
    }

    const cookies = await page.cookies();
    for (let cookie of cookies) {
      jar.setCookie(convertCookieToTough(cookie), url);
    }
  } finally {
    await browser.close();
  }
}

module.exports = fillCookiesJar;
