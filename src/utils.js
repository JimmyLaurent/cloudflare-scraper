function extract(string, regexp, errorMessage) {
  const match = string.match(regexp);
  if (match) {
    return match[1];
  }
  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

function isCloudflareJSChallenge(body) {
  return body.includes('cf-browser-verification');
}

function isCloudflareCaptchaChallenge(body) {
  return body.includes('cf_captcha_kind');
}

module.exports = { extract, isCloudflareJSChallenge, isCloudflareCaptchaChallenge };
