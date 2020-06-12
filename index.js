const request = require('request-promise-native');
const { isProtectedByStormwall, getStormwallCookie } = require('stormwall-bypass');
const { getUserAgent } = require('./src/utils');
const fillCookiesJar = require('./src/fillCookiesJar');
const { isCloudflareJSChallenge, isCloudflareCaptchaChallenge } = require('./src/utils');

function isCloudflareIUAMError(error) {
  if (error.response) {
    const { body } = error.response;
    return isCloudflareJSChallenge(body) || isCloudflareCaptchaChallenge(body);
  }
  return false;
}

async function handleError(error) {
  if (isCloudflareIUAMError(error)) {
    const { options } = error;
    await fillCookiesJar(request, options);
    return request(options);
  }
  throw error;
}

function handleResponse(response, options) {
  const { jar, url, uri } = options;
  const targetUrl = uri || url;
  const body = response.body || response;
  if (isProtectedByStormwall(body)) {
    const cookie = getStormwallCookie(body);
    jar.setCookie(cookie, targetUrl);
    return request(options);
  }
  return response;
}

async function cloudflareScraper(options) {
  const response = await request({ ...options }).catch(handleError);
  return handleResponse(response, options);
}

const defaultParams = {
  jar: request.jar(),
  headers: { 'User-Agent': getUserAgent() },
  gzip: true
};

module.exports = request.defaults(defaultParams, cloudflareScraper);
