const { URL } = require('url');
const { extract } = require('./utils');
const solvehCaptcha = require('hcaptcha-solver');

const SITE_KEY_REGEXP = /sitekey="([^"]+)/;
const CHALLENGE_FORM_ACTION_REGEXP = /id="challenge-form" action="([^"]+)/;
const CHALLENGE_FORM_REGEXP = /<form class="challenge-form[^>]*>([\s\S]*?)<\/form>/;
const INPUT_REGEXP = /<\s*input(.*?)[^>]*>/gm;
const NAME_REGEXP = /name="([^"]*)/;
const ID_REGEXP = /id="([^"]*)/;
const VALUE_REGEXP = /value="([^"]*)/;

function extractChallengeData(content) {
  const challengeForm = extract(content, CHALLENGE_FORM_REGEXP, "could't find challenge form");

  let match;
  const postData = {};
  const inputRegexp = new RegExp(INPUT_REGEXP);

  while ((match = inputRegexp.exec(challengeForm)) !== null) {
    const input = match[0];
    let idOrName = extract(input, ID_REGEXP);
    if (!idOrName) {
      idOrName = extract(input, NAME_REGEXP);
    }
    if (idOrName) {
      const value = extract(input, VALUE_REGEXP) || '';
      postData[idOrName] = encodeURIComponent(value);
    }
  }

  return postData;
}

async function handleCaptcha(content, request, options) {
  let { uri, url, solveCaptcha } = options;
  url = url || uri;

  const siteKey = extract(content, SITE_KEY_REGEXP, "could't find the site key");
  const challengeFormAction = extract(
    content,
    CHALLENGE_FORM_ACTION_REGEXP,
    "could't find the challenge form action"
  );
  const postData = extractChallengeData(content);
  const captchaResponse = solveCaptcha
    ? await solveCaptcha(siteKey, url, content)
    : await solvehCaptcha(url);

  if (captchaResponse) {
    postData['g-captcha-response'] = captchaResponse;
    postData['h-captcha-response'] = captchaResponse;
    const { href } = new URL(challengeFormAction, url);
    await request({
      ...options,
      method: 'POST',
      simple: false,
      uri: href,
      headers: {
        ...options.headers,
        'content-type': 'application/x-www-form-urlencoded'
      },
      form: postData
    });
  } else {
    throw new Error("solveCaptcha didn't returned a captcha");
  }
}

module.exports = handleCaptcha;
