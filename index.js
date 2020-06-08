const request = require('request-promise-native');
const { Cookie } = require('tough-cookie');
const getUserAgent = require('./src/getUserAgent');
const getCookies = require('./src/getCookies');

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

async function fillCookiesJar(jar, url) {
  const cookies = await getCookies(url);
  for (let cookie of cookies) {
    jar.setCookie(convertCookieToTough(cookie), url);
  }
  return jar;
}

async function cloudlareScraper(options) {
	const { jar, url, uri } = options;

  const targetUrl = uri || url;
	const cookies = jar.getCookies(targetUrl);

  const clearanceCookie = cookies.find((c) => c.key === 'cf_clearance');
  if (!clearanceCookie || clearanceCookie.expires < Date.now()) {
    try {
      return await request(options);
    } catch (e) {
      if (e.statusCode !== 503 || e.response.headers.server !== 'cloudflare') {
        throw e;
      }
    }
    await fillCookiesJar(jar, targetUrl);
  }
  return request(options);
}

const defaultParams = {
  jar: request.jar(),
  headers: { 'User-Agent': getUserAgent() },
  gzip: true
};

module.exports = request.defaults(defaultParams, cloudlareScraper);
