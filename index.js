const request = require('request-promise');
const { Cookie } = require('tough-cookie');
const getCookies = require('./src/getCookies');

const DEFAULT_EXPIRATION_TIME_IN_SECONDS = 3000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36';

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

async function cloudlareScraper({ jar, url, uri, ...rest }) {
	const targetUrl = uri || url;
  const cookies = jar.getCookies(targetUrl);
  const clearanceCookie = cookies.find((c) => c.key === 'cf_clearance');
  if (!clearanceCookie || clearanceCookie.expires < Date.now()) {
    await fillCookiesJar(jar, targetUrl);
  }

  return request({
    uri: targetUrl,
    jar,
    ...rest
  });
}

const defaultParams = {
  jar: request.jar(),
  headers: { 'User-Agent': USER_AGENT },
  gzip: true
};

module.exports = request.defaults(defaultParams, cloudlareScraper);
