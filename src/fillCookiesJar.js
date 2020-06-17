const createBrowser = require('./createBrowser');
const { Cookie } = require('tough-cookie');
const handleCaptcha = require('./handleCaptcha');
const { isCloudflareJSChallenge, isCloudflareCaptchaChallenge } = require('./utils');
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
  let { jar, url, uri } = options;
  url = url || uri;

  const browser = await createBrowser(options);
  try {
    const page = await browser.newPage();
    let response = await page.goto(url, {
      timeout: 45000,
      waitUntil: 'domcontentloaded'
    });

    let count = 1;
    let content = await page.content();
    if (isCloudflareCaptchaChallenge(content)) {
      await handleCaptcha(content, request, options);
    } else {
      while (isCloudflareJSChallenge(content)) {
        response = await page.waitForNavigation({
          timeout: 45000,
          waitUntil: 'domcontentloaded'
        });
        content = await page.content();
        if (count++ === 10) {
          throw new Error('timeout on just a moment');
        }
      }
      if (isCloudflareCaptchaChallenge(content)) {
        await handleCaptcha(content, request, options);
      }
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
