import { CookieJar } from 'tough-cookie';
import got from 'got';
import { convertCookieToTough } from './utils.js';
import { Browser } from './Browser.js';

let userAgent;
const jar = new CookieJar();

async function getUserAgent() {
  let browser;
  try {
    browser = await Browser.create();
    return await browser.getUserAgent();
  } finally {
    if (browser) {
      browser.close();
    }
  }
}

function isCloudflareJSChallenge(content) {
  return content.includes('_cf_chl_opt');
}

async function fillCookie(url) {
  let browser;
  try {
    browser = await Browser.create();
    await browser.navigate(url);

    const timeoutInMs = 16000;

    let count = 1;
    let content = '';
    while (content == '' || isCloudflareJSChallenge(content)) {
      await browser.waitUntil('networkAlmostIdle', timeoutInMs);
      content = await browser.getPageHtml();
      if (count++ > 10) {
        throw new Error('stuck');
      }
    }

    const cookies = await browser.getCookies();
    for (let cookie of cookies) {
      jar.setCookie(convertCookieToTough(cookie), url.toString());
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

const handler = (options, next) => {
  if (options.isStream) {
    throw new Error('stream not supported');
  }

  return (async () => {
    if (!userAgent) {
      // To improve: it's not optimised to start a browser
      // only to get its user agent but it reduces detection rate
      // since all requests have the same user agent.
      userAgent = await getUserAgent();
    }
    options.headers['user-agent'] = userAgent;

    let response;
    let error;
    try {
      response = await next(options);
    } catch (e) {
      response = e.response;
      error = e;
    }
    if (!response || !isCloudflareJSChallenge(response.body)) {
      if (error) {
        throw error;
      }
      return response;
    }
    await fillCookie(options.url);
    return got(undefined, undefined, options);
  })();
};

const instance = got.extend({
  cookieJar: jar,
  handlers: [handler]
});

export default instance;
