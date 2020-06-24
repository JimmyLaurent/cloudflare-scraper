const { addExtra } = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getUserAgent } = require('./utils');

const {
  PUPPETEER_HEADLESS = 'true',
  PUPPETEER_IGNORE_HTTPS_ERROR = 'false',
  HTTP_PROXY,
  HTTPS_PROXY
} = process.env;

let chromium;
let puppeteerCore;
try {
  puppeteerCore = require('puppeteer');
} catch (e) {}
if (!puppeteerCore) {
  try {
    chromium = require('chrome-aws-lambda');
    puppeteerCore = chromium.puppeteer;
  } catch (e) {
    throw new Error(
      'Missing puppeteer dependency (yarn add puppeteer or yarn add puppeteer-core chrome-aws-lambda)'
    );
  }
}

const puppeteer = addExtra(puppeteerCore);
const stealth = StealthPlugin();
puppeteer.use(stealth);

async function createBrowser(options) {
  const {
    proxy = HTTP_PROXY || HTTPS_PROXY,
    browserWSEndpoint,
    browserUrl,
    puppeteerOptions: userPuppeteerOptions = {}
  } = options;
  const ignoreHTTPSErrors = PUPPETEER_IGNORE_HTTPS_ERROR === 'true';

  if (browserWSEndpoint || browserUrl) {
    return puppeteer.connect({ browserWSEndpoint, browserUrl, ignoreHTTPSErrors });
  }

  let args = ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=' + getUserAgent()];
  if(userPuppeteerOptions.args) {
    args = args.concat(userPuppeteerOptions.args)
  }
  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
  }

  let puppeteerOptions = {
    headless: PUPPETEER_HEADLESS === 'true',
    ignoreHTTPSErrors,
    ...userPuppeteerOptions,
    args
  };

  if (chromium) {
    puppeteerOptions = {
      ...puppeteerOptions,
      args: chromium.args.concat(args),
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    };
  }

  return await puppeteer.launch(puppeteerOptions);
}

module.exports = createBrowser;
